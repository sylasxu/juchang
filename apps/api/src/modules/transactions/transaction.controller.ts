// Transaction Controller - 支付交易控制器
import { Elysia } from 'elysia';
import { basePlugins, verifyAuth } from '../../setup';
import { transactionModel, type ErrorResponse } from './transaction.model';
import { createTransaction, getTransactionList, handleWxPayCallback } from './transaction.service';

export const transactionController = new Elysia({ prefix: '/transactions' })
  .use(basePlugins)
  .use(transactionModel)
  
  // 创建交易订单
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
        const result = await createTransaction(body, user.id);
        return result;
      } catch (error: any) {
        set.status = 400;
        return {
          code: 400,
          msg: error?.message || '创建交易失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Transactions'],
        summary: '创建交易订单',
        description: '创建支付订单，返回微信支付参数',
      },
      body: 'transaction.create',
    }
  )

  // 获取交易列表
  .get(
    '/',
    async ({ query, set, jwt, headers }) => {
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
        const result = await getTransactionList(query, user.id);
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
        tags: ['Transactions'],
        summary: '获取交易列表',
        description: '获取用户的交易记录，支持筛选和分页',
      },
      query: 'transaction.listQuery',
    }
  )

  // 微信支付回调
  .post(
    '/wx-callback',
    async ({ body, set }) => {
      try {
        const result = await handleWxPayCallback(body);
        return result;
      } catch (error: any) {
        console.error('微信支付回调处理失败:', error);
        set.status = 400;
        return {
          code: 400,
          msg: error?.message || '回调处理失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Transactions'],
        summary: '微信支付回调',
        description: '处理微信支付结果回调',
      },
      body: 'transaction.wxCallback',
    }
  );


// 购买强力召唤
transactionController.post(
  '/boost',
  async ({ body, set, jwt, headers }) => {
    const user = await verifyAuth(jwt, headers);
    if (!user) {
      set.status = 401;
      return { code: 401, msg: '未授权' };
    }

    try {
      const { purchaseBoost } = await import('./transaction.service');
      const result = await purchaseBoost(body, user.id);
      return result;
    } catch (error: any) {
      set.status = 400;
      return { code: 400, msg: error.message || '购买失败' };
    }
  },
  {
    detail: {
      tags: ['Transactions'],
      summary: '购买强力召唤',
      description: '为活动购买强力召唤服务（¥3/次）',
    },
    body: 'transaction.boostRequest',
  }
);

// 购买黄金置顶
transactionController.post(
  '/pin-plus',
  async ({ body, set, jwt, headers }) => {
    const user = await verifyAuth(jwt, headers);
    if (!user) {
      set.status = 401;
      return { code: 401, msg: '未授权' };
    }

    try {
      const { purchasePinPlus } = await import('./transaction.service');
      const result = await purchasePinPlus(body, user.id);
      return result;
    } catch (error: any) {
      set.status = 400;
      return { code: 400, msg: error.message || '购买失败' };
    }
  },
  {
    detail: {
      tags: ['Transactions'],
      summary: '购买黄金置顶',
      description: '为活动购买黄金置顶服务（¥5/次，24小时）',
    },
    body: 'transaction.pinPlusRequest',
  }
);

// 购买优先入场券
transactionController.post(
  '/fast-pass',
  async ({ body, set, jwt, headers }) => {
    const user = await verifyAuth(jwt, headers);
    if (!user) {
      set.status = 401;
      return { code: 401, msg: '未授权' };
    }

    try {
      const { purchaseFastPass } = await import('./transaction.service');
      const result = await purchaseFastPass(body, user.id);
      return result;
    } catch (error: any) {
      set.status = 400;
      return { code: 400, msg: error.message || '购买失败' };
    }
  },
  {
    detail: {
      tags: ['Transactions'],
      summary: '购买优先入场券',
      description: '购买优先入场券（¥2/次）',
    },
    body: 'transaction.fastPassRequest',
  }
);

// 购买Pro会员
transactionController.post(
  '/membership',
  async ({ body, set, jwt, headers }) => {
    const user = await verifyAuth(jwt, headers);
    if (!user) {
      set.status = 401;
      return { code: 401, msg: '未授权' };
    }

    try {
      const { purchaseMembership } = await import('./transaction.service');
      const result = await purchaseMembership(body, user.id);
      return result;
    } catch (error: any) {
      set.status = 400;
      return { code: 400, msg: error.message || '购买失败' };
    }
  },
  {
    detail: {
      tags: ['Transactions'],
      summary: '购买Pro会员',
      description: '购买Pro会员订阅（¥15/月）',
    },
    body: 'transaction.membershipRequest',
  }
);