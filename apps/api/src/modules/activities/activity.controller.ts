// Activity Controller - Elysia 实例作为控制器
import { Elysia, t } from 'elysia';
import { basePlugins, verifyAuth } from '../../setup';
import { 
  activityModel, 
  MapActivityItem,
  type ErrorResponse 
} from './activity.model';
import { getActivitiesNearby, createActivity, getActivityById } from './activity.service';

export const activityController = new Elysia({ prefix: '/activities' })
  .use(basePlugins) // 引入基础插件（包含 JWT）
  .use(activityModel) // 引入 Model Plugin
  
  // 地图查询 - 获取附近活动
  .get(
    '/map',
    async ({ query }) => {
      const result = await getActivitiesNearby(query);
      return result;
    },
    {
      detail: {
        tags: ['Activities'],
        summary: '地图查询活动',
        description: '根据地理位置查询附近的活动，支持类型和状态筛选',
      },
      query: 'activity.mapQuery',
      response: {
        200: t.Array(MapActivityItem),
      },
    }
  )

  // 创建活动（需要认证）
  .post(
    '/',
    async ({ body, set, jwt, headers }) => {
      // JWT 认证
      const user = await verifyAuth(jwt, headers);
      if (!user) {
        set.status = 401;
        return {
          code: 401,
          msg: '未授权',
        } satisfies ErrorResponse;
      }

      try {
        const newActivity = await createActivity(body, user.id);

        return {
          id: newActivity.id,
          msg: '活动创建成功',
        };
      } catch (error) {
        set.status = 500;
        return {
          code: 500,
          msg: '创建活动失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Activities'],
        summary: '创建活动',
        description: '创建新活动，支持增值服务选项',
      },
      body: 'activity.createRequest',
      response: {
        200: t.Object({
          id: t.String(),
          msg: t.String(),
        }),
        401: 'activity.error',
        500: 'activity.error',
      },
    }
  )

  // 获取活动详情
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
        description: '根据活动ID获取活动详情，包含创建者和参与者信息',
      },
      params: 'activity.idParams',
      response: {
        200: 'activity.detailResponse',
        404: 'activity.error',
      },
    }
  );

