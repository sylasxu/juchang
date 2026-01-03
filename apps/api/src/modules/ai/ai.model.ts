// AI Model - v3.3 Chat-First: AI 解析 + 对话历史管理 (行业标准命名)
import { Elysia, t, type Static } from 'elysia';

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
  t.Literal('widget_ask_preference'),  // v3.5 多轮对话偏好询问卡片
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

// 获取对话历史查询参数 (增强版 - 支持显式 scope 参数)
const ConversationsQuery = t.Object({
  // 分页参数
  cursor: t.Optional(t.String({ description: '分页游标（上一页最后一条消息的 ID）' })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 20, description: '获取数量' })),
  // 显式模式参数（避免隐式行为）
  scope: t.Optional(t.Union([
    t.Literal('mine'),
    t.Literal('all'),
  ], { 
    default: 'mine',
    description: 'mine=当前用户的对话, all=所有用户的对话(需Admin权限)' 
  })),
  // 筛选参数 (可选，用于 Admin 审计等场景)
  userId: t.Optional(t.String({ description: 'Admin 可指定查看某用户的对话' })),
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

// ==========================================
// Welcome Card 相关 Schema (v3.4 新增)
// ==========================================

// 快捷按钮类型
const QuickActionType = t.Union([
  t.Literal('explore_nearby'),
  t.Literal('continue_draft'),
  t.Literal('find_partner'),
]);

// 探索附近按钮上下文
const ExploreNearbyContext = t.Object({
  locationName: t.String({ description: '地点名称，如"观音桥"' }),
  lat: t.Number({ description: '纬度' }),
  lng: t.Number({ description: '经度' }),
  activityCount: t.Number({ description: '附近活动数量' }),
});

// 继续草稿按钮上下文
const ContinueDraftContext = t.Object({
  activityId: t.String({ description: '草稿活动 ID' }),
  activityTitle: t.String({ description: '活动标题' }),
});

// 找搭子按钮上下文
const FindPartnerContext = t.Object({
  activityType: t.String({ description: '活动类型，如 food、boardgame' }),
  activityTypeLabel: t.String({ description: '活动类型中文标签，如"火锅"、"桌游"' }),
  suggestedPrompt: t.String({ description: '预填的输入内容' }),
});

// 快捷按钮
const QuickAction = t.Object({
  type: QuickActionType,
  label: t.String({ description: '按钮文案' }),
  context: t.Union([ExploreNearbyContext, ContinueDraftContext, FindPartnerContext]),
});

// Welcome Card 响应
const WelcomeResponse = t.Object({
  greeting: t.String({ description: '问候语' }),
  quickActions: t.Array(QuickAction, { description: '快捷按钮数组，0-3 个' }),
  fallbackPrompt: t.String({ description: '兜底询问文案' }),
});

// Welcome Card 查询参数
const WelcomeQuery = t.Object({
  lat: t.Optional(t.Number({ description: '用户纬度' })),
  lng: t.Optional(t.Number({ description: '用户经度' })),
});

// ==========================================
// Metrics 相关 Schema (v3.4 新增)
// ==========================================

// Token 使用统计查询参数
const MetricsUsageQuery = t.Object({
  startDate: t.Optional(t.String({ description: '开始日期 YYYY-MM-DD' })),
  endDate: t.Optional(t.String({ description: '结束日期 YYYY-MM-DD' })),
});

// 每日 Token 使用统计
const DailyTokenUsage = t.Object({
  date: t.String(),
  totalRequests: t.Number(),
  inputTokens: t.Number(),
  outputTokens: t.Number(),
  totalTokens: t.Number(),
});

// Token 使用汇总
const TokenUsageSummary = t.Object({
  totalRequests: t.Number(),
  totalInputTokens: t.Number(),
  totalOutputTokens: t.Number(),
  totalTokens: t.Number(),
  avgTokensPerRequest: t.Number(),
});

// Tool 调用统计
const ToolCallStats = t.Object({
  toolName: t.String(),
  count: t.Number(),
});

// Metrics 响应
const MetricsUsageResponse = t.Object({
  summary: TokenUsageSummary,
  daily: t.Array(DailyTokenUsage),
  toolCalls: t.Array(ToolCallStats),
});

// ==========================================
// Prompt 相关 Schema (v3.4 新增)
// ==========================================

// Prompt 信息响应
const PromptInfoResponse = t.Object({
  version: t.String(),
  lastModified: t.String(),
  description: t.String(),
  features: t.Array(t.String()),
  content: t.String({ description: '当前 System Prompt 内容' }),
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
    // Welcome Card (v3.4 新增)
    'ai.welcomeQuery': WelcomeQuery,
    'ai.welcomeResponse': WelcomeResponse,
    'ai.quickAction': QuickAction,
    // Metrics (v3.4 新增)
    'ai.metricsUsageQuery': MetricsUsageQuery,
    'ai.metricsUsageResponse': MetricsUsageResponse,
    // Prompt (v3.4 新增)
    'ai.promptInfoResponse': PromptInfoResponse,
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

// Welcome Card 类型导出 (v3.4 新增)
export type QuickActionType = Static<typeof QuickActionType>;
export type ExploreNearbyContext = Static<typeof ExploreNearbyContext>;
export type ContinueDraftContext = Static<typeof ContinueDraftContext>;
export type FindPartnerContext = Static<typeof FindPartnerContext>;
export type QuickAction = Static<typeof QuickAction>;
export type WelcomeResponse = Static<typeof WelcomeResponse>;
export type WelcomeQuery = Static<typeof WelcomeQuery>;

// Metrics 类型导出 (v3.4 新增)
export type MetricsUsageQuery = Static<typeof MetricsUsageQuery>;
export type DailyTokenUsage = Static<typeof DailyTokenUsage>;
export type TokenUsageSummary = Static<typeof TokenUsageSummary>;
export type ToolCallStats = Static<typeof ToolCallStats>;
export type MetricsUsageResponse = Static<typeof MetricsUsageResponse>;

// Prompt 类型导出 (v3.4 新增)
export type PromptInfoResponse = Static<typeof PromptInfoResponse>;
