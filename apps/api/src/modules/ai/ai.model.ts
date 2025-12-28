// AI Model - v3.3 Chat-First: AI 解析 + 对话历史管理 (行业标准命名)
import { Elysia, t, type Static } from 'elysia';
import { selectConversationSchema } from '@juchang/db';

/**
 * AI Model Plugin - v3.3 Chat-First (行业标准命名)
 * 
 * 功能：
 * - AI 解析（魔法输入框）
 * - 对话历史管理（GET/POST/DELETE /ai/conversations）
 * - SSE 事件类型（创建场景 + 探索场景）
 */

// ==========================================
// AI 解析相关 Schema
// ==========================================

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

// ==========================================
// SSE 事件类型 (v3.2 新增探索场景)
// ==========================================

// SSE 事件类型枚举
const SSEEventType = t.Union([
  // 通用事件
  t.Literal('thinking'),    // AI 思考中
  t.Literal('chunk'),       // 流式文本块
  t.Literal('error'),       // 错误
  t.Literal('done'),        // 完成
  // 创建场景事件
  t.Literal('location'),    // 定位到位置
  t.Literal('draft'),       // 返回活动草稿
  // 探索场景事件 (v3.2 新增)
  t.Literal('searching'),   // 搜索中
  t.Literal('explore'),     // 返回探索结果
]);

// 探索结果项
const ExploreResultItem = t.Object({
  id: t.String(),
  title: t.String(),
  type: t.String(),
  lat: t.Number(),
  lng: t.Number(),
  locationName: t.String(),
  distance: t.Number({ description: '距离（米）' }),
  startAt: t.String(),
  currentParticipants: t.Number(),
  maxParticipants: t.Number(),
});

// 探索响应数据
const ExploreResponseData = t.Object({
  center: t.Object({
    lat: t.Number(),
    lng: t.Number(),
    name: t.String(),
  }),
  results: t.Array(ExploreResultItem),
  title: t.String({ description: '如：为你找到观音桥附近的 5 个热门活动' }),
});

// 活动草稿数据
const ActivityDraftData = t.Object({
  title: t.String(),
  description: t.Optional(t.String()),
  type: t.Union([
    t.Literal('food'),
    t.Literal('entertainment'),
    t.Literal('sports'),
    t.Literal('boardgame'),
    t.Literal('other'),
  ]),
  startAt: t.String(),
  location: t.Tuple([t.Number(), t.Number()]),
  locationName: t.String(),
  address: t.Optional(t.String()),
  locationHint: t.String(),
  maxParticipants: t.Number(),
  activityId: t.String({ description: '创建的 draft 活动 ID' }),
});

// ==========================================
// 对话历史相关 Schema (v3.3 行业标准命名)
// ==========================================

// 消息角色 (使用 assistant 符合 OpenAI 标准)
const ConversationRole = t.Union([
  t.Literal('user'),
  t.Literal('assistant'),
]);

// 消息类型
const ConversationMessageType = t.Union([
  t.Literal('text'),
  t.Literal('widget_dashboard'),
  t.Literal('widget_launcher'),
  t.Literal('widget_action'),
  t.Literal('widget_draft'),
  t.Literal('widget_share'),
  t.Literal('widget_explore'),
  t.Literal('widget_error'),
]);

// 对话消息响应
const ConversationMessage = t.Object({
  id: t.String(),
  userId: t.String(),
  role: ConversationRole,
  type: ConversationMessageType,
  content: t.Any({ description: 'JSONB 内容，根据 type 不同结构不同' }),
  activityId: t.Union([t.String(), t.Null()]),
  createdAt: t.String(),
});

// 获取对话历史查询参数 (增强版 - 支持多种筛选)
const ConversationsQuery = t.Object({
  // 分页参数
  cursor: t.Optional(t.String({ description: '分页游标（上一页最后一条消息的 ID）' })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 20, description: '获取数量' })),
  // 筛选参数 (可选，用于 Admin 审计等场景)
  userId: t.Optional(t.String({ description: '按用户 ID 筛选（不传则查当前用户）' })),
  activityId: t.Optional(t.String({ description: '按关联活动 ID 筛选' })),
  messageType: t.Optional(t.String({ description: '按消息类型筛选' })),
  role: t.Optional(t.Union([t.Literal('user'), t.Literal('assistant')], { description: '按角色筛选' })),
});

// 对话消息响应 (增强版 - 包含用户信息)
const ConversationMessageWithUser = t.Object({
  id: t.String(),
  userId: t.String(),
  userNickname: t.Union([t.String(), t.Null()], { description: '用户昵称' }),
  role: ConversationRole,
  type: ConversationMessageType,
  content: t.Any({ description: 'JSONB 内容，根据 type 不同结构不同' }),
  activityId: t.Union([t.String(), t.Null()]),
  createdAt: t.String(),
});

// 获取对话历史响应 (增强版)
const ConversationsResponse = t.Object({
  items: t.Array(ConversationMessageWithUser),
  total: t.Number({ description: '总数量' }),
  hasMore: t.Boolean({ description: '是否还有更多消息' }),
  cursor: t.Union([t.String(), t.Null()], { description: '下一页游标' }),
});

// 添加用户消息请求
const AddMessageRequest = t.Object({
  content: t.String({ minLength: 1, maxLength: 2000, description: '消息内容' }),
});

// 添加用户消息响应
const AddMessageResponse = t.Object({
  id: t.String(),
  msg: t.String(),
});

// 清空对话响应
const ClearConversationsResponse = t.Object({
  success: t.Boolean(),
  msg: t.String(),
  deletedCount: t.Number({ description: '删除的消息数量' }),
});

// 错误响应
const ErrorResponse = t.Object({
  code: t.Number(),
  msg: t.String(),
});

// 注册到 Elysia
export const aiModel = new Elysia({ name: 'aiModel' })
  .model({
    // AI 解析
    'ai.parseRequest': AIParseRequest,
    'ai.parseResponse': AIParseResponse,
    // SSE 事件类型 (v3.2 新增)
    'ai.sseEventType': SSEEventType,
    'ai.exploreResultItem': ExploreResultItem,
    'ai.exploreResponseData': ExploreResponseData,
    'ai.activityDraftData': ActivityDraftData,
    // 对话历史 (v3.2 新增)
    'ai.conversationMessage': ConversationMessage,
    'ai.conversationsQuery': ConversationsQuery,
    'ai.conversationsResponse': ConversationsResponse,
    'ai.addMessageRequest': AddMessageRequest,
    'ai.addMessageResponse': AddMessageResponse,
    'ai.clearConversationsResponse': ClearConversationsResponse,
    // 通用
    'ai.error': ErrorResponse,
  });

// 导出 TS 类型
export type AIParseRequest = Static<typeof AIParseRequest>;
export type AIParseResponse = Static<typeof AIParseResponse>;
export type SSEEventType = Static<typeof SSEEventType>;
export type ExploreResultItem = Static<typeof ExploreResultItem>;
export type ExploreResponseData = Static<typeof ExploreResponseData>;
export type ActivityDraftData = Static<typeof ActivityDraftData>;
export type ConversationRole = Static<typeof ConversationRole>;
export type ConversationMessageType = Static<typeof ConversationMessageType>;
export type ConversationMessage = Static<typeof ConversationMessage>;
export type ConversationsQuery = Static<typeof ConversationsQuery>;
export type ConversationsResponse = Static<typeof ConversationsResponse>;
export type AddMessageRequest = Static<typeof AddMessageRequest>;
export type AddMessageResponse = Static<typeof AddMessageResponse>;
export type ClearConversationsResponse = Static<typeof ClearConversationsResponse>;
export type ErrorResponse = Static<typeof ErrorResponse>;
