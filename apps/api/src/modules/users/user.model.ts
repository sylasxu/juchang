// User Model - 使用 TypeBox 组合能力复用 DB Schema
import { Elysia, t, type Static } from 'elysia';
import { selectUserSchema } from '@juchang/db';

/**
 * User Model Plugin
 * 使用 TypeBox 的组合能力复用 DB Schema
 * 使用 Static<typeof schema> 自动推导类型，避免手写类型定义
 */

// 分页查询参数（纯瞬态参数，不来自数据库）
const PaginationQuery = t.Object({
  page: t.Optional(t.Number({
    minimum: 1,
    default: 1,
    description: '页码',
  })),
  limit: t.Optional(t.Number({
    minimum: 1,
    maximum: 100,
    default: 20,
    description: '每页数量',
  })),
  search: t.Optional(t.String({ description: '搜索关键词（昵称/手机号）' })),
});

// 管理员用户查询参数（扩展分页查询）
const AdminUserQuery = t.Intersect([
  PaginationQuery,
  t.Object({
    membershipType: t.Optional(t.Array(t.Union([t.Literal('free'), t.Literal('pro')]))),
    isBlocked: t.Optional(t.Boolean()),
    isRealNameVerified: t.Optional(t.Boolean()),
    sortBy: t.Optional(t.Union([
      t.Literal('createdAt'),
      t.Literal('lastActiveAt'),
      t.Literal('participationCount'),
      t.Literal('fulfillmentCount')
    ])),
    sortOrder: t.Optional(t.Union([t.Literal('asc'), t.Literal('desc')])),
  }),
]);

// 用户列表响应（从 DB Schema 派生）
const ListResponse = t.Object({
  data: t.Array(selectUserSchema), // 直接使用 DB Schema
  total: t.Number(),
  page: t.Number(),
  totalPages: t.Number(),
});

// 管理员用户视图（扩展用户信息）
const AdminUserView = t.Intersect([
  selectUserSchema,
  t.Object({
    totalActivitiesCreated: t.Number(),
    totalTransactionAmount: t.Number(),
    lastActivityAt: t.Union([t.String(), t.Null()]),
    riskScore: t.Number(),
    moderationStatus: t.Union([
      t.Literal('clean'),
      t.Literal('flagged'),
      t.Literal('blocked')
    ]),
    reliabilityRate: t.Number(),
  }),
]);

// 管理员用户列表响应
const AdminUserListResponse = t.Object({
  data: t.Array(AdminUserView),
  total: t.Number(),
  page: t.Number(),
  totalPages: t.Number(),
});

// 路径参数
const IdParams = t.Object({
  id: t.String({
    format: 'uuid',
    description: '用户ID',
  }),
});

// 更新用户请求体（可选字段）
const UpdateUserBody = t.Object({
  nickname: t.Optional(t.String({ maxLength: 50 })),
  bio: t.Optional(t.String({ maxLength: 200 })),
  gender: t.Optional(t.Union([t.Literal('male'), t.Literal('female'), t.Literal('unknown')])),
  membershipType: t.Optional(t.Union([t.Literal('free'), t.Literal('pro')])),
  isBlocked: t.Optional(t.Boolean()),
});

// 错误响应
const ErrorResponse = t.Object({
  code: t.Number(),
  msg: t.String(),
});

// 成功响应
const SuccessResponse = t.Object({
  code: t.Number(),
  msg: t.String(),
});

// 靠谱度响应
const ReliabilityResponse = t.Object({
  userId: t.String(),
  reliabilityRate: t.Number({ description: '靠谱度百分比' }),
  level: t.String({ description: '靠谱度等级' }),
  participationCount: t.Number(),
  fulfillmentCount: t.Number(),
  disputeCount: t.Number(),
  feedbackReceivedCount: t.Number(),
  recentActivities: t.Array(t.Object({
    activityId: t.String(),
    title: t.String(),
    fulfilled: t.Boolean(),
    date: t.String(),
  })),
});

// 活动列表响应
const ActivitiesResponse = t.Object({
  data: t.Array(t.Any()),
  total: t.Number(),
  page: t.Number(),
  hasMore: t.Boolean(),
});

// 争议记录响应
const DisputesResponse = t.Object({
  data: t.Array(t.Object({
    id: t.String(),
    activityId: t.String(),
    activityTitle: t.String(),
    status: t.String(),
    createdAt: t.String(),
    resolvedAt: t.Optional(t.String()),
  })),
  total: t.Number(),
  page: t.Number(),
});

// 举报请求体
const ReportBody = t.Object({
  reason: t.String({ minLength: 1, maxLength: 500 }),
  type: t.Union([
    t.Literal('harassment'),
    t.Literal('fraud'),
    t.Literal('inappropriate'),
    t.Literal('other'),
  ]),
  evidence: t.Optional(t.Array(t.String())),
});

// 申诉请求体
const AppealBody = t.Object({
  participantId: t.String({ format: 'uuid' }),
  reason: t.Optional(t.String({ maxLength: 500 })),
});

// 注册到 Elysia
export const userModel = new Elysia({ name: 'userModel' })
  .model({
    'user.paginationQuery': PaginationQuery,
    'user.adminQuery': AdminUserQuery,
    'user.listResponse': ListResponse,
    'user.adminListResponse': AdminUserListResponse,
    'user.adminUserView': AdminUserView,
    'user.response': selectUserSchema, // 直接使用 DB Schema
    'user.error': ErrorResponse,
    'user.success': SuccessResponse,
    'user.idParams': IdParams,
    'user.updateBody': UpdateUserBody,
    'user.reliabilityResponse': ReliabilityResponse,
    'user.activitiesResponse': ActivitiesResponse,
    'user.disputesResponse': DisputesResponse,
    'user.reportBody': ReportBody,
    'user.appealBody': AppealBody,
  });

// 导出 TS 类型 (使用 Static<typeof schema> 自动推导)
export type PaginationQuery = Static<typeof PaginationQuery>;
export type AdminUserQuery = Static<typeof AdminUserQuery>;
export type ListResponse = Static<typeof ListResponse>;
export type AdminUserView = Static<typeof AdminUserView>;
export type AdminUserListResponse = Static<typeof AdminUserListResponse>;
export type ErrorResponse = Static<typeof ErrorResponse>;
export type SuccessResponse = Static<typeof SuccessResponse>;
export type IdParams = Static<typeof IdParams>;
export type UpdateUserBody = Static<typeof UpdateUserBody>;

export type ReliabilityResponse = Static<typeof ReliabilityResponse>;
export type ActivitiesResponse = Static<typeof ActivitiesResponse>;
export type DisputesResponse = Static<typeof DisputesResponse>;
export type ReportBody = Static<typeof ReportBody>;
export type AppealBody = Static<typeof AppealBody>;