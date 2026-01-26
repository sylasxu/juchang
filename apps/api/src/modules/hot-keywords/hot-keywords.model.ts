// Hot Keywords Model - TypeBox schemas (v4.8 Digital Ascension)
import { Elysia, t, type Static } from 'elysia';
import { selectGlobalKeywordSchema, insertGlobalKeywordSchema } from '@juchang/db';

/**
 * Hot Keywords Model Plugin (v4.8 Digital Ascension)
 * 
 * 接口：
 * - GET /hot-keywords - 小程序获取热词列表
 * - GET /hot-keywords/admin - Admin 获取所有热词
 * - POST /hot-keywords/admin - Admin 创建热词
 * - PATCH /hot-keywords/admin/:id - Admin 更新热词
 * - DELETE /hot-keywords/admin/:id - Admin 删除热词
 * - GET /hot-keywords/admin/analytics - Admin 获取分析数据
 */

// ==========================================
// 从 DB Schema 派生响应 Schema（遵循项目规范）
// ==========================================

// 全局关键词响应 Schema（从 DB 派生）
const GlobalKeywordResponse = t.Object({
  id: t.String(),
  keyword: t.String(),
  matchType: t.Union([t.Literal('exact'), t.Literal('prefix'), t.Literal('fuzzy')]),
  responseType: t.Union([
    t.Literal('widget_explore'),
    t.Literal('widget_draft'),
    t.Literal('widget_launcher'),
    t.Literal('widget_action'),
    t.Literal('widget_ask_preference'),
    t.Literal('text'),
  ]),
  responseContent: t.Any(), // JSONB
  priority: t.Number(),
  validFrom: t.Union([t.String(), t.Null()]),
  validUntil: t.Union([t.String(), t.Null()]),
  isActive: t.Boolean(),
  hitCount: t.Number(),
  conversionCount: t.Number(),
  createdBy: t.Union([t.String(), t.Null()]),
  createdAt: t.String(),
  updatedAt: t.String(),
});

// 热词列表项（简化版，用于 Hot Chips 显示）
const HotKeywordListItem = t.Object({
  id: t.String(),
  keyword: t.String(),
  responseType: t.Union([
    t.Literal('widget_explore'),
    t.Literal('widget_draft'),
    t.Literal('widget_launcher'),
    t.Literal('widget_action'),
    t.Literal('widget_ask_preference'),
    t.Literal('text'),
  ]),
  priority: t.Number(),
  hitCount: t.Number(),
});

// ==========================================
// 创建/更新 Schema
// ==========================================

// 创建热词请求
const CreateGlobalKeywordRequest = t.Object({
  keyword: t.String({ minLength: 1, maxLength: 100, description: '关键词文本' }),
  matchType: t.Union([
    t.Literal('exact'),
    t.Literal('prefix'),
    t.Literal('fuzzy'),
  ], { description: '匹配方式' }),
  responseType: t.Union([
    t.Literal('widget_explore'),
    t.Literal('widget_draft'),
    t.Literal('widget_launcher'),
    t.Literal('widget_action'),
    t.Literal('widget_ask_preference'),
    t.Literal('text'),
  ], { description: '响应类型' }),
  responseContent: t.Any({ description: '预设响应内容（JSON）' }),
  priority: t.Optional(t.Number({ default: 0, description: '优先级（数字越大越优先）' })),
  validFrom: t.Optional(t.Union([t.String(), t.Null()], { description: '生效时间（ISO 格式）' })),
  validUntil: t.Optional(t.Union([t.String(), t.Null()], { description: '失效时间（ISO 格式）' })),
});

// 更新热词请求
const UpdateGlobalKeywordRequest = t.Partial(
  t.Composite([
    CreateGlobalKeywordRequest,
    t.Object({
      isActive: t.Boolean({ description: '是否启用' }),
    }),
  ])
);

// ==========================================
// 查询参数 Schema
// ==========================================

// 热词列表查询参数（小程序使用）
const HotKeywordsQuery = t.Object({
  limit: t.Optional(t.Number({ minimum: 1, maximum: 10, default: 5, description: '返回数量' })),
  lat: t.Optional(t.Number({ description: '纬度（可选）' })),
  lng: t.Optional(t.Number({ description: '经度（可选）' })),
  timeRange: t.Optional(t.Union([
    t.Literal('morning'),
    t.Literal('afternoon'),
    t.Literal('evening'),
    t.Literal('night'),
  ], { description: '时间范围过滤' })),
});

// Admin 热词列表查询参数
const AdminHotKeywordsQuery = t.Object({
  isActive: t.Optional(t.Boolean({ description: '状态筛选' })),
  matchType: t.Optional(t.Union([
    t.Literal('exact'),
    t.Literal('prefix'),
    t.Literal('fuzzy'),
  ], { description: '匹配方式筛选' })),
  responseType: t.Optional(t.Union([
    t.Literal('widget_explore'),
    t.Literal('widget_draft'),
    t.Literal('widget_launcher'),
    t.Literal('widget_action'),
    t.Literal('widget_ask_preference'),
    t.Literal('text'),
  ], { description: '响应类型筛选' })),
});

// 热词分析查询参数
const KeywordAnalyticsQuery = t.Object({
  period: t.Optional(t.Union([
    t.Literal('7d'),
    t.Literal('30d'),
  ], { default: '7d', description: '时间周期' })),
});

// ==========================================
// 响应 Schema
// ==========================================

// 热词列表响应
const HotKeywordsResponse = t.Object({
  data: t.Array(HotKeywordListItem),
});

// Admin 热词列表响应
const AdminHotKeywordsResponse = t.Object({
  data: t.Array(GlobalKeywordResponse),
});

// 创建热词响应
const CreateKeywordResponse = t.Object({
  data: GlobalKeywordResponse,
});

// 更新热词响应
const UpdateKeywordResponse = t.Object({
  data: GlobalKeywordResponse,
});

// 删除热词响应
const DeleteKeywordResponse = t.Object({
  success: t.Boolean(),
});

// 热词分析项
const KeywordAnalyticsItem = t.Object({
  keyword: t.String(),
  hitCount: t.Number(),
  conversionCount: t.Number(),
  conversionRate: t.Number({ description: '转化率（百分比）' }),
  trend: t.Union([
    t.Literal('up'),
    t.Literal('down'),
    t.Literal('stable'),
  ], { description: '趋势' }),
});

// 热词分析响应
const KeywordAnalyticsResponse = t.Object({
  data: t.Array(KeywordAnalyticsItem),
});

// ==========================================
// 路径参数
// ==========================================

const IdParams = t.Object({
  id: t.String({ format: 'uuid', description: '热词ID' }),
});

// ==========================================
// 错误响应
// ==========================================

const ErrorResponse = t.Object({
  code: t.Number(),
  msg: t.String(),
});

// ==========================================
// 注册到 Elysia
// ==========================================

export const hotKeywordsModel = new Elysia({ name: 'hotKeywordsModel' })
  .model({
    // 响应 Schema
    'hotKeywords.keywordResponse': GlobalKeywordResponse,
    'hotKeywords.listItem': HotKeywordListItem,
    'hotKeywords.listResponse': HotKeywordsResponse,
    'hotKeywords.adminListResponse': AdminHotKeywordsResponse,
    'hotKeywords.createResponse': CreateKeywordResponse,
    'hotKeywords.updateResponse': UpdateKeywordResponse,
    'hotKeywords.deleteResponse': DeleteKeywordResponse,
    'hotKeywords.analyticsItem': KeywordAnalyticsItem,
    'hotKeywords.analyticsResponse': KeywordAnalyticsResponse,
    
    // 请求 Schema
    'hotKeywords.createRequest': CreateGlobalKeywordRequest,
    'hotKeywords.updateRequest': UpdateGlobalKeywordRequest,
    
    // 查询参数 Schema
    'hotKeywords.query': HotKeywordsQuery,
    'hotKeywords.adminQuery': AdminHotKeywordsQuery,
    'hotKeywords.analyticsQuery': KeywordAnalyticsQuery,
    
    // 路径参数
    'hotKeywords.idParams': IdParams,
    
    // 错误响应
    'hotKeywords.error': ErrorResponse,
  });

// ==========================================
// 导出 TS 类型
// ==========================================

export type GlobalKeywordResponse = Static<typeof GlobalKeywordResponse>;
export type HotKeywordListItem = Static<typeof HotKeywordListItem>;
export type CreateGlobalKeywordRequest = Static<typeof CreateGlobalKeywordRequest>;
export type UpdateGlobalKeywordRequest = Static<typeof UpdateGlobalKeywordRequest>;
export type HotKeywordsQuery = Static<typeof HotKeywordsQuery>;
export type AdminHotKeywordsQuery = Static<typeof AdminHotKeywordsQuery>;
export type KeywordAnalyticsQuery = Static<typeof KeywordAnalyticsQuery>;
export type HotKeywordsResponse = Static<typeof HotKeywordsResponse>;
export type AdminHotKeywordsResponse = Static<typeof AdminHotKeywordsResponse>;
export type CreateKeywordResponse = Static<typeof CreateKeywordResponse>;
export type UpdateKeywordResponse = Static<typeof UpdateKeywordResponse>;
export type DeleteKeywordResponse = Static<typeof DeleteKeywordResponse>;
export type KeywordAnalyticsItem = Static<typeof KeywordAnalyticsItem>;
export type KeywordAnalyticsResponse = Static<typeof KeywordAnalyticsResponse>;
export type IdParams = Static<typeof IdParams>;
export type ErrorResponse = Static<typeof ErrorResponse>;
