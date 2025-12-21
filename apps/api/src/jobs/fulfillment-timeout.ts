/**
 * 履约超时自动确认任务
 * 
 * PRD 7.3: 活动结束后 48h 未确认，自动标记全员履约成功
 * 
 * 逻辑：
 * 1. 查找所有已结束但未确认的活动（endAt < now - 48h && isConfirmed = false）
 * 2. 将所有 approved 状态的参与者标记为 fulfilled
 * 3. 更新活动 isConfirmed = true
 * 4. 更新参与者的靠谱度统计
 */

import { db, activities, participants, users, eq, and, lt, sql } from '@juchang/db';

const FULFILLMENT_TIMEOUT_HOURS = 48;

export async function processExpiredFulfillments(): Promise<void> {
  const cutoffTime = new Date(Date.now() - FULFILLMENT_TIMEOUT_HOURS * 60 * 60 * 1000);

  // 查找超时未确认的活动
  const expiredActivities = await db
    .select({
      id: activities.id,
      title: activities.title,
      creatorId: activities.creatorId,
    })
    .from(activities)
    .where(
      and(
        eq(activities.status, 'finished'),
        eq(activities.isConfirmed, false),
        lt(activities.endAt, cutoffTime)
      )
    );

  if (expiredActivities.length === 0) {
    console.log('[FulfillmentTimeout] 没有需要处理的超时活动');
    return;
  }

  console.log(`[FulfillmentTimeout] 发现 ${expiredActivities.length} 个超时未确认的活动`);

  for (const activity of expiredActivities) {
    try {
      await processActivityFulfillment(activity.id, activity.title);
    } catch (error) {
      console.error(`[FulfillmentTimeout] 处理活动 ${activity.id} 失败:`, error);
    }
  }
}

async function processActivityFulfillment(activityId: string, activityTitle: string): Promise<void> {
  // 使用事务确保原子性
  await db.transaction(async (tx) => {
    // 1. 获取所有 approved 状态的参与者
    const approvedParticipants = await tx
      .select({
        id: participants.id,
        userId: participants.userId,
      })
      .from(participants)
      .where(
        and(
          eq(participants.activityId, activityId),
          eq(participants.status, 'approved')
        )
      );

    if (approvedParticipants.length === 0) {
      console.log(`[FulfillmentTimeout] 活动 "${activityTitle}" 没有待确认的参与者`);
    } else {
      // 2. 批量更新参与者状态为 fulfilled
      await tx
        .update(participants)
        .set({
          status: 'fulfilled',
          confirmedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(participants.activityId, activityId),
            eq(participants.status, 'approved')
          )
        );

      // 3. 更新每个参与者的履约统计
      for (const participant of approvedParticipants) {
        await tx
          .update(users)
          .set({
            fulfillmentCount: sql`${users.fulfillmentCount} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(users.id, participant.userId));
      }

      console.log(`[FulfillmentTimeout] 活动 "${activityTitle}" 自动确认 ${approvedParticipants.length} 名参与者履约`);
    }

    // 4. 标记活动已确认
    await tx
      .update(activities)
      .set({
        isConfirmed: true,
        confirmedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(activities.id, activityId));
  });

  console.log(`[FulfillmentTimeout] 活动 "${activityTitle}" 处理完成`);
}
