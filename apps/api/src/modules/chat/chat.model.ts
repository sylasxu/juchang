// Chat Model - 群聊消息相关 TypeBox Schema
import { Elysia, t, type Static } from 'elysia';
import { selectChatMessageSchema } from '@juchang/db';

// 发送消息请求
const SendMessageRequest = t.Object({
  activityId: t.String({ format: 'uuid' }),
  type: t.Union([t.Literal('text'), t.Literal('image'), t.Literal('location')]),
  content: t.String({ minLength: 1, maxLength: 2000 }),
  metadata: t.Optional(t.Object({})),
});

// 消息列表查询
const MessageListQuery = t.Object({
  activityId: t.String({ format: 'uuid' }),
  page: t.Optional(t.Number({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 50, default: 20 })),
  before: t.Optional(t.String()), // 消息ID，用于分页
});

// 消息列表响应
const MessageListResponse = t.Object({
  data: t.Array(selectChatMessageSchema),
  hasMore: t.Boolean(),
  nextCursor: t.Optional(t.String()),
});

// 路径参数
const IdParams = t.Object({
  id: t.String({ format: 'uuid' }),
});

// 错误响应
const ErrorResponse = t.Object({
  code: t.Number(),
  msg: t.String(),
});

// 注册到 Elysia Model Plugin
export const chatModel = new Elysia({ name: 'chatModel' })
  .model({
    'chat.sendMessage': SendMessageRequest,
    'chat.messageList': MessageListQuery,
    'chat.messageListResponse': MessageListResponse,
    'chat.idParams': IdParams,
    'chat.error': ErrorResponse,
  });

// 导出 TS 类型
export type SendMessageRequest = Static<typeof SendMessageRequest>;
export type MessageListQuery = Static<typeof MessageListQuery>;
export type MessageListResponse = Static<typeof MessageListResponse>;
export type IdParams = Static<typeof IdParams>;
export type ErrorResponse = Static<typeof ErrorResponse>;