// Activity Controller - Elysia 实例作为控制器
import { Elysia } from 'elysia';
import { activityModel, type ErrorResponse } from './activity.model';
import { getActivityById } from './activity.service';

export const activityController = new Elysia({ prefix: '/activities' })
  .use(activityModel) // 引入 DTO
  .get(
    '/:id',
    async ({ params, set }) => {
      const activity = await getActivityById(params.id);

      if (!activity) {
        set.status = 404;
        return {
          code: 404,
          msg: '活动不存在',
        } satisfies ErrorResponse;
      }

      return activity;
    },
    {
      detail: {
        tags: ['Activities'],
        summary: '获取活动详情',
        description: '根据活动ID获取活动详情，支持通过扫码查看活动',
      },
      params: 'activity.idParams',
      response: {
        200: 'activity.detailResponse',
        404: 'activity.error',
      },
    }
  );

