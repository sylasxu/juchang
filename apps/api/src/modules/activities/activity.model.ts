// Activity Model - 使用 TypeBox 组合能力复用 DB Schema
import { Elysia, t, type Static } from 'elysia';
import { selectActivitySchema, selectUserSchema, selectParticipantSchema } from '@juchang/db';

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
  'creditScore',
  'gender',
  'vibeTags',
]);

// 参与者关联的用户信息
const ParticipantUserInfo = t.Pick(selectUserSchema, [
  'id',
  'nickname',
  'avatarUrl',
  'creditScore',
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

// 3. 定义参数模型
// ------------------------------------------------
const IdParams = t.Object({
  id: t.String({
    format: 'uuid',
    description: '活动ID',
    examples: ['123e4567-e89b-12d3-a456-426614174000'],
  }),
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
    'activity.idParams': IdParams,
    'activity.error': ErrorResponse,
    // 如果其他地方单独需要 User 信息，也可以注册
    'activity.creator': CreatorInfo,
    'activity.participantUser': ParticipantUserInfo,
    'activity.participantWithUser': ParticipantWithUser,
  });

// 5. 导出 TS 类型 (使用 Static<typeof schema> 自动推导)
// ------------------------------------------------
// Service 层直接用这些类型，使用 Static<typeof schema> 自动推导
export type ActivityDetailResponse = Static<typeof ActivityDetailResponse>;
export type IdParams = Static<typeof IdParams>;
export type ErrorResponse = Static<typeof ErrorResponse>;
export type CreatorInfo = Static<typeof CreatorInfo>;
export type ParticipantUserInfo = Static<typeof ParticipantUserInfo>;
export type ParticipantWithUser = Static<typeof ParticipantWithUser>;
