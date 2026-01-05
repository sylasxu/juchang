/**
 * 活动 Schema - 从 @juchang/db 派生
 * 
 * 遵循项目规范：Single Source of Truth
 * 禁止手动重复定义 TypeBox Schema
 */
import { Type, type Static } from '@sinclair/typebox'
import { 
  selectActivitySchema, 
  type Activity,
  activityTypeEnum,
  activityStatusEnum,
} from '@juchang/db'

// 直接复用 DB Schema
export const activitySchema = selectActivitySchema

// 枚举 Schema (从 DB 枚举值派生)
export const activityTypeSchema = Type.Union(
  activityTypeEnum.enumValues.map(v => Type.Literal(v))
)

export const activityStatusSchema = Type.Union(
  activityStatusEnum.enumValues.map(v => Type.Literal(v))
)

// Admin 活动视图 (扩展计算字段)
export const adminActivitySchema = Type.Intersect([
  selectActivitySchema,
  Type.Object({
    // 关联信息 (API 层 join 返回)
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

// 类型导出
export type { Activity }
export type ActivityType = Static<typeof activityTypeSchema>
export type ActivityStatus = Static<typeof activityStatusSchema>
export type AdminActivity = Static<typeof adminActivitySchema>
