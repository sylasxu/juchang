// Dashboard Service - MVP 简化版：只保留 Admin 基础统计
import { db, users, activities, eq, gte, desc, count } from '@juchang/db';
import type { DashboardStats, RecentActivity } from './dashboard.model';

/**
 * 获取仪表板统计数据
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const [
      totalUsersResult,
      totalActivitiesResult,
      activeActivitiesResult,
      todayNewUsersResult,
    ] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(activities),
      db.select({ count: count() })
        .from(activities)
        .where(eq(activities.status, 'active')),
      db.select({ count: count() })
        .from(users)
        .where(gte(users.createdAt, today)),
    ]);

    return {
      totalUsers: totalUsersResult[0]?.count || 0,
      totalActivities: totalActivitiesResult[0]?.count || 0,
      activeActivities: activeActivitiesResult[0]?.count || 0,
      todayNewUsers: todayNewUsersResult[0]?.count || 0,
    };
  } catch (error) {
    console.error('获取仪表板统计数据失败:', error);
    return {
      totalUsers: 0,
      totalActivities: 0,
      activeActivities: 0,
      todayNewUsers: 0,
    };
  }
}

/**
 * 获取最近活动列表
 */
export async function getRecentActivities(): Promise<RecentActivity[]> {
  try {
    const result = await db
      .select({
        id: activities.id,
        title: activities.title,
        creatorName: users.nickname,
        status: activities.status,
        currentParticipants: activities.currentParticipants,
        createdAt: activities.createdAt,
      })
      .from(activities)
      .innerJoin(users, eq(activities.creatorId, users.id))
      .orderBy(desc(activities.createdAt))
      .limit(10);

    return result.map((activity) => ({
      id: activity.id,
      title: activity.title,
      creatorName: activity.creatorName || '未知用户',
      participantCount: activity.currentParticipants || 0,
      status: activity.status,
      createdAt: activity.createdAt?.toISOString() || '',
    }));
  } catch (error) {
    console.error('获取最近活动失败:', error);
    return [];
  }
}
