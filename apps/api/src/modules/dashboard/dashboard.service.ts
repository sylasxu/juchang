// Dashboard Service - Pure functions for dashboard data
import { db, users, activities, participants, eq, gte, desc, count } from '@juchang/db';
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
      
      // 今日收入（从交易表获取）
      // TODO: 实际应该从 transactions 表计算
      Promise.resolve([{ revenue: 0 }]),
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
        status: activities.status,
        currentParticipants: activities.currentParticipants,
        createdAt: activities.createdAt,
      })
      .from(activities)
      .innerJoin(users, eq(activities.creatorId, users.id))
      .orderBy(desc(activities.createdAt))
      .limit(5);

    // 转换为响应格式
    const activitiesWithParticipants = result.map((activity) => ({
      id: activity.id,
      title: activity.title,
      creator: activity.creator || '未知用户',
      participants: activity.currentParticipants || 0,
      status: activity.status as 'active' | 'completed' | 'disputed',
      revenue: 0, // TODO: 从交易表获取
    }));

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


/**
 * 获取用户个人统计数据
 */
export async function getUserStats(userId: string) {
  try {
    // 获取用户基本信息
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new Error('用户不存在');
    }

    // 计算靠谱度
    const reliabilityRate = user.participationCount > 0
      ? Math.round((user.fulfillmentCount / user.participationCount) * 100)
      : 100;

    // 获取用户创建的活动数
    const [createdActivities] = await db
      .select({ count: count() })
      .from(activities)
      .where(eq(activities.creatorId, userId));

    // 获取用户参与的活动数
    const [participatedActivities] = await db
      .select({ count: count() })
      .from(participants)
      .where(eq(participants.userId, userId));

    return {
      userId,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      membershipType: user.membershipType,
      reliabilityRate,
      reliabilityLevel: getReliabilityLevel(reliabilityRate, user.participationCount),
      stats: {
        activitiesCreated: createdActivities?.count || 0,
        activitiesParticipated: participatedActivities?.count || 0,
        fulfillmentCount: user.fulfillmentCount,
        disputeCount: user.disputeCount,
        feedbackReceivedCount: user.feedbackReceivedCount,
      },
      aiQuota: {
        createQuotaToday: user.aiCreateQuotaToday,
        searchQuotaToday: user.aiSearchQuotaToday,
      },
    };
  } catch (error) {
    console.error('获取用户统计失败:', error);
    throw error;
  }
}

/**
 * 获取靠谱度等级
 */
function getReliabilityLevel(rate: number, participationCount: number): string {
  if (participationCount === 0) return '新用户';
  if (rate >= 100) return '非常靠谱';
  if (rate >= 80) return '靠谱';
  if (rate >= 60) return '一般';
  return '待提升';
}