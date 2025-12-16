// Activity Model - 使用 TypeBox 组合能力复用 DB Schema
import { Elysia, t, type Static } from 'elysia';
import { selectActivitySchema, selectUserSchema, selectParticipantSchema, insertActivitySchema } from '@juchang/db';

/**
 * Activity Model Plugin
 * 使用 TypeBox 的组合能力（Pick, Omit, Intersect）复用 DB Schema
 * 避免手动维护两套类型定义，确保与 DB 结构 100% 同步
 */

// 1. 定义基础片段 (使用 Pick 复用 DB 定义)
// ------------------------------------------------

// 创建者信息：从 User 表里挑字段
const CreatorInfo = t.Pick(selectUserSchema, [
  'id',
  'nickname',
  'avatarUrl',
  'participationCount',
  'fulfillmentCount',
  'gender',
  'interestTags',
]);

// 参与者关联的用户信息
const ParticipantUserInfo = t.Pick(selectUserSchema, [
  'id',
  'nickname',
  'avatarUrl',
  'participationCount',
  'fulfillmentCount',
]);

// 参与者记录：复用 Participant 表定义 + 扩展 user 字段
const ParticipantWithUser = t.Intersect([
  selectParticipantSchema, // 自动包含 id, activityId, userId, status, applicationMsg, joinedAt, updatedAt 等所有 DB 字段
  t.Object({
    user: t.Nullable(ParticipantUserInfo), // 扩展关联字段
  }),
]);

// 2. 组装聚合模型 (Aggregate Model)
// ------------------------------------------------

// 活动详情：复用 Activity 表定义 + 扩展 creator 和 participants
// 使用 Omit 移除 location 字段（因为需要转换为数组格式），然后重新定义
const ActivityDetailResponse = t.Intersect([
  // 基础字段 (自动包含 title, startAt, maxParticipants 等所有 DB 字段，但排除 location)
  t.Omit(selectActivitySchema, ['location']),

  // 扩展字段 (覆盖或新增)
  t.Object({
    // 覆写 location: PostGIS 在 DB 是对象，API 返回数组 [lng, lat]
    // 只有这种和 DB 不一致的字段才需要手写
    location: t.Nullable(t.Tuple([t.Number(), t.Number()])),

    // 关联关系
    creator: t.Nullable(CreatorInfo),
    participants: t.Array(ParticipantWithUser),
  }),
]);

// 地图活动列表项（简化版，用于地图Pin显示）
const MapActivityItem = t.Intersect([
  t.Pick(selectActivitySchema, [
    'id',
    'title',
    'startAt',
    'maxParticipants',
    'currentParticipants',
    'type',
    'feeType',
    'estimatedCost',
    'status',
    'isBoosted',
    'isPinPlus',
    'isLocationBlurred',
    'isGhost',
    'ghostAnchorType',
    'ghostSuggestedType',
  ]),
  t.Object({
    location: t.Tuple([t.Number(), t.Number()]), // [lng, lat]
    locationHint: t.Optional(t.String()), // 重庆地形位置备注
    creator: t.Pick(CreatorInfo, ['id', 'nickname', 'avatarUrl']),
  }),
]);

// 🔥 地图聚合响应项（支持活动/聚合/幽灵三种类型）
const NearbyMapItem = t.Object({
  type: t.Union([
    t.Literal('activity'),
    t.Literal('cluster'), 
    t.Literal('ghost')
  ]),
  id: t.String(),
  lat: t.Number(),
  lng: t.Number(),
  
  // type='activity' 时的字段
  title: t.Optional(t.String()),
  isBoosted: t.Optional(t.Boolean()),
  isPinPlus: t.Optional(t.Boolean()),
  locationHint: t.Optional(t.String()), // 重庆地形备注
  
  // type='cluster' 时的字段
  count: t.Optional(t.Number()),
  
  // type='ghost' 时的字段
  ghostType: t.Optional(t.String()), // 'food' | 'sports' | 'entertainment' 等
});

// 地图附近活动响应
const NearbyResponse = t.Object({
  items: t.Array(NearbyMapItem),
  total: t.Number(),
  hasMore: t.Boolean(),
});

// 3. 定义参数模型
// ------------------------------------------------

// 路径参数
const IdParams = t.Object({
  id: t.String({
    format: 'uuid',
    description: '活动ID',
    examples: ['123e4567-e89b-12d3-a456-426614174000'],
  }),
});

// 地图查询参数（🔥 新增 zoom_level 支持聚合）
const MapQuery = t.Object({
  lat: t.Number({ description: '纬度' }),
  lng: t.Number({ description: '经度' }),
  radius: t.Optional(t.Number({ minimum: 1, maximum: 50, default: 5, description: '搜索半径(km)' })),
  zoom_level: t.Optional(t.Number({ minimum: 1, maximum: 20, default: 12, description: '地图缩放级别，用于聚合计算' })),
  type: t.Optional(t.String({ description: '活动类型筛选' })),
  status: t.Optional(t.String({ description: '活动状态筛选' })),
  include_ghosts: t.Optional(t.Boolean({ default: true, description: '是否包含幽灵锚点' })),
});

// 创建活动请求（从 DB schema 派生，但排除自动生成的字段）
const CreateActivityRequest = t.Intersect([
  t.Omit(insertActivitySchema, [
    'id',
    'creatorId', 
    'currentParticipants',
    'riskScore',
    'riskLevel',
    'status',
    'isConfirmed',
    'confirmedAt',
    'isBoosted',
    'boostExpiresAt',
    'boostCount',
    'isPinPlus',
    'pinPlusExpiresAt',
    'isGhost',
    'createdAt',
    'updatedAt',
    'location', // 需要特殊处理
  ]),
  t.Object({
    // 地理位置：API 接收数组格式 [lng, lat]
    location: t.Tuple([t.Number(), t.Number()]),
    // 增值服务选项
    boost: t.Optional(t.Boolean({ description: '是否使用强力召唤' })),
    pinPlus: t.Optional(t.Boolean({ description: '是否使用黄金置顶' })),
  }),
]);

// 更新活动请求
const UpdateActivityRequest = t.Partial(CreateActivityRequest);

// 活动列表查询参数
const ListQuery = t.Object({
  page: t.Optional(t.Number({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 20 })),
  lat: t.Optional(t.Number()),
  lng: t.Optional(t.Number()),
  radius: t.Optional(t.Number({ minimum: 1, maximum: 50, default: 10 })),
  type: t.Optional(t.String()),
  status: t.Optional(t.String()),
  creator_id: t.Optional(t.String()),
});

// 活动列表响应
const ListResponse = t.Object({
  data: t.Array(MapActivityItem),
  total: t.Number(),
  page: t.Number(),
  limit: t.Number(),
  hasMore: t.Boolean(),
});

// 报名请求
const JoinRequest = t.Object({
  applicationMsg: t.Optional(t.String({ maxLength: 200 })),
  isFastPass: t.Optional(t.Boolean({ default: false })),
});

// 确认活动请求
const ConfirmRequest = t.Object({
  participantStatuses: t.Array(t.Object({
    participantId: t.String(),
    fulfilled: t.Boolean(),
  })),
});

// 创建幽灵锚点请求（运营功能）
const CreateGhostRequest = t.Object({
  location: t.Tuple([t.Number(), t.Number()], { description: '位置坐标 [lng, lat]' }),
  locationName: t.String({ description: '地点名称' }),
  address: t.Optional(t.String({ description: '详细地址' })),
  locationHint: t.Optional(t.String({ description: '重庆地形位置备注' })),
  ghostAnchorType: t.Union([
    t.Literal('demand'),
    t.Literal('promotion'),
  ], { description: '锚点类型：demand=需求引导, promotion=推广' }),
  ghostSuggestedType: t.Optional(t.Union([
    t.Literal('food'),
    t.Literal('entertainment'),
    t.Literal('sports'),
    t.Literal('study'),
    t.Literal('other'),
  ], { description: '建议的活动类型' })),
  title: t.Optional(t.String({ description: '幽灵锚点标题' })),
  description: t.Optional(t.String({ description: '幽灵锚点描述' })),
});

// 错误响应
const ErrorResponse = t.Object({
  code: t.Number(),
  msg: t.String(),
});

// 4. 注册到 Elysia (为了 OpenAPI 和引用)
// ------------------------------------------------
export const activityModel = new Elysia({ name: 'activityModel' })
  .model({
    'activity.detailResponse': ActivityDetailResponse,
    'activity.mapItem': MapActivityItem,
    'activity.nearbyItem': NearbyMapItem,
    'activity.nearbyResponse': NearbyResponse,
    'activity.mapQuery': MapQuery,
    'activity.listQuery': ListQuery,
    'activity.listResponse': ListResponse,
    'activity.createRequest': CreateActivityRequest,
    'activity.updateRequest': UpdateActivityRequest,
    'activity.joinRequest': JoinRequest,
    'activity.confirmRequest': ConfirmRequest,
    'activity.createGhostRequest': CreateGhostRequest,
    'activity.idParams': IdParams,
    'activity.error': ErrorResponse,
    // 如果其他地方单独需要 User 信息，也可以注册
    'activity.creator': CreatorInfo,
    'activity.participantUser': ParticipantUserInfo,
    'activity.participantWithUser': ParticipantWithUser,
  });

// 5. 导出 Schema 对象和 TS 类型
// ------------------------------------------------
// 导出 Schema 对象供 controller 直接使用
export { 
  ActivityDetailResponse,
  MapActivityItem,
  NearbyMapItem,
  NearbyResponse,
  MapQuery,
  ListQuery,
  ListResponse,
  CreateActivityRequest,
  UpdateActivityRequest,
  JoinRequest,
  ConfirmRequest,
  CreateGhostRequest,
  IdParams,
  ErrorResponse,
  CreatorInfo,
  ParticipantUserInfo,
  ParticipantWithUser 
};

// 导出 TS 类型 (使用 Static<typeof schema> 自动推导)
export type ActivityDetailResponse = Static<typeof ActivityDetailResponse>;
export type MapActivityItem = Static<typeof MapActivityItem>;
export type NearbyMapItem = Static<typeof NearbyMapItem>;
export type NearbyResponse = Static<typeof NearbyResponse>;
export type MapQuery = Static<typeof MapQuery>;
export type ListQuery = Static<typeof ListQuery>;
export type ListResponse = Static<typeof ListResponse>;
export type CreateActivityRequest = Static<typeof CreateActivityRequest>;
export type UpdateActivityRequest = Static<typeof UpdateActivityRequest>;
export type JoinRequest = Static<typeof JoinRequest>;
export type ConfirmRequest = Static<typeof ConfirmRequest>;
export type CreateGhostRequest = Static<typeof CreateGhostRequest>;
export type IdParams = Static<typeof IdParams>;
export type ErrorResponse = Static<typeof ErrorResponse>;
export type CreatorInfo = Static<typeof CreatorInfo>;
export type ParticipantUserInfo = Static<typeof ParticipantUserInfo>;
export type ParticipantWithUser = Static<typeof ParticipantWithUser>;
