import { z } from 'zod'

// 用户状态 - 基于 isBlocked 字段
const userStatusSchema = z.union([
  z.literal('active'),
  z.literal('blocked'),
])
export type UserStatus = z.infer<typeof userStatusSchema>

// 会员类型
const membershipTypeSchema = z.union([
  z.literal('free'),
  z.literal('pro'),
])
export type MembershipType = z.infer<typeof membershipTypeSchema>

// 性别
const genderSchema = z.union([
  z.literal('male'),
  z.literal('female'),
  z.literal('unknown'),
])
export type Gender = z.infer<typeof genderSchema>

// 用户 Schema - 匹配 API 返回的数据结构
const userSchema = z.object({
  id: z.string().uuid(),
  wxOpenId: z.string(),
  phoneNumber: z.string().nullable(),
  nickname: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  bio: z.string().nullable(),
  gender: genderSchema,
  participationCount: z.number(),
  fulfillmentCount: z.number(),
  disputeCount: z.number(),
  activitiesCreatedCount: z.number(),
  feedbackReceivedCount: z.number(),
  membershipType: membershipTypeSchema,
  membershipExpiresAt: z.string().nullable(),
  aiCreateQuotaToday: z.number(),
  aiSearchQuotaToday: z.number(),
  aiQuotaResetAt: z.string().nullable(),
  lastLocation: z.any().nullable(),
  lastActiveAt: z.string().nullable(),
  interestTags: z.array(z.string()).nullable(),
  isRegistered: z.boolean(),
  isRealNameVerified: z.boolean(),
  isBlocked: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type User = z.infer<typeof userSchema>

// 管理员用户视图 Schema - 包含额外的管理信息
const adminUserSchema = z.object({
  id: z.string().uuid(),
  wxOpenId: z.string(),
  phoneNumber: z.string().nullable(),
  nickname: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  bio: z.string().nullable(),
  gender: genderSchema,
  participationCount: z.number(),
  fulfillmentCount: z.number(),
  disputeCount: z.number(),
  activitiesCreatedCount: z.number(),
  feedbackReceivedCount: z.number(),
  membershipType: membershipTypeSchema,
  membershipExpiresAt: z.string().nullable(),
  aiCreateQuotaToday: z.number(),
  aiSearchQuotaToday: z.number(),
  aiQuotaResetAt: z.string().nullable(),
  lastLocation: z.any().nullable(),
  lastActiveAt: z.string().nullable(),
  interestTags: z.array(z.string()).nullable(),
  isRegistered: z.boolean(),
  isRealNameVerified: z.boolean(),
  isBlocked: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  // 管理员专用字段
  totalActivitiesCreated: z.number(),
  totalTransactionAmount: z.number(),
  riskScore: z.number(),
  moderationStatus: z.union([
    z.literal('clean'),
    z.literal('flagged'),
    z.literal('blocked')
  ]),
  reliabilityRate: z.number(),
})
export type AdminUser = z.infer<typeof adminUserSchema>

export const userListSchema = z.array(userSchema)
export const adminUserListSchema = z.array(adminUserSchema)

// 用户列表响应
export const userListResponseSchema = z.object({
  data: userListSchema,
  total: z.number(),
  page: z.number(),
  totalPages: z.number(),
})
export type UserListResponse = z.infer<typeof userListResponseSchema>

// 管理员用户列表响应
export const adminUserListResponseSchema = z.object({
  data: adminUserListSchema,
  total: z.number(),
  page: z.number(),
  totalPages: z.number(),
})
export type AdminUserListResponse = z.infer<typeof adminUserListResponseSchema>
