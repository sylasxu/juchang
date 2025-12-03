import { createRoute, z } from '@hono/zod-openapi';
import { insertUserSchema, selectUserSchema } from '@juchang/db';
import { paginationParams } from '../../pipes/pagination.pipe'; // ✅ 复用上面的定义

const TAG = 'Users';

// --- 辅助 Schema (API 层专用，用于包装响应) ---
// 列表响应结构
const listUserResponse = z.object({
  data: z.array(selectUserSchema), // ✅ 复用 DB Schema
  total: z.number().openapi({ example: 100 }),
  page: z.number().openapi({ example: 1 }),
  totalPages: z.number().openapi({ example: 5 }),
});

// 错误响应
const error = z.object({
  code: z.number(),
  message: z.string(),
});

// ==========================================
// 1. 获取列表 (List) - 包含分页
// ==========================================
export const list = createRoute({
  method: 'get',
  path: '/',
  tags: [TAG],
  summary: '获取用户列表',
  request: {
    // ✅ 一行代码引入分页参数，无需重复写 page/limit 定义
    query: paginationParams, 
  },
  responses: {
    200: {
      description: '成功',
      content: { 'application/json': { schema: listUserResponse } },
    },
  },
});

// ==========================================
// 2. 创建用户 (Create)
// ==========================================
export const create = createRoute({
  method: 'post',
  path: '/',
  tags: [TAG],
  summary: '创建新用户',
  request: {
    body: {
      content: {
        'application/json': {
          // ✅ 复用 DB Insert Schema，并排除自增 ID 和 创建时间
          schema: insertUserSchema.omit({ 
            id: true, 
            createdAt: true,
            creditScore: true // 初始分由数据库默认值决定，不允许前端传
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: '创建成功',
      content: { 'application/json': { schema: selectUserSchema } },
    },
  },
});

// ==========================================
// 3. 获取详情 (Get One)
// ==========================================
export const getById = createRoute({
  method: 'get',
  path: '/{id}',
  tags: [TAG],
  summary: '获取用户详情',
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ 
        param: { name: 'id', in: 'path' }, 
        example: '123e4567-e89b-12d3-a456-426614174000' 
      }),
    }),
  },
  responses: {
    200: {
      description: '成功',
      content: { 'application/json': { schema: selectUserSchema } },
    },
    404: {
      description: '用户不存在',
      content: { 'application/json': { schema: errorResponse } },
    },
  },
});

// ==========================================
// 4. 更新/封禁 (Update)
// ==========================================
export const updateRoute = createRoute({
  method: 'patch',
  path: '/{id}',
  tags: [TAG],
  summary: '更新用户信息',
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ param: { name: 'id', in: 'path' } }),
    }),
    body: {
      content: {
        'application/json': {
          // ✅ 使用 partial() 让所有字段变为可选
          schema: insertUserSchema.partial().omit({ id: true, createdAt: true }),
        },
      },
    },
  },
  responses: {
    200: {
      description: '更新成功',
      content: { 'application/json': { schema: selectUserSchema } },
    },
  },
});