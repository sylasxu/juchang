// AI Model - AI 功能相关的 TypeBox Schema
import { Elysia, t, type Static } from 'elysia';
import { selectUserSchema, insertActivitySchema } from '@juchang/db';

/**
 * AI Model Plugin
 * 处理 AI 相关功能的请求和响应模型
 */

// AI 创建活动请求
const AICreateActivityRequest = t.Object({
  prompt: t.String({ 
    description: 'AI 创建活动的自然语言描述',
    examples: ['周五观音桥吃火锅，3人，AA'],
    minLength: 5,
    maxLength: 200,
  }),
});

// AI 创建活动响应（基于 insertActivitySchema 派生）
const AICreateActivityResponse = t.Intersect([
  t.Pick(insertActivitySchema, [
    'title',
    'description',
    'startAt',
    'endAt',
    'type',
    'maxParticipants',
    'feeType',
    'estimatedCost',
    'locationName',
    'address',
  ]),
  t.Object({
    location: t.Tuple([t.Number(), t.Number()]), // [lng, lat]
    confidence: t.Number({ 
      minimum: 0, 
      maximum: 1, 
      description: 'AI 解析置信度' 
    }),
    suggestions: t.Optional(t.Array(t.String({ description: '优化建议' }))),
  }),
]);

// AI 对话请求
const AIChatRequest = t.Object({
  message: t.String({ 
    description: '用户消息',
    minLength: 1,
    maxLength: 500,
  }),
  context: t.Optional(t.Object({
    activityId: t.Optional(t.String({ format: 'uuid' })),
    location: t.Optional(t.Tuple([t.Number(), t.Number()])),
  })),
});

// AI 对话响应
const AIChatResponse = t.Object({
  message: t.String({ description: 'AI 回复内容' }),
  type: t.Union([
    t.Literal('text'),
    t.Literal('activity_suggestion'),
    t.Literal('location_recommendation'),
  ]),
  data: t.Optional(t.Any({ description: '结构化数据（如活动建议）' })),
});

// 用户 AI 额度状态（从 selectUserSchema 派生）
const AIQuotaStatus = t.Pick(selectUserSchema, [
  'aiCreateQuotaToday',
  'aiChatQuotaToday',
  'aiQuotaResetAt',
  'membershipType',
]);

// 错误响应
const ErrorResponse = t.Object({
  code: t.Number(),
  msg: t.String(),
});

// 注册到 Elysia
export const aiModel = new Elysia({ name: 'aiModel' })
  .model({
    'ai.createActivityRequest': AICreateActivityRequest,
    'ai.createActivityResponse': AICreateActivityResponse,
    'ai.chatRequest': AIChatRequest,
    'ai.chatResponse': AIChatResponse,
    'ai.quotaStatus': AIQuotaStatus,
    'ai.error': ErrorResponse,
  });

// 导出 TS 类型
export type AICreateActivityRequest = Static<typeof AICreateActivityRequest>;
export type AICreateActivityResponse = Static<typeof AICreateActivityResponse>;
export type AIChatRequest = Static<typeof AIChatRequest>;
export type AIChatResponse = Static<typeof AIChatResponse>;
export type AIQuotaStatus = Static<typeof AIQuotaStatus>;
export type ErrorResponse = Static<typeof ErrorResponse>;