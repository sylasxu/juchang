// AI Model - MVP 简化版：只保留 parse 功能
import { Elysia, t, type Static } from 'elysia';

/**
 * AI Model Plugin - MVP 版本
 * 只保留 AI 解析功能（魔法输入框）
 */

// AI 解析请求
const AIParseRequest = t.Object({
  text: t.String({ 
    description: '用户输入的自然语言文本',
    minLength: 2,
    maxLength: 500,
  }),
  location: t.Optional(t.Tuple([t.Number(), t.Number()], {
    description: '用户当前位置 [lng, lat]',
  })),
});

// AI 解析响应（SSE 流式返回的最终结果）
const AIParseResponse = t.Object({
  parsed: t.Object({
    title: t.Optional(t.String()),
    description: t.Optional(t.String()),
    type: t.Optional(t.String()),
    startAt: t.Optional(t.String()),
    endAt: t.Optional(t.String()),
    location: t.Optional(t.Tuple([t.Number(), t.Number()])),
    locationName: t.Optional(t.String()),
    address: t.Optional(t.String()),
    locationHint: t.Optional(t.String({ description: '重庆地形位置备注' })),
    maxParticipants: t.Optional(t.Number()),
    feeType: t.Optional(t.String()),
    estimatedCost: t.Optional(t.Number()),
  }),
  confidence: t.Number({ minimum: 0, maximum: 1 }),
  suggestions: t.Array(t.String()),
});

// 错误响应
const ErrorResponse = t.Object({
  code: t.Number(),
  msg: t.String(),
});

// 注册到 Elysia
export const aiModel = new Elysia({ name: 'aiModel' })
  .model({
    'ai.parseRequest': AIParseRequest,
    'ai.parseResponse': AIParseResponse,
    'ai.error': ErrorResponse,
  });

// 导出 TS 类型
export type AIParseRequest = Static<typeof AIParseRequest>;
export type AIParseResponse = Static<typeof AIParseResponse>;
export type ErrorResponse = Static<typeof ErrorResponse>;
