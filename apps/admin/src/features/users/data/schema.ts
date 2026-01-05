/**
 * 用户 Schema - 从 @juchang/db 派生
 * 
 * 遵循项目规范：Single Source of Truth
 * 禁止手动重复定义 TypeBox Schema
 */
import { selectUserSchema, type User } from '@juchang/db'

// 直接复用 DB Schema
export const userSchema = selectUserSchema

// 类型导出
export type { User }
