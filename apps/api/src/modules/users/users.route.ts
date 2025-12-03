import { createRoute, type RouteHandler} from '@hono/zod-openapi';
import { z } from 'zod';
import { insertUserSchema, selectUserSchema } from '@juchang/db';
import { paginationParams } from '../../pipes/pagination.pipe'; // ✅ 复用上面的定义
import { userService } from '@juchang/services';

const TAG = 'Users';

// --- 辅助 Schema (API 层专用，用于包装响应) ---
// 列表响应结构
const listUserResponse = z.object({
  data: z.array(selectUserSchema).openapi({ example: [{ id: '1', name: 'John Doe', email: 'john.doe@example.com' }] }),
  total: z.number().openapi({ example: 100 }),
  page: z.number().openapi({ example: 1 }),
  totalPages: z.number().openapi({ example: 5 }),
});


// ==========================================
// 1. 获取列表 (List) - 包含分页
// ==========================================
export const list = createRoute({
  method: 'get',
  path: '/users',
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

export  const listHandler: RouteHandler<typeof list> = async (c) => {
  // query 自动推断为 { page: number, limit: number }
  const query = c.req.valid('query'); 
  const result = await userService.list(query);
  return c.json(result);
}
