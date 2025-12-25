// Notification Service - MVP 简化版
import { db, notifications, eq, count, and, desc } from '@juchang/db';
import type { NotificationListQuery, NotificationListResponse, UnreadCountResponse } from './notification.model';

/**
 * 获取用户通知列表
 */
export async function getNotifications(
  userId: string,
  query: NotificationListQuery
): Promise<NotificationListResponse> {
  const { page = 1, limit = 20 } = query;
  const offset = (page - 1) * limit;

  const [data, totalResult] = await Promise.all([
    db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(notifications.createdAt)),
    db
      .select({ count: count() })
      .from(notifications)
      .where(eq(notifications.userId, userId)),
  ]);

  const total = totalResult[0]?.count || 0;
  const totalPages = Math.ceil(total / limit);

  return { data, total, page, totalPages };
}

/**
 * 标记通知为已读
 */
export async function markAsRead(id: string, userId: string): Promise<boolean> {
  const [updated] = await db
    .update(notifications)
    .set({
      isRead: true,
    })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
    .returning();

  return !!updated;
}

/**
 * 获取未读通知数量
 */
export async function getUnreadCount(userId: string): Promise<UnreadCountResponse> {
  const [result] = await db
    .select({ count: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

  return { count: result?.count || 0 };
}

// ==========================================
// 内部调用：创建通知
// DB 枚举类型: join, quit, activity_start, completed, cancelled
// ==========================================

type NotificationType = 'join' | 'quit' | 'activity_start' | 'completed' | 'cancelled';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  content?: string;
  activityId?: string;
}

/**
 * 创建通知（内部调用）
 */
export async function createNotification(params: CreateNotificationParams) {
  const { userId, type, title, content, activityId } = params;

  const [notification] = await db
    .insert(notifications)
    .values({
      userId,
      type,
      title,
      content: content || null,
      activityId: activityId || null,
      isRead: false,
    })
    .returning();

  return notification;
}

/**
 * 创建加入通知 - 有人报名活动
 */
export async function notifyJoin(
  organizerId: string,
  activityId: string,
  activityTitle: string,
  applicantName: string
) {
  return createNotification({
    userId: organizerId,
    type: 'join',
    title: '新成员加入',
    content: `${applicantName} 加入了「${activityTitle}」`,
    activityId,
  });
}

/**
 * 创建退出通知 - 有人退出活动
 */
export async function notifyQuit(
  organizerId: string,
  activityId: string,
  activityTitle: string,
  memberName: string
) {
  return createNotification({
    userId: organizerId,
    type: 'quit',
    title: '成员退出',
    content: `${memberName} 退出了「${activityTitle}」`,
    activityId,
  });
}

/**
 * 创建活动即将开始通知
 */
export async function notifyActivityStart(
  userId: string,
  activityId: string,
  activityTitle: string
) {
  return createNotification({
    userId,
    type: 'activity_start',
    title: '活动即将开始',
    content: `「${activityTitle}」即将开始`,
    activityId,
  });
}

/**
 * 创建活动成局通知
 */
export async function notifyCompleted(
  userId: string,
  activityId: string,
  activityTitle: string
) {
  return createNotification({
    userId,
    type: 'completed',
    title: '活动成局',
    content: `「${activityTitle}」已成局`,
    activityId,
  });
}

/**
 * 创建活动取消通知
 */
export async function notifyCancelled(
  userId: string,
  activityId: string,
  activityTitle: string
) {
  return createNotification({
    userId,
    type: 'cancelled',
    title: '活动取消',
    content: `「${activityTitle}」已取消`,
    activityId,
  });
}
