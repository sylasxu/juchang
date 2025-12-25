// Auth Model - TypeBox schemas and types (MVP 简化版)
import { Elysia, t, type Static } from 'elysia';
import { selectUserSchema } from '@juchang/db';

// 微信登录请求
const WxLoginRequest = t.Object({
  code: t.String({ description: '微信登录凭证' }),
});

// 绑定手机号请求 (延迟验证)
const BindPhoneRequest = t.Object({
  code: t.String({ description: 'getPhoneNumber 返回的 code' }),
});

// 绑定手机号响应
const BindPhoneResponse = t.Object({
  success: t.Boolean(),
  phoneNumber: t.String(),
});

// 登录响应 - 使用 DB schema 派生
const LoginResponse = t.Object({
  user: selectUserSchema,
  token: t.String({ description: 'JWT Token' }),
  isNewUser: t.Boolean({ description: '是否新用户' }),
});

// 错误响应
const ErrorResponse = t.Object({
  code: t.Number(),
  msg: t.String(),
});

// 注册到 Elysia Model Plugin
export const authModel = new Elysia({ name: 'authModel' })
  .model({
    'auth.wxLogin': WxLoginRequest,
    'auth.bindPhone': BindPhoneRequest,
    'auth.bindPhoneResponse': BindPhoneResponse,
    'auth.loginResponse': LoginResponse,
    'auth.error': ErrorResponse,
  });

// 导出 TS 类型
export type WxLoginRequest = Static<typeof WxLoginRequest>;
export type BindPhoneRequest = Static<typeof BindPhoneRequest>;
export type BindPhoneResponse = Static<typeof BindPhoneResponse>;
export type LoginResponse = Static<typeof LoginResponse>;
export type ErrorResponse = Static<typeof ErrorResponse>;
