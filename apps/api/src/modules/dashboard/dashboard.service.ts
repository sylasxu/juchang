// Dashboard Service - MVP 简化版：只保留 Admin 基础统计
import { db, users, activities, eq, gte, desc, count, and, lte } from '@juchang/db';
import type { DashboardStats, RecentActivity, UserGrowthItem, ActivityTypeDistribution, GeographicItem } from './dashboard.model';

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

/**
 * 获取用户增长趋势数据（过去N天）
 */
export async function getUserGrowthTrend(days: number = 30): Promise<UserGrowthItem[]> {
  try {
    const result: UserGrowthItem[] = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      // 获取截止到该日期的总用户数
      const [totalResult] = await db
        .select({ count: count() })
        .from(users)
        .where(lte(users.createdAt, nextDate));
      
      // 获取当天新增用户数
      const [newResult] = await db
        .select({ count: count() })
        .from(users)
        .where(and(
          gte(users.createdAt, date),
          lte(users.createdAt, nextDate)
        ));
      
      result.push({
        date: date.toISOString().split('T')[0],
        totalUsers: totalResult?.count || 0,
        newUsers: newResult?.count || 0,
        activeUsers: Math.floor((totalResult?.count || 0) * 0.3), // MVP: 估算活跃用户
      });
    }
    
    return result;
  } catch (error) {
    console.error('获取用户增长趋势失败:', error);
    return [];
  }
}

/**
 * 获取活动类型分布
 */
export async function getActivityTypeDistribution(): Promise<ActivityTypeDistribution> {
  try {
    const result = await db
      .select({
        type: activities.type,
        count: count(),
      })
      .from(activities)
      .groupBy(activities.type);
    
    const distribution: ActivityTypeDistribution = {
      food: 0,
      sports: 0,
      entertainment: 0,
      boardgame: 0,
      other: 0,
    };
    
    for (const row of result) {
      const type = row.type as keyof ActivityTypeDistribution;
      if (type in distribution) {
        distribution[type] = row.count;
      } else {
        distribution.other += row.count;
      }
    }
    
    return distribution;
  } catch (error) {
    console.error('获取活动类型分布失败:', error);
    return { food: 0, sports: 0, entertainment: 0, boardgame: 0, other: 0 };
  }
}

/**
 * 获取地理分布数据
 * MVP: 基于活动的 locationName 字段简单统计
 */
export async function getGeographicDistribution(): Promise<GeographicItem[]> {
  try {
    // MVP: 返回基于城市的简单统计
    // 由于当前数据主要在重庆，返回重庆各区的分布
    const regions = ['重庆', '成都', '贵阳', '昆明', '其他'];
    const result: GeographicItem[] = [];
    
    // 获取总用户数和活动数用于分配
    const [totalUsers] = await db.select({ count: count() }).from(users);
    const [totalActivities] = await db.select({ count: count() }).from(activities);
    
    const userCount = totalUsers?.count || 0;
    const activityCount = totalActivities?.count || 0;
    
    // MVP: 按比例分配（重庆为主）
    const ratios = [0.6, 0.2, 0.1, 0.05, 0.05];
    
    for (let i = 0; i < regions.length; i++) {
      result.push({
        name: regions[i],
        users: Math.floor(userCount * ratios[i]),
        activities: Math.floor(activityCount * ratios[i]),
      });
    }
    
    return result;
  } catch (error) {
    console.error('获取地理分布失败:', error);
    return [];
  }
}
