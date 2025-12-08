// Auth Model - 定义认证相关的 DTO
import { Elysia, t, type Static } from 'elysia';
import { selectUserSchema } from '@juchang/db';

/**
 * Auth Model Plugin
 * 使用 Static<typeof schema> 自动推导类型，避免手写类型定义
 * 
 * 遵循 Single Source of Truth 原则：
 * - phoneNumber 从 DB schema 派生（使用 t.Pick）
 * - password 是瞬态参数（DB 存储 hash，登录时是原始密码），手动定义
 */

// 登录请求 DTO
// 重用 DB schema 中的 phoneNumber 定义，password 作为瞬态参数手动定义
const LoginRequest = t.Intersect([
  t.Pick(selectUserSchema, ['phoneNumber']),
  t.Object({
    password: t.String({
      description: '密码',
      minLength: 8,
    }),
  }),
]);

// Token 响应 DTO
const TokenResponse = t.Object({
  token: t.String({
    description: 'JWT Token',
  }),
});

// 错误响应
const ErrorResponse = t.Object({
  code: t.Number(),
  msg: t.String(),
});

// 注册到 Elysia
export const authModel = new Elysia({ name: 'authModel' })
  .model({
    'auth.login': LoginRequest,
    'auth.token': TokenResponse,
    'auth.error': ErrorResponse,
  });

// 导出 TS 类型 (使用 Static<typeof schema> 自动推导)
export type LoginRequest = Static<typeof LoginRequest>;
export type TokenResponse = Static<typeof TokenResponse>;
export type ErrorResponse = Static<typeof ErrorResponse>;
