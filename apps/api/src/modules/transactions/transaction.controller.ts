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
      } catch (error) {
        set.status = 400;
        return {
          code: 400,
          msg: error.message || '创建交易失败',
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
      response: {
        200: 'transaction.createResponse',
        400: 'transaction.error',
        401: 'transaction.error',
      },
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
      } catch (error) {
        set.status = 400;
        return {
          code: 400,
          msg: error.message || '获取交易列表失败',
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
      response: {
        200: 'transaction.listResponse',
        400: 'transaction.error',
        401: 'transaction.error',
      },
    }
  )

  // 微信支付回调
  .post(
    '/wx-callback',
    async ({ body, set }) => {
      try {
        const result = await handleWxPayCallback(body);
        return result;
      } catch (error) {
        console.error('微信支付回调处理失败:', error);
        set.status = 400;
        return {
          code: 400,
          msg: error.message || '回调处理失败',
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
      response: {
        200: 'transaction.createResponse',
        400: 'transaction.error',
      },
    }
  );