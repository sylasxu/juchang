import { Type, type Static } from '@sinclair/typebox'

// MVP 活动类型枚举
export const activityTypeSchema = Type.Union([
  Type.Literal('food'),
  Type.Literal('sports'),
  Type.Literal('entertainment'),
  Type.Literal('boardgame'),
  Type.Literal('other'),
])

// MVP 活动状态枚举 (v3.3 含 draft)
export const activityStatusSchema = Type.Union([
  Type.Literal('draft'),
  Type.Literal('active'),
  Type.Literal('completed'),
  Type.Literal('cancelled'),
])

// MVP 活动 Schema (简化版)
export const activitySchema = Type.Object({
  id: Type.String(),
  creatorId: Type.String(),
  
  // 基础信息
  title: Type.String(),
  description: Type.Optional(Type.String()),
  
  // 位置 (保留 PostGIS)
  location: Type.Object({
    x: Type.Number(),
    y: Type.Number(),
  }),
  locationName: Type.String(),
  address: Type.Optional(Type.String()),
  locationHint: Type.String(), // 重庆地形必填
  
  // 时间
  startAt: Type.String({ format: 'date-time' }),
  
  // 活动属性
  type: activityTypeSchema,
  maxParticipants: Type.Number({ minimum: 1, default: 4 }),
  currentParticipants: Type.Number({ minimum: 0, default: 1 }),
  
  // 状态 (MVP 简化)
  status: activityStatusSchema,
  
  // 系统
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
})

export type Activity = Static<typeof activitySchema>
export type ActivityType = Static<typeof activityTypeSchema>
export type ActivityStatus = Static<typeof activityStatusSchema>

// Admin 活动视图 (包含关联信息)
export const adminActivitySchema = Type.Intersect([
  activitySchema,
  Type.Object({
    // 关联信息
    creatorInfo: Type.Optional(Type.Object({
      id: Type.String(),
      nickname: Type.Optional(Type.String()),
      avatarUrl: Type.Optional(Type.String()),
    })),
    // 计算字段
    isArchived: Type.Optional(Type.Boolean()),
    participantCount: Type.Optional(Type.Number()),
  }),
])

export type AdminActivity = Static<typeof adminActivitySchema>
