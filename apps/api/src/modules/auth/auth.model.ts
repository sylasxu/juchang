// Auth Model - TypeBox schemas and types
import { Elysia, t, type Static } from 'elysia';

// 微信登录请求
const WxLoginRequest = t.Object({
  code: t.String({ description: '微信登录凭证' }),
  phoneNumber: t.Optional(t.String({ description: '手机号' })),
  nickname: t.Optional(t.String({ description: '昵称' })),
  avatarUrl: t.Optional(t.String({ description: '头像URL' })),
});

// 登录响应
const LoginResponse = t.Object({
  user: t.Any({ description: '用户信息' }),
  token: t.String({ description: 'JWT Token' }),
});

// 更新用户信息请求
const UpdateProfileRequest = t.Object({
  nickname: t.Optional(t.String({ minLength: 1, maxLength: 20 })),
  avatarUrl: t.Optional(t.String()),
  gender: t.Optional(t.Union([t.Literal('male'), t.Literal('female'), t.Literal('unknown')])),
  interestTags: t.Optional(t.Array(t.String())),
});

// 完善用户信息请求（注册）
const RegisterRequest = t.Object({
  nickname: t.String({ minLength: 1, maxLength: 20, description: '昵称' }),
  avatarUrl: t.Optional(t.String({ description: '头像URL' })),
  gender: t.Optional(t.Union([t.Literal('male'), t.Literal('female'), t.Literal('unknown')])),
  bio: t.Optional(t.String({ maxLength: 200, description: '个人简介' })),
  interestTags: t.Optional(t.Array(t.String(), { description: '兴趣标签' })),
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
    'auth.loginResponse': LoginResponse,
    'auth.updateProfile': UpdateProfileRequest,
    'auth.register': RegisterRequest,
    'auth.error': ErrorResponse,
  });

// 导出 TS 类型
export type WxLoginRequest = Static<typeof WxLoginRequest>;
export type LoginResponse = Static<typeof LoginResponse>;
export type UpdateProfileRequest = Static<typeof UpdateProfileRequest>;
export type RegisterRequest = Static<typeof RegisterRequest>;
export type ErrorResponse = Static<typeof ErrorResponse>;