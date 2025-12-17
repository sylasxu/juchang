// Admin Activity Controller - 管理后台活动管理控制器
import { Elysia, t } from 'elysia';
import { basePlugins, verifyAuth } from '../../setup';
import { 
  adminActivityModel,
  ActivityModerationAction,
  type AdminActivityListResponse,
  type ErrorResponse 
} from './admin-activity.model';
import { 
  getAdminActivitiesList,
  getAdminActivityById,
  moderateActivity,
  bulkModerateActivities,
  getActivityStats
} from './admin-activity.service';

export const adminActivityController = new Elysia({ prefix: '/admin/activities' })
  .use(basePlugins) // 引入基础插件（包含 JWT）
  .use(adminActivityModel) // 引入 Model Plugin
  
  // 获取活动列表（支持筛选、搜索、分页）
  .get(
    '/',
    async ({ query }) => {
      try {
        const result = await getAdminActivitiesList(query);
        return result;
      } catch (error) {
        console.error('获取活动列表失败:', error);
        throw new Error('获取活动列表失败');
      }
    },
    {
      detail: {
        tags: ['Admin - Activities'],
        summary: '获取活动列表',
        description: '管理后台获取活动列表，支持多维度筛选、搜索和分页',
      },
      query: 'admin.activity.filterOptions',
      response: {
        200: 'admin.activity.listResponse',
      },
    }
  )

  // 获取活动详情
  .get(
    '/:id',
    async ({ params, set }) => {
      try {
        const activity = await getAdminActivityById(params.id);

        if (!activity) {
          set.status = 404;
          return {
            code: 404,
            msg: '活动不存在',
          } satisfies ErrorResponse;
        }

        return activity;
      } catch (error) {
        console.error('获取活动详情失败:', error);
        set.status = 500;
        return {
          code: 500,
          msg: '获取活动详情失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Admin - Activities'],
        summary: '获取活动详情',
        description: '管理后台获取单个活动的详细信息',
      },
      params: 'admin.activity.idParams',
      response: {
        200: 'admin.activity.view',
        404: 'admin.activity.error',
        500: 'admin.activity.error',
      },
    }
  )

  // 活动审核操作（需要管理员权限）
  .post(
    '/:id/moderate',
    async ({ params, body, set, jwt, headers }) => {
      // JWT 认证
      const user = await verifyAuth(jwt, headers);
      if (!user) {
        set.status = 401;
        return {
          code: 401,
          msg: '未授权',
        } satisfies ErrorResponse;
      }

      // TODO: 检查用户是否有管理员权限

      try {
        const result = await moderateActivity(
          {
            activityId: params.id,
            action: body.action,
            reason: body.reason,
            notes: body.notes,
            adminId: user.id
          },
          user.id
        );

        return {
          success: result.success,
          message: result.message,
        };
      } catch (error) {
        console.error('活动审核失败:', error);
        set.status = 400;
        return {
          code: 400,
          msg: error instanceof Error ? error.message : '活动审核失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Admin - Activities'],
        summary: '活动审核操作',
        description: '对活动执行审核操作（批准、隐藏、删除、标记等）',
      },
      params: 'admin.activity.idParams',
      body: t.Omit(ActivityModerationAction, ['activityId', 'adminId']),
      response: {
        200: t.Object({
          success: t.Boolean(),
          message: t.String(),
        }),
        400: 'admin.activity.error',
        401: 'admin.activity.error',
      },
    }
  )

  // 批量审核操作
  .post(
    '/bulk-moderate',
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

      // TODO: 检查用户是否有管理员权限

      try {
        const result = await bulkModerateActivities(
          body.activityIds,
          body.action,
          body.reason,
          body.notes,
          user.id
        );

        return result;
      } catch (error) {
        console.error('批量审核失败:', error);
        set.status = 400;
        return {
          code: 400,
          msg: error instanceof Error ? error.message : '批量审核失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Admin - Activities'],
        summary: '批量审核活动',
        description: '对多个活动执行批量审核操作',
      },
      body: 'admin.activity.bulkModeration',
      response: {
        200: t.Object({
          success: t.Boolean(),
          processed: t.Number(),
          message: t.String(),
        }),
        400: 'admin.activity.error',
        401: 'admin.activity.error',
      },
    }
  )

  // 获取活动统计信息
  .get(
    '/stats',
    async ({ set }) => {
      try {
        const stats = await getActivityStats();
        return stats;
      } catch (error) {
        console.error('获取活动统计失败:', error);
        set.status = 500;
        return {
          code: 500,
          msg: '获取活动统计失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Admin - Activities'],
        summary: '获取活动统计',
        description: '获取活动的各种统计信息（总数、状态分布、类型分布等）',
      },
      response: {
        200: t.Object({
          totalActivities: t.Number(),
          todayActivities: t.Number(),
          statusStats: t.Record(t.String(), t.Number()),
          typeStats: t.Record(t.String(), t.Number()),
          riskStats: t.Record(t.String(), t.Number()),
        }),
        500: 'admin.activity.error',
      },
    }
  );