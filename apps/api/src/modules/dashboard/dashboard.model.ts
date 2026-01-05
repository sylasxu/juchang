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

// ==========================================
// 核心业务指标 (PRD 17.2-17.4)
// ==========================================

// 基准状态枚举
const BenchmarkStatus = t.Union([
  t.Literal('green'),
  t.Literal('yellow'),
  t.Literal('red'),
]);

// 单个指标的通用结构
const MetricItem = t.Object({
  value: t.Number(),
  benchmark: BenchmarkStatus,
  comparison: t.Optional(t.String()),
});

// J2C 转化率 (北极星指标)
const J2CMetric = t.Object({
  value: t.Number(),
  benchmark: BenchmarkStatus,
  comparison: t.Optional(t.String()),
  convertedUsers: t.Number(),
  totalJoiners: t.Number(),
});

// 本周成局数
const WeeklyCompletedMetric = t.Object({
  value: t.Number(),
  benchmark: BenchmarkStatus,
  comparison: t.Optional(t.String()),
  lastWeekValue: t.Number(),
});

// 业务指标聚合响应
const BusinessMetrics = t.Object({
  j2cRate: J2CMetric,
  weeklyCompletedCount: WeeklyCompletedMetric,
  draftPublishRate: MetricItem,
  activitySuccessRate: MetricItem,
  weeklyRetention: MetricItem,
  oneTimeCreatorRate: MetricItem,
});

// 注册到 Elysia Model Plugin
export const dashboardModel = new Elysia({ name: 'dashboardModel' })
  .model({
    'dashboard.stats': DashboardStats,
    'dashboard.recentActivities': t.Array(RecentActivity),
    'dashboard.userGrowth': t.Array(UserGrowthItem),
    'dashboard.activityTypes': ActivityTypeDistribution,
    'dashboard.geographic': t.Array(GeographicItem),
    'dashboard.businessMetrics': BusinessMetrics,
    'dashboard.error': ErrorResponse,
  });

// 导出 TS 类型
export type DashboardStats = Static<typeof DashboardStats>;
export type RecentActivity = Static<typeof RecentActivity>;
export type UserGrowthItem = Static<typeof UserGrowthItem>;
export type ActivityTypeDistribution = Static<typeof ActivityTypeDistribution>;
export type GeographicItem = Static<typeof GeographicItem>;
export type ErrorResponse = Static<typeof ErrorResponse>;
export type BenchmarkStatus = Static<typeof BenchmarkStatus>;
export type MetricItem = Static<typeof MetricItem>;
export type J2CMetric = Static<typeof J2CMetric>;
export type WeeklyCompletedMetric = Static<typeof WeeklyCompletedMetric>;
export type BusinessMetrics = Static<typeof BusinessMetrics>;
