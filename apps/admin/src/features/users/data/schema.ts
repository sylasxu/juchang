import { Type, type Static } from '@sinclair/typebox'

// MVP 用户 Schema (简化版)
export const userSchema = Type.Object({
  id: Type.String(),
  wxOpenId: Type.String(),
  phoneNumber: Type.Optional(Type.String()),
  nickname: Type.Optional(Type.String()),
  avatarUrl: Type.Optional(Type.String()),
  
  // AI 额度 (MVP 简化)
  aiCreateQuotaToday: Type.Number({ minimum: 0, default: 3 }),
  aiQuotaResetAt: Type.Optional(Type.String({ format: 'date-time' })),
  
  // 统计
  activitiesCreatedCount: Type.Number({ minimum: 0, default: 0 }),
  participationCount: Type.Number({ minimum: 0, default: 0 }),
  
  // 系统
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
})

export type User = Static<typeof userSchema>

// Admin 用户视图 (包含计算字段)
export const adminUserSchema = Type.Intersect([
  userSchema,
  Type.Object({
    // 计算字段 - 用于 Admin 显示
    status: Type.Optional(Type.Union([
      Type.Literal('active'),
      Type.Literal('inactive'),
    ])),
    isPhoneBound: Type.Optional(Type.Boolean()),
  }),
])

export type AdminUser = Static<typeof adminUserSchema>
