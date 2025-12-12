// Dashboard Model - TypeBox schemas and types
import { Elysia, t, type Static } from 'elysia';

/**
 * Dashboard Model Plugin
 * 仪表板相关的 TypeBox 模式定义
 */

// 仪表板统计数据
const DashboardStats = t.Object({
  totalUsers: t.Number(),
  activeUsers: t.Number(),
  totalActivities: t.Number(),
  todayRevenue: t.Number(),
  conversionRate: t.Number(),
  avgFulfillmentRate: t.Number(),
});

// 最近活动项
const RecentActivity = t.Object({
  id: t.String(),
  title: t.String(),
  creator: t.String(),
  participants: t.Number(),
  status: t.Union([t.Literal('active'), t.Literal('completed'), t.Literal('disputed')]),
  revenue: t.Number(),
});

// 风险用户项
const RiskUser = t.Object({
  id: t.String(),
  name: t.String(),
  phone: t.String(),
  fulfillmentRate: t.Number(),
  disputes: t.Number(),
  risk: t.Union([t.Literal('high'), t.Literal('medium'), t.Literal('low')]),
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
    'dashboard.riskUsers': t.Array(RiskUser),
    'dashboard.error': ErrorResponse,
  });

// 导出 TS 类型
export type DashboardStats = Static<typeof DashboardStats>;
export type RecentActivity = Static<typeof RecentActivity>;
export type RiskUser = Static<typeof RiskUser>;
export type ErrorResponse = Static<typeof ErrorResponse>;