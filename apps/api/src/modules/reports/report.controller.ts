// Report Controller - 举报管理接口
import { Elysia } from 'elysia';
import { basePlugins, verifyAuth } from '../../setup';
import { 
  reportModel, 
  type ErrorResponse 
} from './report.model';
import { 
  createReport, 
  getReports, 
  getReportById, 
  updateReport 
} from './report.service';

export const reportController = new Elysia({ prefix: '/reports' })
  .use(basePlugins)
  .use(reportModel)

  // POST /reports - 提交举报（需要登录）
  .post(
    '/',
    async ({ body, set, jwt, headers }) => {
      const user = await verifyAuth(jwt, headers);
      if (!user) {
        set.status = 401;
        return { code: 401, msg: '未授权，请先登录' } satisfies ErrorResponse;
      }

      try {
        const result = await createReport(body, user.id);
        return { id: result.id, msg: '举报已提交，我们会尽快处理' };
      } catch (error) {
        set.status = 500;
        const message = error instanceof Error ? error.message : '举报提交失败';
        return { code: 500, msg: message } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Reports'],
        summary: '提交举报',
        description: '用户提交举报（活动/消息/用户），需要登录',
      },
      body: 'report.createRequest',
      response: {
        200: 'report.createSuccess',
        401: 'report.error',
        500: 'report.error',
      },
    }
  )

  // GET /reports - 获取举报列表（Admin）
  .get(
    '/',
    async ({ query }) => {
      // TODO: 添加 Admin 权限验证
      const result = await getReports(query);
      return result;
    },
    {
      detail: {
        tags: ['Reports'],
        summary: '获取举报列表',
        description: '获取举报列表，支持按状态和类型筛选（Admin）',
      },
      query: 'report.listQuery',
      response: {
        200: 'report.listResponse',
      },
    }
  )

  // GET /reports/:id - 获取举报详情（Admin）
  .get(
    '/:id',
    async ({ params, set }) => {
      // TODO: 添加 Admin 权限验证
      const report = await getReportById(params.id);
      if (!report) {
        set.status = 404;
        return { code: 404, msg: '举报不存在' } satisfies ErrorResponse;
      }
      return report;
    },
    {
      detail: {
        tags: ['Reports'],
        summary: '获取举报详情',
        description: '根据 ID 获取举报详细信息（Admin）',
      },
      params: 'report.idParams',
      response: {
        200: 'report.response',
        404: 'report.error',
      },
    }
  )

  // PATCH /reports/:id - 更新举报状态（Admin）
  .patch(
    '/:id',
    async ({ params, body, set, jwt, headers }) => {
      // 验证登录状态（Admin 操作需要登录）
      const user = await verifyAuth(jwt, headers);
      if (!user) {
        set.status = 401;
        return { code: 401, msg: '未授权' } satisfies ErrorResponse;
      }

      // TODO: 添加 Admin 角色验证

      const updated = await updateReport(params.id, body, user.id);
      if (!updated) {
        set.status = 404;
        return { code: 404, msg: '举报不存在' } satisfies ErrorResponse;
      }
      return updated;
    },
    {
      detail: {
        tags: ['Reports'],
        summary: '更新举报状态',
        description: '更新举报处理状态和备注（Admin）',
      },
      params: 'report.idParams',
      body: 'report.updateRequest',
      response: {
        200: 'report.response',
        401: 'report.error',
        404: 'report.error',
      },
    }
  );
