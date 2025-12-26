import { Type, type Static } from '@sinclair/typebox'

// MVP 用户 Schema (简化版) - 匹配 API 返回
export const userSchema = Type.Object({
  id: Type.String(),
  phoneNumber: Type.Union([Type.String(), Type.Null()]),
  nickname: Type.Union([Type.String(), Type.Null()]),
  avatarUrl: Type.Union([Type.String(), Type.Null()]),
  
  // AI 额度 (MVP 简化)
  aiCreateQuotaToday: Type.Number({ minimum: 0, default: 3 }),
  aiQuotaResetAt: Type.Union([Type.String(), Type.Null()]),
  
  // 统计
  activitiesCreatedCount: Type.Number({ minimum: 0, default: 0 }),
  participationCount: Type.Number({ minimum: 0, default: 0 }),
  
  // 系统
  createdAt: Type.String(),
  updatedAt: Type.String(),
})

export type User = Static<typeof userSchema>

// Admin 用户视图 (包含计算字段，用于 UI 显示)
export const adminUserSchema = Type.Intersect([
  userSchema,
  Type.Object({
    // 计算字段 - 用于 Admin 显示
    status: Type.Optional(Type.Union([
      Type.Literal('active'),
      Type.Literal('inactive'),
      Type.Literal('blocked'),
    ])),
    isPhoneBound: Type.Optional(Type.Boolean()),
  }),
])

export type AdminUser = Static<typeof adminUserSchema>
