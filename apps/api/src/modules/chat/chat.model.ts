// Chat Model - TypeBox schemas (MVP 简化版)
import { Elysia, t, type Static } from 'elysia';

/**
 * Chat Model Plugin (MVP 简化版)
 * 
 * MVP 接口：
 * - GET /chat/:activityId/messages - 获取消息列表（轮询）
 * - POST /chat/:activityId/messages - 发送消息
 */

// 消息响应
export const ChatMessageResponseSchema = t.Object({
  id: t.String(),
  activityId: t.String(),
  senderId: t.Union([t.String(), t.Null()]),
  senderNickname: t.Union([t.String(), t.Null()]),
  senderAvatarUrl: t.Union([t.String(), t.Null()]),
  type: t.String(),
  content: t.String(),
  createdAt: t.String(),
});

// 消息列表查询参数
const MessageListQuery = t.Object({
  since: t.Optional(t.String({ description: '上次获取的最后一条消息ID，用于增量获取' })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 50, description: '获取数量' })),
});

// 发送消息请求
const SendMessageRequest = t.Object({
  content: t.String({ minLength: 1, maxLength: 2000, description: '消息内容' }),
});

// 发送消息响应
const SendMessageResponse = t.Object({
  id: t.String(),
  msg: t.String(),
});

// 路径参数
const ActivityIdParams = t.Object({
  activityId: t.String({ format: 'uuid', description: '活动ID' }),
});

// 错误响应
const ErrorResponse = t.Object({
  code: t.Number(),
  msg: t.String(),
});

// 注册到 Elysia Model Plugin
export const chatModel = new Elysia({ name: 'chatModel' })
  .model({
    'chat.messageResponse': ChatMessageResponseSchema,
    'chat.messageListQuery': MessageListQuery,
    'chat.sendMessageRequest': SendMessageRequest,
    'chat.sendMessageResponse': SendMessageResponse,
    'chat.activityIdParams': ActivityIdParams,
    'chat.error': ErrorResponse,
  });

// 导出 TS 类型
export type ChatMessageResponse = Static<typeof ChatMessageResponseSchema>;
export type MessageListQuery = Static<typeof MessageListQuery>;
export type SendMessageRequest = Static<typeof SendMessageRequest>;
export type SendMessageResponse = Static<typeof SendMessageResponse>;
export type ActivityIdParams = Static<typeof ActivityIdParams>;
export type ErrorResponse = Static<typeof ErrorResponse>;
