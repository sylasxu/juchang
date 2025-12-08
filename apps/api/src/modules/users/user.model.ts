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
  page: t.Number({
    minimum: 1,
    default: 1,
    description: '页码',
  }),
  limit: t.Number({
    minimum: 1,
    maximum: 100,
    default: 20,
    description: '每页数量',
  }),
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

// 错误响应
const ErrorResponse = t.Object({
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
    'user.idParams': IdParams,
  });

// 导出 TS 类型 (使用 Static<typeof schema> 自动推导)
export type PaginationQuery = Static<typeof PaginationQuery>;
export type ListResponse = Static<typeof ListResponse>;
export type ErrorResponse = Static<typeof ErrorResponse>;
export type IdParams = Static<typeof IdParams>;
