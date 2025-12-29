// Chat Controller - 群聊消息接口 (MVP 简化版)
import { Elysia, t } from 'elysia';
import { basePlugins, verifyAuth } from '../../setup';
import { chatModel, ChatMessageResponseSchema, type ErrorResponse } from './chat.model';
import { getMessages, sendMessage } from './chat.service';

export const chatController = new Elysia({ prefix: '/chat' })
  .use(basePlugins)
  .use(chatModel)

  // 获取消息列表（轮询）
  .get(
    '/:activityId/messages',
    async ({ params, query, set, jwt, headers }) => {
      const user = await verifyAuth(jwt, headers);
      if (!user) {
        set.status = 401;
        return {
          code: 401,
          msg: '未授权',
        } satisfies ErrorResponse;
      }

      try {
        const result = await getMessages(params.activityId, user.id, query);
        return result;
      } catch (error: any) {
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
        description: '获取活动群聊的消息列表，支持增量获取（轮询）。返回 isArchived 标识群聊是否已归档。',
      },
      params: 'chat.activityIdParams',
      query: 'chat.messageListQuery',
      response: {
        200: t.Object({
          messages: t.Array(ChatMessageResponseSchema),
          isArchived: t.Boolean({ description: '群聊是否已归档' }),
        }),
        400: 'chat.error',
        401: 'chat.error',
      },
    }
  )

  // 发送消息
  .post(
    '/:activityId/messages',
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
        const result = await sendMessage(params.activityId, user.id, body);
        return {
          id: result.id,
          msg: '发送成功',
        };
      } catch (error: any) {
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
        description: '在活动群聊中发送文本消息。群聊归档后无法发送。',
      },
      params: 'chat.activityIdParams',
      body: 'chat.sendMessageRequest',
      response: {
        200: 'chat.sendMessageResponse',
        400: 'chat.error',
        401: 'chat.error',
      },
    }
  );
