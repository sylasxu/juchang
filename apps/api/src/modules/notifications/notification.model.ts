// Notification Model - TypeBox schemas 派生自 DB Schema
import { Elysia, t, type Static } from 'elysia';
import { selectNotificationSchema } from '@juchang/db';

/**
 * Notification Model Plugin
 * 遵循 Single Source of Truth 原则：
 * - 从 DB schema 派生字段定义
 * - 瞬态参数（如 page、limit）手动定义
 */

// 通知列表查询参数
const NotificationListQuery = t.Object({
  page: t.Optional(t.Number({
    minimum: 1,
    default: 1,
    description: '页码',
  })),
  limit: t.Optional(t.Number({
    minimum: 1,
    maximum: 100,
    default: 20,
    description: '每页数量',
  })),
  isRead: t.Optional(t.Boolean({
    description: '是否已读',
  })),
  type: t.Optional(t.String({
    description: '通知类型',
  })),
});

// 批量标记已读请求
const MarkReadRequest = t.Object({
  ids: t.Array(t.String({ format: 'uuid' }), {
    description: '通知ID列表',
    minItems: 1,
  }),
});

// 未读数量响应
const UnreadCountResponse = t.Object({
  count: t.Number({
    description: '未读通知数量',
  }),
});

// 通知列表响应
const NotificationListResponse = t.Object({
  data: t.Array(selectNotificationSchema),
  total: t.Number(),
  page: t.Number(),
  totalPages: t.Number(),
});

// 路径参数
const IdParams = t.Object({
  id: t.String({
    format: 'uuid',
    description: '通知ID',
  }),
});

// 错误响应
const ErrorResponse = t.Object({
  code: t.Number(),
  msg: t.String(),
});

// 成功响应
const SuccessResponse = t.Object({
  code: t.Number(),
  msg: t.String(),
});

// 注册到 Elysia Model Plugin
export const notificationModel = new Elysia({ name: 'notificationModel' })
  .model({
    'notification.listQuery': NotificationListQuery,
    'notification.markRead': MarkReadRequest,
    'notification.unreadCount': UnreadCountResponse,
    'notification.listResponse': NotificationListResponse,
    'notification.response': selectNotificationSchema,
    'notification.idParams': IdParams,
    'notification.error': ErrorResponse,
    'notification.success': SuccessResponse,
  });

// 导出 TS 类型
export type NotificationListQuery = Static<typeof NotificationListQuery>;
export type MarkReadRequest = Static<typeof MarkReadRequest>;
export type UnreadCountResponse = Static<typeof UnreadCountResponse>;
export type NotificationListResponse = Static<typeof NotificationListResponse>;
export type IdParams = Static<typeof IdParams>;
export type ErrorResponse = Static<typeof ErrorResponse>;
export type SuccessResponse = Static<typeof SuccessResponse>;
