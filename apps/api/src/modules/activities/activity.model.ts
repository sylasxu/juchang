// Activity Model - TypeBox schemas (MVP 简化版)
import { Elysia, t, type Static } from 'elysia';
import { selectActivitySchema, selectUserSchema, selectParticipantSchema } from '@juchang/db';

/**
 * Activity Model Plugin (MVP 简化版)
 * 
 * MVP 接口：
 * - GET /activities/mine - 获取我相关的活动
 * - GET /activities/:id - 获取活动详情
 * - POST /activities - 创建活动
 * - PATCH /activities/:id/status - 更新状态
 * - DELETE /activities/:id - 删除活动
 * - POST /activities/:id/join - 报名
 * - POST /activities/:id/quit - 退出
 */

// 创建者信息（简化版）
const CreatorInfo = t.Object({
  id: t.String(),
  nickname: t.Union([t.String(), t.Null()]),
  avatarUrl: t.Union([t.String(), t.Null()]),
});

// 参与者信息（简化版）
const ParticipantInfo = t.Object({
  id: t.String(),
  userId: t.String(),
  status: t.String(),
  joinedAt: t.Union([t.String(), t.Null()]),
  user: t.Union([CreatorInfo, t.Null()]),
});

// 活动详情响应（包含 isArchived 计算字段）
const ActivityDetailResponse = t.Object({
  id: t.String(),
  creatorId: t.String(),
  title: t.String(),
  description: t.Union([t.String(), t.Null()]),
  location: t.Tuple([t.Number(), t.Number()]), // [lng, lat]
  locationName: t.String(),
  address: t.Union([t.String(), t.Null()]),
  locationHint: t.String(),
  startAt: t.String(),
  type: t.String(),
  maxParticipants: t.Number(),
  currentParticipants: t.Number(),
  status: t.String(),
  createdAt: t.String(),
  updatedAt: t.String(),
  // 计算字段
  isArchived: t.Boolean({ description: '群聊是否已归档 (startAt + 24h < now)' }),
  // 关联数据
  creator: t.Union([CreatorInfo, t.Null()]),
  participants: t.Array(ParticipantInfo),
});

// 活动列表项（简化版）
const ActivityListItem = t.Object({
  id: t.String(),
  title: t.String(),
  description: t.Union([t.String(), t.Null()]),
  location: t.Tuple([t.Number(), t.Number()]),
  locationName: t.String(),
  locationHint: t.String(),
  startAt: t.String(),
  type: t.String(),
  maxParticipants: t.Number(),
  currentParticipants: t.Number(),
  status: t.String(),
  isArchived: t.Boolean(),
  creator: t.Union([CreatorInfo, t.Null()]),
});

// 我的活动列表响应
const MyActivitiesResponse = t.Object({
  data: t.Array(ActivityListItem),
  total: t.Number(),
});

// 我的活动查询参数
const MyActivitiesQuery = t.Object({
  type: t.Optional(t.Union([
    t.Literal('created'),
    t.Literal('joined'),
  ], { description: '筛选类型：created=我发布的, joined=我参与的' })),
});

// 创建活动请求
const CreateActivityRequest = t.Object({
  title: t.String({ maxLength: 100, description: '活动标题' }),
  description: t.Optional(t.String({ description: '活动描述' })),
  location: t.Tuple([t.Number(), t.Number()], { description: '位置坐标 [lng, lat]' }),
  locationName: t.String({ maxLength: 100, description: '地点名称' }),
  address: t.Optional(t.String({ maxLength: 255, description: '详细地址' })),
  locationHint: t.String({ maxLength: 100, description: '位置提示（重庆地形必填）' }),
  startAt: t.String({ description: '开始时间 ISO 格式' }),
  type: t.Union([
    t.Literal('food'),
    t.Literal('entertainment'),
    t.Literal('sports'),
    t.Literal('boardgame'),
    t.Literal('other'),
  ], { description: '活动类型' }),
  maxParticipants: t.Optional(t.Number({ minimum: 2, maximum: 50, default: 4, description: '最大参与人数' })),
});

// 更新活动状态请求
const UpdateStatusRequest = t.Object({
  status: t.Union([
    t.Literal('completed'),
    t.Literal('cancelled'),
  ], { description: '目标状态' }),
});

// 路径参数
const IdParams = t.Object({
  id: t.String({ format: 'uuid', description: '活动ID' }),
});

// 错误响应
const ErrorResponse = t.Object({
  code: t.Number(),
  msg: t.String(),
});

// 成功响应
const SuccessResponse = t.Object({
  success: t.Boolean(),
  msg: t.Optional(t.String()),
});

// 创建活动响应
const CreateActivityResponse = t.Object({
  id: t.String(),
  msg: t.String(),
});

// 注册到 Elysia
export const activityModel = new Elysia({ name: 'activityModel' })
  .model({
    'activity.detailResponse': ActivityDetailResponse,
    'activity.listItem': ActivityListItem,
    'activity.myActivitiesResponse': MyActivitiesResponse,
    'activity.myActivitiesQuery': MyActivitiesQuery,
    'activity.createRequest': CreateActivityRequest,
    'activity.updateStatusRequest': UpdateStatusRequest,
    'activity.createResponse': CreateActivityResponse,
    'activity.idParams': IdParams,
    'activity.error': ErrorResponse,
    'activity.success': SuccessResponse,
  });

// 导出 TS 类型
export type CreatorInfo = Static<typeof CreatorInfo>;
export type ParticipantInfo = Static<typeof ParticipantInfo>;
export type ActivityDetailResponse = Static<typeof ActivityDetailResponse>;
export type ActivityListItem = Static<typeof ActivityListItem>;
export type MyActivitiesResponse = Static<typeof MyActivitiesResponse>;
export type MyActivitiesQuery = Static<typeof MyActivitiesQuery>;
export type CreateActivityRequest = Static<typeof CreateActivityRequest>;
export type UpdateStatusRequest = Static<typeof UpdateStatusRequest>;
export type IdParams = Static<typeof IdParams>;
export type ErrorResponse = Static<typeof ErrorResponse>;
export type SuccessResponse = Static<typeof SuccessResponse>;
export type CreateActivityResponse = Static<typeof CreateActivityResponse>;
