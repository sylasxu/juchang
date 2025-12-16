// Admin Transaction Controller - 管理后台交易管理控制器
import { Elysia, t } from 'elysia';
import { basePlugins } from '../../setup';
import { adminTransactionModel, type ErrorResponse } from './admin-transaction.model';
import { 
  getAdminTransactionList, 
  getAdminTransactionDetail, 
  processRefund, 
  getRevenueAnalytics 
} from './admin-transaction.service';

export const adminTransactionController = new Elysia({ prefix: '/admin/transactions' })
  .use(basePlugins)
  .use(adminTransactionModel)
  
  // 获取交易列表
  .get(
    '/',
    async ({ query, set }) => {
      try {
        const result = await getAdminTransactionList(query);
        return result;
      } catch (error: any) {
        set.status = 400;
        return {
          code: 400,
          msg: error?.message || '获取交易列表失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Admin - Transactions'],
        summary: '获取交易列表',
        description: '获取管理后台交易列表，支持筛选、搜索和分页',
      },
      query: 'adminTransaction.filterQuery',
      response: {
        200: 'adminTransaction.listResponse',
        400: 'adminTransaction.error',
      },
    }
  )

  // 获取交易详情
  .get(
    '/:id',
    async ({ params, set }) => {
      try {
        const result = await getAdminTransactionDetail(params.id);
        return result;
      } catch (error: any) {
        set.status = 404;
        return {
          code: 404,
          msg: error?.message || '交易记录不存在',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Admin - Transactions'],
        summary: '获取交易详情',
        description: '获取指定交易的详细信息',
      },
      params: 'adminTransaction.idParams',
      response: {
        200: 'adminTransaction.detailResponse',
        404: 'adminTransaction.error',
      },
    }
  )

  // 处理退款
  .post(
    '/refund',
    async ({ body, set }) => {
      try {
        // TODO: 添加管理员身份验证
        const adminId = 'admin-user-id'; // 临时硬编码
        const result = await processRefund(body, adminId);
        return result;
      } catch (error: any) {
        set.status = 400;
        return {
          code: 400,
          msg: error?.message || '退款处理失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Admin - Transactions'],
        summary: '处理退款',
        description: '为指定交易处理退款申请',
      },
      body: 'adminTransaction.refundRequest',
      response: {
        200: t.Object({
          success: t.Boolean(),
          message: t.String(),
        }),
        400: 'adminTransaction.error',
      },
    }
  )

  // 获取收入分析
  .get(
    '/analytics/revenue',
    async ({ query, set }) => {
      try {
        const result = await getRevenueAnalytics(query);
        return result;
      } catch (error: any) {
        set.status = 400;
        return {
          code: 400,
          msg: error?.message || '获取收入分析失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Admin - Transactions'],
        summary: '获取收入分析',
        description: '获取收入趋势、产品分析和用户群体数据',
      },
      query: 'adminTransaction.revenueQuery',
      response: {
        200: 'adminTransaction.revenueResponse',
        400: 'adminTransaction.error',
      },
    }
  );