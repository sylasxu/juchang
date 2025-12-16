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
  'aiSearchQuotaToday',
  'aiQuotaResetAt',
  'membershipType',
]);

// AI 搜索请求
const AISearchRequest = t.Object({
  query: t.String({ 
    description: '自然语言搜索词',
    examples: ['观音桥附近的火锅，要安静点的'],
    minLength: 2,
    maxLength: 200,
  }),
  location: t.Optional(t.Tuple([t.Number(), t.Number()])),
  radius: t.Optional(t.Number({ minimum: 1, maximum: 50, default: 5 })),
});

// AI 搜索响应
const AISearchResponse = t.Object({
  filters: t.Object({
    type: t.Optional(t.String()),
    keywords: t.Array(t.String()),
    priceRange: t.Optional(t.Object({
      min: t.Number(),
      max: t.Number(),
    })),
    timeRange: t.Optional(t.Object({
      start: t.String(),
      end: t.String(),
    })),
  }),
  suggestions: t.Array(t.String()),
  confidence: t.Number({ minimum: 0, maximum: 1 }),
});

// AI 解析请求
const AIParseRequest = t.Object({
  input: t.String({ 
    description: '用户输入（自然语言或粘贴文本）',
    minLength: 5,
    maxLength: 1000,
  }),
  inputType: t.Optional(t.Union([
    t.Literal('text'),
    t.Literal('voice'),
    t.Literal('paste'),
  ])),
});

// AI 解析响应
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
    maxParticipants: t.Optional(t.Number()),
    feeType: t.Optional(t.String()),
    estimatedCost: t.Optional(t.Number()),
  }),
  confidence: t.Number({ minimum: 0, maximum: 1 }),
  suggestions: t.Array(t.String()),
});

// 用户风控报告请求
const AIUserReportRequest = t.Object({
  targetUserId: t.String({ format: 'uuid' }),
});

// 用户风控报告响应
const AIUserReportResponse = t.Object({
  userId: t.String(),
  nickname: t.String(),
  avatarUrl: t.Optional(t.String()),
  basicStats: t.Object({
    reliabilityRate: t.Number(),
    participationCount: t.Number(),
    fulfillmentCount: t.Number(),
    disputeCount: t.Number(),
    feedbackReceivedCount: t.Number(),
  }),
  timeline: t.Array(t.Object({
    activityId: t.String(),
    activityTitle: t.String(),
    date: t.String(),
    fulfilled: t.Boolean(),
    feedback: t.Optional(t.String()),
  })),
  feedbackDetails: t.Array(t.Object({
    date: t.String(),
    type: t.String(),
    content: t.String(),
  })),
  riskAssessment: t.Object({
    level: t.Union([t.Literal('low'), t.Literal('medium'), t.Literal('high')]),
    score: t.Number({ minimum: 0, maximum: 100 }),
    factors: t.Array(t.String()),
    recommendation: t.String(),
  }),
});

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
    'ai.searchRequest': AISearchRequest,
    'ai.searchResponse': AISearchResponse,
    'ai.parseRequest': AIParseRequest,
    'ai.parseResponse': AIParseResponse,
    'ai.userReportRequest': AIUserReportRequest,
    'ai.userReportResponse': AIUserReportResponse,
    'ai.quotaStatus': AIQuotaStatus,
    'ai.error': ErrorResponse,
  });

// 导出 TS 类型
export type AICreateActivityRequest = Static<typeof AICreateActivityRequest>;
export type AICreateActivityResponse = Static<typeof AICreateActivityResponse>;
export type AIChatRequest = Static<typeof AIChatRequest>;
export type AIChatResponse = Static<typeof AIChatResponse>;
export type AISearchRequest = Static<typeof AISearchRequest>;
export type AISearchResponse = Static<typeof AISearchResponse>;
export type AIParseRequest = Static<typeof AIParseRequest>;
export type AIParseResponse = Static<typeof AIParseResponse>;
export type AIUserReportRequest = Static<typeof AIUserReportRequest>;
export type AIUserReportResponse = Static<typeof AIUserReportResponse>;
export type AIQuotaStatus = Static<typeof AIQuotaStatus>;
export type ErrorResponse = Static<typeof ErrorResponse>;