// Dashboard Service - Pure functions for dashboard data
import { db, users, activities, participants, eq, sql, and, gte, desc } from '@juchang/db';
import { count } from 'drizzle-orm';
import type { DashboardStats, RecentActivity, RiskUser } from './dashboard.model';

/**
 * 获取仪表板统计数据
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  try {
    // 并行查询多个统计数据
    const [
      totalUsersResult,
      activeUsersResult,
      totalActivitiesResult,
      todayRevenueResult,
    ] = await Promise.all([
      // 总用户数
      db.select({ count: count() }).from(users),
      
      // 活跃用户数（一周内有活动的用户）
      db.select({ count: count() })
        .from(users)
        .innerJoin(activities, eq(users.id, activities.creatorId))
        .where(gte(activities.createdAt, oneWeekAgo)),
      
      // 总活动数
      db.select({ count: count() }).from(activities),
      
      // 今日收入（简化计算，实际应该从订单表获取）
      db.select({ 
        revenue: sql<number>`COALESCE(SUM(CASE WHEN ${activities.isPaid} THEN ${activities.price} ELSE 0 END), 0)` 
      })
        .from(activities)
        .where(gte(activities.createdAt, today)),
    ]);

    return {
      totalUsers: totalUsersResult[0]?.count || 0,
      activeUsers: activeUsersResult[0]?.count || 0,
      totalActivities: totalActivitiesResult[0]?.count || 0,
      todayRevenue: todayRevenueResult[0]?.revenue || 0,
      conversionRate: 15.8, // 模拟数据，实际应该计算
      avgFulfillmentRate: 92.3, // 模拟数据，实际应该计算
    };
  } catch (error) {
    console.error('获取仪表板统计数据失败:', error);
    // 返回默认值
    return {
      totalUsers: 0,
      activeUsers: 0,
      totalActivities: 0,
      todayRevenue: 0,
      conversionRate: 0,
      avgFulfillmentRate: 0,
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
        creator: users.nickname,
        price: activities.price,
        isPaid: activities.isPaid,
        status: activities.status,
        createdAt: activities.createdAt,
      })
      .from(activities)
      .innerJoin(users, eq(activities.creatorId, users.id))
      .orderBy(desc(activities.createdAt))
      .limit(5);

    // 获取每个活动的参与者数量
    const activitiesWithParticipants = await Promise.all(
      result.map(async (activity) => {
        const participantCount = await db
          .select({ count: count() })
          .from(participants)
          .where(eq(participants.activityId, activity.id));

        return {
          id: activity.id,
          title: activity.title,
          creator: activity.creator || '未知用户',
          participants: participantCount[0]?.count || 0,
          status: activity.status as 'active' | 'completed' | 'disputed',
          revenue: activity.isPaid ? (activity.price || 0) : 0,
        };
      })
    );

    return activitiesWithParticipants;
  } catch (error) {
    console.error('获取最近活动失败:', error);
    return [];
  }
}

/**
 * 获取风险用户列表
 */
export async function getRiskUsers(): Promise<RiskUser[]> {
  try {
    // 简化的风险用户查询，实际应该基于更复杂的业务逻辑
    const result = await db
      .select({
        id: users.id,
        nickname: users.nickname,
        phoneNumber: users.phoneNumber,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(5);

    // 模拟风险评估数据，实际应该从业务数据计算
    const riskUsers: RiskUser[] = result.map((user, index) => ({
      id: user.id,
      name: user.nickname || '未知用户',
      phone: user.phoneNumber || '未知手机号',
      fulfillmentRate: Math.floor(Math.random() * 30) + 60, // 60-90%
      disputes: Math.floor(Math.random() * 5) + 1, // 1-5次
      risk: index < 2 ? 'high' : 'medium' as 'high' | 'medium' | 'low',
    }));

    return riskUsers;
  } catch (error) {
    console.error('获取风险用户失败:', error);
    return [];
  }
}