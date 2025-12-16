// Chat Controller - 群聊消息控制器
import { Elysia, t } from 'elysia';
import { basePlugins, verifyAuth } from '../../setup';
import { chatModel, type ErrorResponse } from './chat.model';
import { sendMessage, getMessageList, revokeMessage, getMyChats, archiveChat } from './chat.service';

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
      } catch (error: any) {
        set.status = 400;
        return {
          code: 400,
          msg: error?.message || '发送消息失败',
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
      } catch (error: any) {
        set.status = 400;
        return {
          code: 400,
          msg: error?.message || '获取消息失败',
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
      } catch (error: any) {
        set.status = 400;
        return {
          code: 400,
          msg: error?.message || '撤回消息失败',
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
    }
  )

  // 获取我的群聊列表
  .get(
    '/my-chats',
    async ({ query, set, jwt, headers }) => {
      const user = await verifyAuth(jwt, headers);
      if (!user) {
        set.status = 401;
        return { code: 401, msg: '未授权' };
      }

      try {
        const chats = await getMyChats(user.id, query);
        return chats;
      } catch (error: any) {
        set.status = 500;
        return { code: 500, msg: error?.message || '获取群聊列表失败' };
      }
    },
    {
      detail: {
        tags: ['Chat'],
        summary: '获取我的群聊列表',
        description: '获取当前用户参与的所有活动群聊',
      },
    }
  )

  // 归档群聊
  .put(
    '/activity/:activityId/archive',
    async ({ params, set, jwt, headers }) => {
      const user = await verifyAuth(jwt, headers);
      if (!user) {
        set.status = 401;
        return { code: 401, msg: '未授权' };
      }

      try {
        await archiveChat(params.activityId, user.id);
        return { msg: '群聊已归档' };
      } catch (error: any) {
        set.status = 400;
        return { code: 400, msg: error?.message || '归档失败' };
      }
    },
    {
      detail: {
        tags: ['Chat'],
        summary: '归档群聊',
        description: '活动发起人归档群聊',
      },
    }
  );
