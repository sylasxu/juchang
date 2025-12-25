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

// 注册到 Elysia
export const userModel = new Elysia({ name: 'userModel' })
  .model({
    'user.response': selectUserSchema, // 直接使用 DB Schema
    'user.updateProfile': UpdateProfileBody,
    'user.quotaResponse': QuotaResponse,
    'user.error': ErrorResponse,
  });

// 导出 TS 类型
export type UpdateProfileBody = Static<typeof UpdateProfileBody>;
export type QuotaResponse = Static<typeof QuotaResponse>;
export type ErrorResponse = Static<typeof ErrorResponse>;
