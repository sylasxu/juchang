// User Model - TypeBox schemas (MVP 简化版)
import { Elysia, t, type Static } from 'elysia';
import { selectUserSchema } from '@juchang/db';

/**
 * User Model Plugin (MVP 简化版)
 * 只保留 getMe, updateProfile, getQuota 相关 schema
 */

// 更新用户资料请求体 (MVP 简化)
const UpdateProfileBody = t.Object({
  nickname: t.Optional(t.String({ maxLength: 50, description: '昵称' })),
  avatarUrl: t.Optional(t.String({ maxLength: 500, description: '头像URL' })),
});

// 额度响应
const QuotaResponse = t.Object({
  aiCreateQuota: t.Number({ description: '今日剩余 AI 创建额度' }),
  resetAt: t.Union([t.String(), t.Null()], { description: '额度重置时间' }),
});

// 错误响应
const ErrorResponse = t.Object({
  code: t.Number(),
  msg: t.String(),
});

// ============ Admin Schemas ============

// Admin 用户响应 (排除敏感字段 wxOpenId)
// Requirements: 1.4, 2.3
export const AdminUserSchema = t.Omit(selectUserSchema, ['wxOpenId']);

// 用户列表查询参数 (分页、搜索)
// Requirements: 1.1, 1.2, 1.3
export const UserListQuerySchema = t.Object({
  page: t.Optional(t.Number({ minimum: 1, default: 1, description: '页码' })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 20, description: '每页数量' })),
  search: t.Optional(t.String({ description: '搜索昵称或手机号' })),
});

// 用户列表响应
// Requirements: 1.1, 1.5
export const UserListResponseSchema = t.Object({
  data: t.Array(AdminUserSchema),
  total: t.Number({ description: '总数' }),
  page: t.Number({ description: '当前页码' }),
  limit: t.Number({ description: '每页数量' }),
});

// Admin 更新用户请求体
// Requirements: 3.3
export const UpdateUserRequestSchema = t.Object({
  nickname: t.Optional(t.String({ maxLength: 50, description: '昵称' })),
  avatarUrl: t.Optional(t.String({ maxLength: 500, description: '头像URL' })),
});

// 注册到 Elysia
export const userModel = new Elysia({ name: 'userModel' })
  .model({
    'user.response': selectUserSchema, // 直接使用 DB Schema
    'user.updateProfile': UpdateProfileBody,
    'user.quotaResponse': QuotaResponse,
    'user.error': ErrorResponse,
    // Admin models
    'user.adminUser': AdminUserSchema,
    'user.listQuery': UserListQuerySchema,
    'user.listResponse': UserListResponseSchema,
    'user.updateRequest': UpdateUserRequestSchema,
  });

// 导出 TS 类型
export type UpdateProfileBody = Static<typeof UpdateProfileBody>;
export type QuotaResponse = Static<typeof QuotaResponse>;
export type ErrorResponse = Static<typeof ErrorResponse>;

// Admin 类型导出
export type AdminUser = Static<typeof AdminUserSchema>;
export type UserListQuery = Static<typeof UserListQuerySchema>;
export type UserListResponse = Static<typeof UserListResponseSchema>;
export type UpdateUserRequest = Static<typeof UpdateUserRequestSchema>;
