// Chat Controller - 群聊消息控制器
import { Elysia } from 'elysia';
import { basePlugins, verifyAuth } from '../../setup';
import { chatModel, type ErrorResponse } from './chat.model';
import { sendMessage, getMessageList, revokeMessage } from './chat.service';

export const chatController = new Elysia({ prefix: '/chat' })
  .use(basePlugins)
  .use(chatModel)
  
  // 发送消息
  .post(
    '/messages',
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
        const message = await sendMessage(body, user.id);
        return message;
      } catch (error) {
        set.status = 400;
        return {
          code: 400,
          msg: error.message || '发送消息失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Chat'],
        summary: '发送消息',
        description: '在活动群聊中发送消息',
      },
      body: 'chat.sendMessage',
      response: {
        200: 'chat.messageListResponse',
        400: 'chat.error',
        401: 'chat.error',
      },
    }
  )

  // 获取消息列表
  .get(
    '/messages',
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
        const result = await getMessageList(query, user.id);
        return result;
      } catch (error) {
        set.status = 400;
        return {
          code: 400,
          msg: error.message || '获取消息失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Chat'],
        summary: '获取消息列表',
        description: '获取活动群聊的消息列表，支持分页',
      },
      query: 'chat.messageList',
      response: {
        200: 'chat.messageListResponse',
        400: 'chat.error',
        401: 'chat.error',
      },
    }
  )

  // 撤回消息
  .delete(
    '/messages/:id',
    async ({ params, set, jwt, headers }) => {
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
        const result = await revokeMessage(params.id, user.id);
        return result;
      } catch (error) {
        set.status = 400;
        return {
          code: 400,
          msg: error.message || '撤回消息失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Chat'],
        summary: '撤回消息',
        description: '撤回自己发送的消息（2分钟内）',
      },
      params: 'chat.idParams',
      response: {
        200: 'chat.messageListResponse',
        400: 'chat.error',
        401: 'chat.error',
      },
    }
  );