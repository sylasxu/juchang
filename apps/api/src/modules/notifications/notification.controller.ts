// Notification Controller - Elysia 实例作为控制器
import { Elysia } from 'elysia';
import { selectNotificationSchema } from '@juchang/db';
import { basePlugins, verifyAuth } from '../../setup';
import { notificationModel, type ErrorResponse } from './notification.model';
import {
  getNotificationList,
  getNotificationById,
  markNotificationAsRead,
  markNotificationsAsRead,
  markAllNotificationsAsRead,
  getUnreadCount,
  deleteNotification,
} from './notification.service';

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
        return {
          code: 401,
          msg: '未授权',
        } satisfies ErrorResponse;
      }

      const result = await getNotificationList(user.id, query);
      return result;
    },
    {
      detail: {
        tags: ['Notifications'],
        summary: '获取通知列表',
        description: '分页获取当前用户的通知列表，支持按已读状态和类型筛选',
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
    '/unread-count',
    async ({ set, jwt, headers }) => {
      const user = await verifyAuth(jwt, headers);
      if (!user) {
        set.status = 401;
        return {
          code: 401,
          msg: '未授权',
        } satisfies ErrorResponse;
      }

      const result = await getUnreadCount(user.id);
      return result;
    },
    {
      detail: {
        tags: ['Notifications'],
        summary: '获取未读通知数量',
        description: '获取当前用户的未读通知总数',
      },
      response: {
        200: 'notification.unreadCount',
        401: 'notification.error',
      },
    }
  )

  // 获取通知详情
  .get(
    '/:id',
    async ({ params, set, jwt, headers }) => {
      const user = await verifyAuth(jwt, headers);
      if (!user) {
        set.status = 401;
        return {
          code: 401,
          msg: '未授权',
        } satisfies ErrorResponse;
      }

      const notification = await getNotificationById(params.id, user.id);
      if (!notification) {
        set.status = 404;
        return {
          code: 404,
          msg: '通知不存在',
        } satisfies ErrorResponse;
      }

      return notification;
    },
    {
      detail: {
        tags: ['Notifications'],
        summary: '获取通知详情',
        description: '根据通知ID获取通知详情',
      },
      params: 'notification.idParams',
      response: {
        200: selectNotificationSchema,
        401: 'notification.error',
        404: 'notification.error',
      },
    }
  )

  // 标记单条通知为已读
  .post(
    '/:id/read',
    async ({ params, set, jwt, headers }) => {
      const user = await verifyAuth(jwt, headers);
      if (!user) {
        set.status = 401;
        return {
          code: 401,
          msg: '未授权',
        } satisfies ErrorResponse;
      }

      const success = await markNotificationAsRead(params.id, user.id);
      if (!success) {
        set.status = 404;
        return {
          code: 404,
          msg: '通知不存在',
        } satisfies ErrorResponse;
      }

      return {
        code: 200,
        msg: '已标记为已读',
      };
    },
    {
      detail: {
        tags: ['Notifications'],
        summary: '标记通知为已读',
        description: '标记单条通知为已读状态',
      },
      params: 'notification.idParams',
      response: {
        200: 'notification.success',
        401: 'notification.error',
        404: 'notification.error',
      },
    }
  )

  // 批量标记通知为已读
  .post(
    '/batch-read',
    async ({ body, set, jwt, headers }) => {
      const user = await verifyAuth(jwt, headers);
      if (!user) {
        set.status = 401;
        return {
          code: 401,
          msg: '未授权',
        } satisfies ErrorResponse;
      }

      const updatedCount = await markNotificationsAsRead(body.ids, user.id);
      return {
        code: 200,
        msg: `已标记 ${updatedCount} 条通知为已读`,
      };
    },
    {
      detail: {
        tags: ['Notifications'],
        summary: '批量标记通知为已读',
        description: '批量标记多条通知为已读状态',
      },
      body: 'notification.markRead',
      response: {
        200: 'notification.success',
        401: 'notification.error',
      },
    }
  )

  // 标记所有通知为已读
  .post(
    '/read-all',
    async ({ set, jwt, headers }) => {
      const user = await verifyAuth(jwt, headers);
      if (!user) {
        set.status = 401;
        return {
          code: 401,
          msg: '未授权',
        } satisfies ErrorResponse;
      }

      const updatedCount = await markAllNotificationsAsRead(user.id);
      return {
        code: 200,
        msg: `已标记 ${updatedCount} 条通知为已读`,
      };
    },
    {
      detail: {
        tags: ['Notifications'],
        summary: '标记所有通知为已读',
        description: '将当前用户的所有未读通知标记为已读',
      },
      response: {
        200: 'notification.success',
        401: 'notification.error',
      },
    }
  )

  // 删除通知
  .delete(
    '/:id',
    async ({ params, set, jwt, headers }) => {
      const user = await verifyAuth(jwt, headers);
      if (!user) {
        set.status = 401;
        return {
          code: 401,
          msg: '未授权',
        } satisfies ErrorResponse;
      }

      const success = await deleteNotification(params.id, user.id);
      if (!success) {
        set.status = 404;
        return {
          code: 404,
          msg: '通知不存在',
        } satisfies ErrorResponse;
      }

      return {
        code: 200,
        msg: '通知已删除',
      };
    },
    {
      detail: {
        tags: ['Notifications'],
        summary: '删除通知',
        description: '删除指定通知',
      },
      params: 'notification.idParams',
      response: {
        200: 'notification.success',
        401: 'notification.error',
        404: 'notification.error',
      },
    }
  );
