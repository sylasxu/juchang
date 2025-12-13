// User Model - 使用 TypeBox 组合能力复用 DB Schema
import { Elysia, t, type Static } from 'elysia';
import { selectUserSchema } from '@juchang/db';

/**
 * User Model Plugin
 * 使用 TypeBox 的组合能力复用 DB Schema
 * 使用 Static<typeof schema> 自动推导类型，避免手写类型定义
 */

// 分页查询参数（纯瞬态参数，不来自数据库）
const PaginationQuery = t.Object({
  page: t.Optional(t.Number({
    minimum: 1,
    default: 1,
    description: '页码',
  })),
  limit: t.Optional(t.Number({
    minimum: 1,
    maximum: 100,
    default: 20,
    description: '每页数量',
  })),
  search: t.Optional(t.String({ description: '搜索关键词（昵称/手机号）' })),
});

// 用户列表响应（从 DB Schema 派生）
const ListResponse = t.Object({
  data: t.Array(selectUserSchema), // 直接使用 DB Schema
  total: t.Number(),
  page: t.Number(),
  totalPages: t.Number(),
});

// 路径参数
const IdParams = t.Object({
  id: t.String({
    format: 'uuid',
    description: '用户ID',
  }),
});

// 更新用户请求体（可选字段）
const UpdateUserBody = t.Object({
  nickname: t.Optional(t.String({ maxLength: 50 })),
  bio: t.Optional(t.String({ maxLength: 200 })),
  gender: t.Optional(t.Union([t.Literal('male'), t.Literal('female'), t.Literal('unknown')])),
  membershipType: t.Optional(t.Union([t.Literal('free'), t.Literal('pro')])),
  isBlocked: t.Optional(t.Boolean()),
});

// 错误响应
const ErrorResponse = t.Object({
  code: t.Number(),
  msg: t.String(),
});

// 成功响应
const SuccessResponse = t.Object({
  code: t.Number(),
  msg: t.String(),
});

// 注册到 Elysia
export const userModel = new Elysia({ name: 'userModel' })
  .model({
    'user.paginationQuery': PaginationQuery,
    'user.listResponse': ListResponse,
    'user.response': selectUserSchema, // 直接使用 DB Schema
    'user.error': ErrorResponse,
    'user.success': SuccessResponse,
    'user.idParams': IdParams,
    'user.updateBody': UpdateUserBody,
  });

// 导出 TS 类型 (使用 Static<typeof schema> 自动推导)
export type PaginationQuery = Static<typeof PaginationQuery>;
export type ListResponse = Static<typeof ListResponse>;
export type ErrorResponse = Static<typeof ErrorResponse>;
export type SuccessResponse = Static<typeof SuccessResponse>;
export type IdParams = Static<typeof IdParams>;
export type UpdateUserBody = Static<typeof UpdateUserBody>;
