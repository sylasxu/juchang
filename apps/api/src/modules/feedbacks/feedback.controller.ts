// Feedback Controller - Elysia 实例作为控制器
import { Elysia } from 'elysia';
import { basePlugins, verifyAuth } from '../../setup';
import { feedbackModel, type ErrorResponse } from './feedback.model';
import {
  createFeedback,
  getFeedbackList,
  getUserFeedbackStats,
  getUserFeedbacks,
} from './feedback.service';

export const feedbackController = new Elysia({ prefix: '/feedbacks' })
  .use(basePlugins)
  .use(feedbackModel)

  // 提交差评反馈
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
        const feedback = await createFeedback(user.id, body);
        return {
          msg: '反馈提交成功',
          id: feedback.id,
        };
      } catch (error) {
        set.status = 400;
        return {
          code: 400,
          msg: error instanceof Error ? error.message : '提交反馈失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Feedbacks'],
        summary: '提交差评反馈',
        description: '活动结束后，参与者可以对其他参与者提交差评反馈',
      },
      body: 'feedback.create',
      response: {
        200: 'feedback.success',
        400: 'feedback.error',
        401: 'feedback.error',
      },
    }
  )

  // 获取反馈列表（管理员）
  .get(
    '/',
    async ({ query, set, jwt, headers }) => {
      // 可选：添加管理员权限验证
      const user = await verifyAuth(jwt, headers);
      if (!user) {
        set.status = 401;
        return {
          code: 401,
          msg: '未授权',
        } satisfies ErrorResponse;
      }

      const result = await getFeedbackList(query);
      return result;
    },
    {
      detail: {
        tags: ['Feedbacks'],
        summary: '获取反馈列表',
        description: '获取差评反馈列表，支持按活动、用户、原因筛选',
      },
      query: 'feedback.listQuery',
      response: {
        200: 'feedback.listResponse',
        401: 'feedback.error',
      },
    }
  )

  // 获取用户差评统计
  .get(
    '/user/:id/stats',
    async ({ params, set }) => {
      try {
        const stats = await getUserFeedbackStats(params.id);
        return stats;
      } catch (error) {
        set.status = 500;
        return {
          code: 500,
          msg: '获取统计失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Feedbacks'],
        summary: '获取用户差评统计',
        description: '获取指定用户收到的差评统计信息',
      },
      params: 'feedback.idParams',
      response: {
        200: 'feedback.userStats',
        500: 'feedback.error',
      },
    }
  )

  // 获取用户收到的差评列表
  .get(
    '/user/:id',
    async ({ params, query, set }) => {
      try {
        const result = await getUserFeedbacks(params.id, query);
        return result;
      } catch (error) {
        set.status = 500;
        return {
          code: 500,
          msg: '获取差评列表失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Feedbacks'],
        summary: '获取用户收到的差评',
        description: '获取指定用户收到的差评详情列表',
      },
      params: 'feedback.idParams',
      query: 'feedback.listQuery',
      response: {
        200: 'feedback.listResponse',
        500: 'feedback.error',
      },
    }
  );
