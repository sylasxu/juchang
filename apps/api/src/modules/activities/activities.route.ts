import { createRoute, type RouteHandler } from '@hono/zod-openapi';
import { z } from 'zod';
import { selectActivitySchema, selectUserSchema, selectParticipantSchema } from '@juchang/db';
import { activityService } from '@juchang/services';

const TAG = 'Activities';

// --- 辅助 Schema (API 层专用，用于包装响应) ---
// 活动详情响应结构：复用 db 导出的 schema，通过 pick/extend 构建
const activityDetailResponse = selectActivitySchema
  .omit({ creatorId: true }) // 移除 creatorId，因为我们会返回完整的 creator 对象
  .extend({
    // ✅ 复用 selectUserSchema，只选择需要的字段
    creator: selectUserSchema.pick({
      id: true,
      nickname: true,
      avatarUrl: true,
      creditScore: true,
      gender: true,
      vibeTags: true,
    }),
    // ✅ 复用 selectParticipantSchema，扩展 user 字段
    participants: z.array(
      selectParticipantSchema.extend({
        user: selectUserSchema
          .pick({
            id: true,
            nickname: true,
            avatarUrl: true,
            creditScore: true,
          })
          .nullable(),
      })
    ),
    // location 在数据库中是 geometry 类型，但返回时需要转换为 [lng, lat] 格式
    location: z.tuple([z.number(), z.number()]).optional(),
  })
  .openapi({
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      title: '周末羽毛球局',
      description: '寻找羽毛球搭子',
      type: 'sports',
      startAt: '2024-01-15T10:00:00Z',
      location: [106.5516, 29.5630], // [lng, lat]
      locationName: '观音桥大融城',
      maxParticipants: 4,
      creator: {
        id: '123e4567-e89b-12d3-a456-426614174001',
        nickname: '小明',
        avatarUrl: 'https://example.com/avatar.jpg',
        creditScore: 95,
        gender: 'male',
        vibeTags: ['准时', '风趣'],
      },
      participants: [],
    },
  });

// ==========================================
// 1. 获取活动详情（用于扫码查看）
// ==========================================
export const getById = createRoute({
  method: 'get',
  path: '/activities/{id}',
  tags: [TAG],
  summary: '获取活动详情',
  description: '根据活动ID获取活动详情，支持通过扫码查看活动',
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ param: { name: 'id', in: 'path' }, example: '123e4567-e89b-12d3-a456-426614174000' }),
    }),
  },
  responses: {
    200: {
      description: '成功',
      content: {
        'application/json': {
          schema: activityDetailResponse,
        },
      },
    },
    404: {
      description: '活动不存在',
      content: {
        'application/json': {
          schema: z.object({
            code: z.number(),
            msg: z.string(),
          }),
        },
      },
    },
  },
});

export const getByIdHandler: RouteHandler<typeof getById> = async (c) => {
  const { id } = c.req.valid('param');

  try {
    const activity = await activityService.getById(id);
    // service 已经将 location 转换为 [lng, lat] 格式
    // 移除 lng、lat 和 creatorId 字段
    const { lng, lat, creatorId, ...activityData } = activity;
    return c.json(activityData as z.infer<typeof activityDetailResponse>, 200);
  } catch (error) {
    if (error instanceof Error && error.message === '活动不存在') {
      return c.json({ code: 404, msg: '活动不存在' } as const, 404);
    }
    throw error;
  }
};

