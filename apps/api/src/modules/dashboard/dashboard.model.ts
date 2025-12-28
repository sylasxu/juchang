// Dashboard Model - MVP 简化版：只保留 Admin 基础统计
import { Elysia, t, type Static } from 'elysia';

/**
 * Dashboard Model Plugin - MVP 版本
 * 只保留 Admin 需要的基础统计接口
 */

// 基础统计数据
const DashboardStats = t.Object({
  totalUsers: t.Number(),
  totalActivities: t.Number(),
  activeActivities: t.Number(),
  todayNewUsers: t.Number(),
});

// 最近活动项
const RecentActivity = t.Object({
  id: t.String(),
  title: t.String(),
  creatorName: t.String(),
  participantCount: t.Number(),
  status: t.String(),
  createdAt: t.String(),
});

// 用户增长趋势数据项
const UserGrowthItem = t.Object({
  date: t.String(),
  totalUsers: t.Number(),
  newUsers: t.Number(),
  activeUsers: t.Number(),
});

// 活动类型分布
const ActivityTypeDistribution = t.Object({
  food: t.Number(),
  sports: t.Number(),
  entertainment: t.Number(),
  boardgame: t.Number(),
  other: t.Number(),
});

// 地理分布项
const GeographicItem = t.Object({
  name: t.String(),
  users: t.Number(),
  activities: t.Number(),
});

// 错误响应
const ErrorResponse = t.Object({
  code: t.Number(),
  msg: t.String(),
});

// 注册到 Elysia Model Plugin
export const dashboardModel = new Elysia({ name: 'dashboardModel' })
  .model({
    'dashboard.stats': DashboardStats,
    'dashboard.recentActivities': t.Array(RecentActivity),
    'dashboard.userGrowth': t.Array(UserGrowthItem),
    'dashboard.activityTypes': ActivityTypeDistribution,
    'dashboard.geographic': t.Array(GeographicItem),
    'dashboard.error': ErrorResponse,
  });

// 导出 TS 类型
export type DashboardStats = Static<typeof DashboardStats>;
export type RecentActivity = Static<typeof RecentActivity>;
export type UserGrowthItem = Static<typeof UserGrowthItem>;
export type ActivityTypeDistribution = Static<typeof ActivityTypeDistribution>;
export type GeographicItem = Static<typeof GeographicItem>;
export type ErrorResponse = Static<typeof ErrorResponse>;
