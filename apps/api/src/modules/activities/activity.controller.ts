// Activity Controller - 活动相关接口 (MVP 简化版)
import { Elysia, t } from 'elysia';
import { basePlugins, verifyAuth } from '../../setup';
import { activityModel, type ErrorResponse } from './activity.model';
import { 
  getMyActivities,
  getActivityById,
  createActivity, 
  updateActivityStatus,
  deleteActivity,
  joinActivity,
  quitActivity,
} from './activity.service';

export const activityController = new Elysia({ prefix: '/activities' })
  .use(basePlugins)
  .use(activityModel)

  // 获取我相关的活动（发布的 + 参与的）
  .get(
    '/mine',
    async ({ query, set, jwt, headers }) => {
      const user = await verifyAuth(jwt, headers);
      if (!user) {
        set.status = 401;
        return {
          code: 401,
          msg: '未授权',
        } satisfies ErrorResponse;
      }

      try {
        const result = await getMyActivities(user.id, query.type);
        return result;
      } catch (error: any) {
        set.status = 500;
        return {
          code: 500,
          msg: error.message || '获取活动列表失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Activities'],
        summary: '获取我相关的活动',
        description: '获取当前用户发布的和参与的活动列表',
      },
      query: 'activity.myActivitiesQuery',
      response: {
        200: 'activity.myActivitiesResponse',
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
        description: '根据活动ID获取活动详情，包含 isArchived 计算字段',
      },
      params: 'activity.idParams',
      response: {
        200: 'activity.detailResponse',
        404: 'activity.error',
      },
    }
  )

  // 创建活动
  .post(
    '/',
    async ({ body, set, jwt, headers }) => {
      const user = await verifyAuth(jwt, headers);
      if (!user) {
        set.status = 401;
        return {
          code: 401,
          msg: '未授权',
        } satisfies ErrorResponse;
      }

      try {
        const result = await createActivity(body, user.id);
        return {
          id: result.id,
          msg: '活动创建成功',
        };
      } catch (error: any) {
        set.status = 400;
        return {
          code: 400,
          msg: error.message || '创建活动失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Activities'],
        summary: '创建活动',
        description: '创建新活动，需要绑定手机号，会检查每日发布额度',
      },
      body: 'activity.createRequest',
      response: {
        200: 'activity.createResponse',
        400: 'activity.error',
        401: 'activity.error',
        403: 'activity.error',
      },
    }
  )

  // 更新活动状态（completed/cancelled）
  .patch(
    '/:id/status',
    async ({ params, body, set, jwt, headers }) => {
      const user = await verifyAuth(jwt, headers);
      if (!user) {
        set.status = 401;
        return {
          code: 401,
          msg: '未授权',
        } satisfies ErrorResponse;
      }

      try {
        await updateActivityStatus(params.id, user.id, body.status);
        return {
          success: true,
          msg: body.status === 'completed' ? '活动已确认成局' : '活动已取消',
        };
      } catch (error: any) {
        set.status = 400;
        return {
          code: 400,
          msg: error.message || '更新状态失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Activities'],
        summary: '更新活动状态',
        description: '活动发起人更新活动状态为 completed（成局）或 cancelled（取消）',
      },
      params: 'activity.idParams',
      body: 'activity.updateStatusRequest',
      response: {
        200: 'activity.success',
        400: 'activity.error',
        401: 'activity.error',
      },
    }
  )

  // 删除活动
  .delete(
    '/:id',
    async ({ params, set, jwt, headers }) => {
      const user = await verifyAuth(jwt, headers);
      if (!user) {
        set.status = 401;
        return {
          code: 401,
          msg: '未授权',
        } satisfies ErrorResponse;
      }

      try {
        await deleteActivity(params.id, user.id);
        return {
          success: true,
          msg: '活动已删除',
        };
      } catch (error: any) {
        set.status = 400;
        return {
          code: 400,
          msg: error.message || '删除活动失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Activities'],
        summary: '删除活动',
        description: '删除活动（仅 active 状态且未开始的活动可删除）',
      },
      params: 'activity.idParams',
      response: {
        200: 'activity.success',
        400: 'activity.error',
        401: 'activity.error',
      },
    }
  )

  // 报名活动
  .post(
    '/:id/join',
    async ({ params, set, jwt, headers }) => {
      const user = await verifyAuth(jwt, headers);
      if (!user) {
        set.status = 401;
        return {
          code: 401,
          msg: '未授权',
        } satisfies ErrorResponse;
      }

      try {
        const result = await joinActivity(params.id, user.id);
        return {
          success: true,
          msg: '报名成功',
          participantId: result.id,
        };
      } catch (error: any) {
        set.status = 400;
        return {
          code: 400,
          msg: error.message || '报名失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Activities'],
        summary: '报名活动',
        description: '报名参加活动，需要绑定手机号',
      },
      params: 'activity.idParams',
      response: {
        200: t.Object({
          success: t.Boolean(),
          msg: t.String(),
          participantId: t.String(),
        }),
        400: 'activity.error',
        401: 'activity.error',
        403: 'activity.error',
      },
    }
  )

  // 退出活动
  .post(
    '/:id/quit',
    async ({ params, set, jwt, headers }) => {
      const user = await verifyAuth(jwt, headers);
      if (!user) {
        set.status = 401;
        return {
          code: 401,
          msg: '未授权',
        } satisfies ErrorResponse;
      }

      try {
        await quitActivity(params.id, user.id);
        return {
          success: true,
          msg: '已退出活动',
        };
      } catch (error: any) {
        set.status = 400;
        return {
          code: 400,
          msg: error.message || '退出失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Activities'],
        summary: '退出活动',
        description: '退出已报名的活动',
      },
      params: 'activity.idParams',
      response: {
        200: 'activity.success',
        400: 'activity.error',
        401: 'activity.error',
      },
    }
  );
