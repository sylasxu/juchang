// Feedback Service - 纯业务逻辑，无 HTTP 依赖
import {
  db,
  feedbacks,
  activities,
  participants,
  users,
  eq,
  and,
  count,
  desc,
} from '@juchang/db';
import type {
  CreateFeedbackRequest,
  FeedbackListQuery,
  FeedbackListResponse,
  UserFeedbackStats,
  FeedbackDetail,
} from './feedback.model';

/**
 * 验证用户是否为活动参与者
 */
async function isActivityParticipant(
  activityId: string,
  userId: string
): Promise<boolean> {
  const [participant] = await db
    .select()
    .from(participants)
    .where(
      and(
        eq(participants.activityId, activityId),
        eq(participants.userId, userId),
        eq(participants.status, 'approved')
      )
    )
    .limit(1);

  return !!participant;
}

/**
 * 检查是否已提交过反馈
 */
async function hasSubmittedFeedback(
  activityId: string,
  reporterId: string,
  targetId: string
): Promise<boolean> {
  const [existing] = await db
    .select()
    .from(feedbacks)
    .where(
      and(
        eq(feedbacks.activityId, activityId),
        eq(feedbacks.reporterId, reporterId),
        eq(feedbacks.targetId, targetId)
      )
    )
    .limit(1);

  return !!existing;
}

/**
 * 提交差评反馈
 */
export async function createFeedback(
  reporterId: string,
  data: CreateFeedbackRequest
) {
  const { activityId, targetId, reason, description } = data;

  // 验证活动存在
  const [activity] = await db
    .select()
    .from(activities)
    .where(eq(activities.id, activityId))
    .limit(1);

  if (!activity) {
    throw new Error('活动不存在');
  }

  // 验证活动已结束
  if (activity.status !== 'finished') {
    throw new Error('活动尚未结束，无法提交反馈');
  }

  // 验证提交者是活动参与者
  const isParticipant = await isActivityParticipant(activityId, reporterId);
  if (!isParticipant) {
    throw new Error('只有活动参与者才能提交反馈');
  }

  // 验证目标用户也是活动参与者
  const isTargetParticipant = await isActivityParticipant(activityId, targetId);
  if (!isTargetParticipant && activity.creatorId !== targetId) {
    throw new Error('被反馈用户不是活动参与者');
  }

  // 不能给自己提交反馈
  if (reporterId === targetId) {
    throw new Error('不能给自己提交反馈');
  }

  // 检查是否已提交过
  const alreadySubmitted = await hasSubmittedFeedback(
    activityId,
    reporterId,
    targetId
  );
  if (alreadySubmitted) {
    throw new Error('已对该用户提交过反馈');
  }

  // 创建反馈
  const [feedback] = await db
    .insert(feedbacks)
    .values({
      activityId,
      reporterId,
      targetId,
      reason,
      description: description || null,
    })
    .returning();

  // 更新目标用户的差评计数
  await db
    .update(users)
    .set({
      feedbackReceivedCount: (
        await db
          .select({ count: count() })
          .from(feedbacks)
          .where(eq(feedbacks.targetId, targetId))
      )[0].count,
    })
    .where(eq(users.id, targetId));

  return feedback;
}

/**
 * 获取反馈列表
 */
export async function getFeedbackList(
  query: FeedbackListQuery
): Promise<FeedbackListResponse> {
  const { page = 1, limit = 20, activityId, targetId, reason } = query;
  const offset = (page - 1) * limit;

  // 构建查询条件
  const conditions = [];
  if (activityId) {
    conditions.push(eq(feedbacks.activityId, activityId));
  }
  if (targetId) {
    conditions.push(eq(feedbacks.targetId, targetId));
  }
  if (reason) {
    conditions.push(eq(feedbacks.reason, reason));
  }

  const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

  // 查询数据
  const [data, totalResult] = await Promise.all([
    db
      .select({
        id: feedbacks.id,
        activityId: feedbacks.activityId,
        reporterId: feedbacks.reporterId,
        targetId: feedbacks.targetId,
        reason: feedbacks.reason,
        description: feedbacks.description,
        createdAt: feedbacks.createdAt,
        activityTitle: activities.title,
        reporterNickname: users.nickname,
      })
      .from(feedbacks)
      .leftJoin(activities, eq(feedbacks.activityId, activities.id))
      .leftJoin(users, eq(feedbacks.reporterId, users.id))
      .where(whereCondition)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(feedbacks.createdAt)),
    db.select({ count: count() }).from(feedbacks).where(whereCondition),
  ]);

  const total = totalResult[0]?.count || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    data: data as FeedbackDetail[],
    total,
    page,
    totalPages,
  };
}

/**
 * 获取用户差评统计
 */
export async function getUserFeedbackStats(
  userId: string
): Promise<UserFeedbackStats> {
  // 获取总数
  const [totalResult] = await db
    .select({ count: count() })
    .from(feedbacks)
    .where(eq(feedbacks.targetId, userId));

  const totalCount = totalResult?.count || 0;

  // 按原因分类统计
  const reasonStats = await db
    .select({
      reason: feedbacks.reason,
      count: count(),
    })
    .from(feedbacks)
    .where(eq(feedbacks.targetId, userId))
    .groupBy(feedbacks.reason);

  const byReason: Record<string, number> = {};
  for (const stat of reasonStats) {
    byReason[stat.reason] = stat.count;
  }

  return {
    totalCount,
    byReason,
  };
}

/**
 * 获取用户收到的差评详情列表
 */
export async function getUserFeedbacks(
  userId: string,
  query: { page?: number; limit?: number }
): Promise<FeedbackListResponse> {
  return getFeedbackList({
    ...query,
    targetId: userId,
  });
}
