// Notification Controller - MVP 简化版
import { Elysia } from 'elysia';
import { basePlugins, verifyAuth } from '../../setup';
import { notificationModel, type ErrorResponse } from './notification.model';
import { getNotifications, markAsRead, getUnreadCount } from './notification.service';

export const notificationController = new Elysia({ prefix: '/notifications' })
  .use(basePlugins)
  .use(notificationModel)

  // 获取通知列表
  .get(
    '/',
    async ({ query, set, jwt, headers }) => {
      const user = await verifyAuth(jwt, headers);
      if (!user) {
        set.status = 401;
        return { code: 401, msg: '未授权' } satisfies ErrorResponse;
      }

      const result = await getNotifications(user.id, query);
      return result;
    },
    {
      detail: {
        tags: ['Notifications'],
        summary: '获取通知列表',
        description: '分页获取当前用户的通知列表',
      },
      query: 'notification.listQuery',
      response: {
        200: 'notification.listResponse',
        401: 'notification.error',
      },
    }
  )

  // 获取未读通知数量
  .get(
    '/unreadCount',
    async ({ set, jwt, headers }) => {
      const user = await verifyAuth(jwt, headers);
      if (!user) {
        set.status = 401;
        return { code: 401, msg: '未授权' } satisfies ErrorResponse;
      }

      const result = await getUnreadCount(user.id);
      return result;
    },
    {
      detail: {
        tags: ['Notifications'],
        summary: '获取未读通知数量',
      },
      response: {
        200: 'notification.unreadCount',
        401: 'notification.error',
      },
    }
  )

  // 标记通知为已读
  .post(
    '/:id/read',
    async ({ params, set, jwt, headers }) => {
      const user = await verifyAuth(jwt, headers);
      if (!user) {
        set.status = 401;
        return { code: 401, msg: '未授权' } satisfies ErrorResponse;
      }

      const success = await markAsRead(params.id, user.id);
      if (!success) {
        set.status = 404;
        return { code: 404, msg: '通知不存在' } satisfies ErrorResponse;
      }

      return { code: 200, msg: '已标记为已读' };
    },
    {
      detail: {
        tags: ['Notifications'],
        summary: '标记通知为已读',
      },
      params: 'notification.idParams',
      response: {
        200: 'notification.success',
        401: 'notification.error',
        404: 'notification.error',
      },
    }
  );
