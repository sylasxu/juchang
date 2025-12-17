import { Type, type Static } from '@sinclair/typebox'

export const userSchema = Type.Object({
  id: Type.String(),
  nickname: Type.String(),
  phoneNumber: Type.Optional(Type.String()),
  avatarUrl: Type.Optional(Type.String()),
  status: Type.Union([
    Type.Literal('active'),
    Type.Literal('blocked'),
    Type.Literal('pending'),
    Type.Literal('unknown'),
  ]),
  membershipType: Type.Union([
    Type.Literal('free'),
    Type.Literal('pro'),
  ]),
  isRealNameVerified: Type.Boolean(),
  createdAt: Type.String({ format: 'date-time' }),
  lastActiveAt: Type.Optional(Type.String({ format: 'date-time' })),
  // Additional properties for admin features
  bio: Type.Optional(Type.String()),
  gender: Type.Optional(Type.Union([
    Type.Literal('male'),
    Type.Literal('female'),
    Type.Literal('other'),
    Type.Literal('unknown'),
  ])),
  isBlocked: Type.Optional(Type.Boolean()),
  moderationStatus: Type.Optional(Type.Union([
    Type.Literal('normal'),
    Type.Literal('flagged'),
    Type.Literal('blocked'),
  ])),
  riskScore: Type.Optional(Type.Number({ minimum: 0, maximum: 100 })),
  totalActivitiesCreated: Type.Optional(Type.Number({ minimum: 0 })),
  participationCount: Type.Optional(Type.Number({ minimum: 0 })),
  reliabilityRate: Type.Optional(Type.Number({ minimum: 0, maximum: 100 })),
  disputeCount: Type.Optional(Type.Number({ minimum: 0 })),
  aiCreateQuotaToday: Type.Optional(Type.Number({ minimum: 0 })),
  aiSearchQuotaToday: Type.Optional(Type.Number({ minimum: 0 })),
  aiQuotaResetAt: Type.Optional(Type.String({ format: 'date-time' })),
})

export type User = Static<typeof userSchema>

// Admin user type with additional management fields
export const adminUserSchema = Type.Intersect([
  userSchema,
  Type.Object({
    // Additional admin-only fields
    lastLoginIp: Type.Optional(Type.String()),
    registrationIp: Type.Optional(Type.String()),
    deviceInfo: Type.Optional(Type.String()),
    moderationNotes: Type.Optional(Type.String()),
    tags: Type.Optional(Type.Array(Type.String())),
  }),
])

export type AdminUser = Static<typeof adminUserSchema>