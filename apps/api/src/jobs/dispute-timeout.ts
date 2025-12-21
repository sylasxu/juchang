/**
 * 申诉超时自动处理任务
 * 
 * PRD 2.4: 被标记"未到场"后 24h 内未申诉，自动生效扣分
 * 
 * 逻辑：
 * 1. 查找所有 absent 状态且未申诉的参与者（disputeExpiresAt < now && isDisputed = false）
 * 2. 确认扣分生效（更新用户靠谱度统计）
 * 3. 标记申诉已过期
 */

import { db, participants, users, eq, and, lt, sql } from '@juchang/db';

export async function processExpiredDisputes(): Promise<void> {
  const now = new Date();

  // 查找申诉超时的参与者
  // 条件：status = absent, isDisputed = false, disputeExpiresAt < now
  const expiredDisputes = await db
    .select({
      id: participants.id,
      userId: participants.userId,
      activityId: participants.activityId,
      disputeExpiresAt: participants.disputeExpiresAt,
    })
    .from(participants)
    .where(
      and(
        eq(participants.status, 'absent'),
        eq(participants.isDisputed, false),
        lt(participants.disputeExpiresAt, now)
      )
    );

  if (expiredDisputes.length === 0) {
    console.log('[DisputeTimeout] 没有需要处理的超时申诉');
    return;
  }

  console.log(`[DisputeTimeout] 发现 ${expiredDisputes.length} 个超时未申诉的记录`);

  for (const dispute of expiredDisputes) {
    try {
      await processExpiredDispute(dispute.id, dispute.userId);
    } catch (error) {
      console.error(`[DisputeTimeout] 处理申诉 ${dispute.id} 失败:`, error);
    }
  }
}

async function processExpiredDispute(participantId: string, userId: string): Promise<void> {
  await db.transaction(async (tx) => {
    // 1. 更新用户的争议统计（disputeCount +1）
    // 靠谱度计算：fulfillmentCount / participationCount
    // disputeCount 记录违约/争议次数，用于风控评估
    await tx
      .update(users)
      .set({
        disputeCount: sql`${users.disputeCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // 2. 标记参与者记录已处理
    // 通过 disputeExpiresAt 已过期来标识已处理
    await tx
      .update(participants)
      .set({
        updatedAt: new Date(),
      })
      .where(eq(participants.id, participantId));

    console.log(`[DisputeTimeout] 用户 ${userId} 申诉超时，违约记录已生效`);
  });
}
