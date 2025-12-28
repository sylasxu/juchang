import { Type, type Static } from '@sinclair/typebox'

// 用户 Schema - 匹配 API 返回 (排除 wxOpenId)
export const userSchema = Type.Object({
  id: Type.String(),
  phoneNumber: Type.Union([Type.String(), Type.Null()]),
  nickname: Type.Union([Type.String(), Type.Null()]),
  avatarUrl: Type.Union([Type.String(), Type.Null()]),
  
  // AI 额度
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
