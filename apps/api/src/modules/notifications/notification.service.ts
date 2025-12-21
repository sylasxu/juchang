// Notification Service - 纯业务逻辑，无 HTTP 依赖
import { db, notifications, eq, count, and, desc } from '@juchang/db';
import type { NotificationListQuery, NotificationListResponse, UnreadCountResponse } from './notification.model';

/**
 * 获取用户通知列表（分页 + 筛选）
 */
export async function getNotificationList(
  userId: string,
  query: NotificationListQuery
): Promise<NotificationListResponse> {
  const { page = 1, limit = 20, isRead, type } = query;
  const offset = (page - 1) * limit;

  // 构建查询条件
  const conditions = [eq(notifications.userId, userId)];
  
  if (typeof isRead === 'boolean') {
    conditions.push(eq(notifications.isRead, isRead));
  }
  
  if (type) {
    conditions.push(eq(notifications.type, type as any));
  }

  const whereCondition = and(...conditions);

  const [data, totalResult] = await Promise.all([
    db
      .select()
      .from(notifications)
      .where(whereCondition)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(notifications.createdAt)),
    db
      .select({ count: count() })
      .from(notifications)
      .where(whereCondition),
  ]);

  const total = totalResult[0]?.count || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    total,
    page,
    totalPages,
  };
}

/**
 * 根据 ID 获取通知详情
 */
export async function getNotificationById(id: string, userId: string) {
  const [notification] = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
    .limit(1);

  return notification || null;
}

/**
 * 标记单条通知为已读
 */
export async function markNotificationAsRead(id: string, userId: string): Promise<boolean> {
  const [updated] = await db
    .update(notifications)
    .set({
      isRead: true,
      readAt: new Date(),
    })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
    .returning();

  return !!updated;
}

/**
 * 批量标记通知为已读
 */
export async function markNotificationsAsRead(ids: string[], userId: string): Promise<number> {
  let updatedCount = 0;

  // 逐个更新以确保权限验证
  for (const id of ids) {
    const success = await markNotificationAsRead(id, userId);
    if (success) {
      updatedCount++;
    }
  }

  return updatedCount;
}

/**
 * 标记所有通知为已读
 */
export async function markAllNotificationsAsRead(userId: string): Promise<number> {
  const result = await db
    .update(notifications)
    .set({
      isRead: true,
      readAt: new Date(),
    })
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
    .returning();

  return result.length;
}

/**
 * 获取未读通知数量
 */
export async function getUnreadCount(userId: string): Promise<UnreadCountResponse> {
  const [result] = await db
    .select({ count: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

  return {
    count: result?.count || 0,
  };
}

/**
 * 删除通知
 */
export async function deleteNotification(id: string, userId: string): Promise<boolean> {
  const [deleted] = await db
    .delete(notifications)
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
    .returning();

  return !!deleted;
}

// ==========================================
// 通知创建服务 - Requirements 1.5
// ==========================================

/**
 * 通知类型定义
 */
export type NotificationType = 
  | 'application'        // 申请通知
  | 'approved'           // 申请通过
  | 'rejected'           // 申请拒绝
  | 'activity_remind'    // 活动提醒
  | 'feedback_received'  // 收到差评
  | 'system';            // 系统通知

/**
 * 创建通知的参数
 */
export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  content?: string;
  metadata?: {
    activityId?: string;
    applicantId?: string;
    participantId?: string;
    feedbackId?: string;
  };
}

/**
 * 创建通知
 */
export async function createNotification(params: CreateNotificationParams) {
  const { userId, type, title, content, metadata } = params;

  const [notification] = await db
    .insert(notifications)
    .values({
      userId,
      type,
      title,
      content: content || null,
      metadata: metadata || null,
      isRead: false,
    })
    .returning();

  return notification;
}

/**
 * 创建申请通知 - 当有人申请加入活动时
 */
export async function createApplicationNotification(
  organizerId: string,
  activityId: string,
  applicantId: string,
  activityTitle: string,
  applicantName: string
) {
  return createNotification({
    userId: organizerId,
    type: 'application',
    title: '新的活动申请',
    content: `${applicantName} 申请加入「${activityTitle}」`,
    metadata: { activityId, applicantId },
  });
}

/**
 * 创建申请结果通知 - 申请通过
 */
export async function createApprovedNotification(
  applicantId: string,
  activityId: string,
  activityTitle: string
) {
  return createNotification({
    userId: applicantId,
    type: 'approved',
    title: '申请已通过',
    content: `您申请加入「${activityTitle}」已通过`,
    metadata: { activityId },
  });
}

/**
 * 创建申请结果通知 - 申请拒绝
 */
export async function createRejectedNotification(
  applicantId: string,
  activityId: string,
  activityTitle: string,
  reason?: string
) {
  return createNotification({
    userId: applicantId,
    type: 'rejected',
    title: '申请未通过',
    content: reason 
      ? `您申请加入「${activityTitle}」未通过，原因：${reason}`
      : `您申请加入「${activityTitle}」未通过`,
    metadata: { activityId },
  });
}

/**
 * 创建活动提醒通知
 */
export async function createActivityRemindNotification(
  userId: string,
  activityId: string,
  activityTitle: string,
  reminderType: 'start_soon' | 'fulfillment' | 'cancelled' | 'postponed'
) {
  const messages = {
    start_soon: `活动「${activityTitle}」即将开始`,
    fulfillment: `活动「${activityTitle}」已结束，请确认履约情况`,
    cancelled: `活动「${activityTitle}」已取消`,
    postponed: `活动「${activityTitle}」已延期`,
  };

  return createNotification({
    userId,
    type: 'activity_remind',
    title: '活动提醒',
    content: messages[reminderType],
    metadata: { activityId },
  });
}

/**
 * 创建差评通知
 */
export async function createFeedbackReceivedNotification(
  userId: string,
  activityId: string,
  activityTitle: string,
  feedbackId: string
) {
  return createNotification({
    userId,
    type: 'feedback_received',
    title: '收到反馈',
    content: `您在活动「${activityTitle}」中收到了一条反馈`,
    metadata: { activityId, feedbackId },
  });
}

/**
 * 创建系统通知
 */
export async function createSystemNotification(
  userId: string,
  title: string,
  content: string
) {
  return createNotification({
    userId,
    type: 'system',
    title,
    content,
  });
}

/**
 * 批量创建通知 - 用于向多个用户发送相同通知
 */
export async function createBulkNotifications(
  userIds: string[],
  type: NotificationType,
  title: string,
  content?: string,
  metadata?: CreateNotificationParams['metadata']
) {
  if (userIds.length === 0) return [];

  const values = userIds.map(userId => ({
    userId,
    type,
    title,
    content: content || null,
    metadata: metadata || null,
    isRead: false,
  }));

  const created = await db
    .insert(notifications)
    .values(values)
    .returning();

  return created;
}
