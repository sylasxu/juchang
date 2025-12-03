import { z } from 'zod'; // 原生 zod
import { paginationDto } from '@juchang/services'; // Service 层的 DTO

// 1. 这里不需要 extendZodWithOpenApi，因为我们在 index.ts 做过全局扩展了

// 2. 定义一次，到处复用
export const paginationParams = z.object({
  page: paginationDto.shape.page.openapi({
    param: { name: 'page', in: 'query' },
    description: '页码',
    example: 1,
  }),
  limit: paginationDto.shape.limit.openapi({
    param: { name: 'limit', in: 'query' },
    description: '每页数量',
    example: 20,
  }),
});