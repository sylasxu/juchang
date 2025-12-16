// Admin Activity Model - 管理后台活动管理专用模型
import { Elysia, t, type Static } from 'elysia';
import { selectActivitySchema, selectUserSchema } from '@juchang/db';

/**
 * Admin Activity Model Plugin
 * 专门为管理后台设计的活动管理模型
 * 遵循 Single Source of Truth 原则，从 DB schema 派生
 */

// 管理后台活动视图 - 扩展基础活动信息
const AdminActivityView = t.Intersect([
  // 从 DB schema 选择需要的字段
  t.Pick(selectActivitySchema, [
    'id',
    'title',
    'description',
    'startAt',
    'endAt',
    'type',
    'status',
    'maxParticipants',
    'currentParticipants',
    'feeType',
    'estimatedCost',
    'riskScore',
    'riskLevel',
    'isGhost',
    'ghostAnchorType',
    'ghostSuggestedType',
    'isBoosted',
    'isPinPlus',
    'locationName',
    'address',
    'locationHint',
    'createdAt',
    'updatedAt'
  ]),
  // 扩展管理字段
  t.Object({
    location: t.Nullable(t.Tuple([t.Number(), t.Number()])), // [lng, lat]
    creatorInfo: t.Pick(selectUserSchema, ['id', 'nickname', 'avatarUrl', 'phoneNumber']),
    participantCount: t.Number(),
    reportCount: t.Number(),
    moderationFlags: t.Array(t.String()),
    lastModeratedAt: t.Union([t.Date(), t.Null()]),
  })
]);

// 活动筛选参数
const ActivityFilterOptions = t.Object({
  search: t.Optional(t.String({ description: '搜索关键词（标题、描述）' })),
  status: t.Optional(t.Array(t.String({ description: '活动状态筛选' }))),
  type: t.Optional(t.Array(t.String({ description: '活动类型筛选' }))),
  riskLevel: t.Optional(t.Array(t.String({ description: '风险等级筛选' }))),
  isGhost: t.Optional(t.Boolean({ description: '是否为锚点活动' })),
  createdDateRange: t.Optional(t.Tuple([t.Date(), t.Date()], { description: '创建时间范围' })),
  startDateRange: t.Optional(t.Tuple([t.Date(), t.Date()], { description: '开始时间范围' })),
  locationRadius: t.Optional(t.Object({
    center: t.Tuple([t.Number(), t.Number()], { description: '中心坐标 [lng, lat]' }),
    radius: t.Number({ description: '半径（公里）' })
  })),
  page: t.Optional(t.Number({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 20 })),
  sortBy: t.Optional(t.Union([
    t.Literal('createdAt'),
    t.Literal('startAt'),
    t.Literal('riskScore'),
    t.Literal('participantCount')
  ], { default: 'createdAt' })),
  sortOrder: t.Optional(t.Union([t.Literal('asc'), t.Literal('desc')], { default: 'desc' }))
});

// 活动列表响应
const AdminActivityListResponse = t.Object({
  data: t.Array(AdminActivityView),
  total: t.Number(),
  page: t.Number(),
  limit: t.Number(),
  hasMore: t.Boolean()
});

// 活动审核操作
const ActivityModerationAction = t.Object({
  activityId: t.String({ format: 'uuid' }),
  action: t.Union([
    t.Literal('approve'),
    t.Literal('hide'),
    t.Literal('remove'),
    t.Literal('flag'),
    t.Literal('restore')
  ]),
  reason: t.String({ minLength: 1, description: '操作原因' }),
  notes: t.Optional(t.String({ description: '备注信息' })),
  adminId: t.String({ format: 'uuid' })
});

// 批量操作请求
const BulkModerationRequest = t.Object({
  activityIds: t.Array(t.String({ format: 'uuid' })),
  action: t.Union([
    t.Literal('approve'),
    t.Literal('hide'),
    t.Literal('remove'),
    t.Literal('flag')
  ]),
  reason: t.String({ minLength: 1 }),
  notes: t.Optional(t.String())
});

// 路径参数
const IdParams = t.Object({
  id: t.String({ format: 'uuid', description: '活动ID' })
});

// 错误响应
const ErrorResponse = t.Object({
  code: t.Number(),
  msg: t.String(),
  details: t.Optional(t.Any())
});

// 注册到 Elysia Model Plugin
export const adminActivityModel = new Elysia({ name: 'adminActivityModel' })
  .model({
    'admin.activity.view': AdminActivityView,
    'admin.activity.filterOptions': ActivityFilterOptions,
    'admin.activity.listResponse': AdminActivityListResponse,
    'admin.activity.moderationAction': ActivityModerationAction,
    'admin.activity.bulkModeration': BulkModerationRequest,
    'admin.activity.idParams': IdParams,
    'admin.activity.error': ErrorResponse
  });

// 导出 Schema 对象
export {
  AdminActivityView,
  ActivityFilterOptions,
  AdminActivityListResponse,
  ActivityModerationAction,
  BulkModerationRequest,
  IdParams,
  ErrorResponse
};

// 导出 TS 类型
export type AdminActivityView = Static<typeof AdminActivityView>;
export type ActivityFilterOptions = Static<typeof ActivityFilterOptions>;
export type AdminActivityListResponse = Static<typeof AdminActivityListResponse>;
export type ActivityModerationAction = Static<typeof ActivityModerationAction>;
export type BulkModerationRequest = Static<typeof BulkModerationRequest>;
export type IdParams = Static<typeof IdParams>;
export type ErrorResponse = Static<typeof ErrorResponse>;