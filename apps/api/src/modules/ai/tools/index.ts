/**
 * AI Tools Index
 * 
 * 统一导出所有 AI 工具函数
 * 
 * v4.5: 整合优化
 * - activity-tools.ts: 活动创建、修改、发布
 * - query-tools.ts: 活动查询、报名、取消
 * - partner-tools.ts: 找搭子相关
 * - explore-nearby.ts: RAG 语义搜索
 * - create-tool.ts: Tool 工厂函数
 */

// ============ Tool Factory ============
export { createTool, createToolFactory } from './create-tool';
export type { ToolConfig } from './create-tool';

// ============ Types ============
export type { ToolContext, ToolResult, WidgetChunk, ToolDefinition } from './types';
export { TOOL_DISPLAY_NAMES, TOOL_WIDGET_TYPES, getToolDisplayName, getToolWidgetType } from './types';

// ============ Widgets ============
export {
  WidgetType,
  buildDraftWidget,
  buildExploreWidget,
  buildAskPreferenceWidget,
  buildShareWidget,
  buildErrorWidget,
} from './widgets';

export type {
  WidgetTypeValue,
  WidgetDraftPayload,
  WidgetExplorePayload,
  WidgetAskPreferencePayload,
  WidgetSharePayload,
  WidgetErrorPayload,
} from './widgets';

// ============ Registry ============
export { getToolNamesForIntent, getToolsForIntent, getAllTools, getTool } from './registry';

// ============ Activity Tools ============
export {
  createActivityDraftTool,
  getDraftTool,
  refineDraftTool,
  publishActivityTool,
} from './activity-tools';

export type {
  CreateDraftParams,
  GetDraftParams,
  RefineDraftParams,
  PublishActivityParams,
} from './activity-tools';

// ============ Query Tools ============
export {
  joinActivityTool,
  cancelActivityTool,
  getMyActivitiesTool,
  getActivityDetailTool,
  askPreferenceTool,
} from './query-tools';

export type {
  JoinActivityParams,
  CancelActivityParams,
  GetMyActivitiesParams,
  GetActivityDetailParams,
} from './query-tools';

// ============ Explore Tool ============
export { exploreNearbyTool } from './explore-nearby';
export type { ExploreData, ExploreResultItem } from './explore-nearby';

// ============ Partner Tools ============
export {
  createPartnerIntentTool,
  getMyIntentsTool,
  cancelIntentTool,
  confirmMatchTool,
} from './partner-tools';

export type {
  CreatePartnerIntentParams,
  CancelIntentParams,
  ConfirmMatchParams,
} from './partner-tools';

// ============ Intent Classification ============
import {
  createActivityDraftTool,
  getDraftTool,
  refineDraftTool,
  publishActivityTool,
} from './activity-tools';

import {
  joinActivityTool,
  cancelActivityTool,
  getMyActivitiesTool,
  getActivityDetailTool,
  askPreferenceTool,
} from './query-tools';

import { exploreNearbyTool } from './explore-nearby';

import {
  createPartnerIntentTool,
  getMyIntentsTool,
  cancelIntentTool,
  confirmMatchTool,
} from './partner-tools';

/** 意图类型 */
export type IntentType = 'create' | 'explore' | 'manage' | 'partner' | 'idle' | 'chitchat' | 'unknown';

/**
 * 简单规则预分类意图（不需要 LLM）
 */
export function classifyIntent(message: string, hasDraftContext: boolean, previousIntent?: IntentType): IntentType {
  const text = message.toLowerCase();
  
  // 管理意图（优先级最高）
  if (/我的活动|我发布的|我参与的|取消活动|不办了/.test(text)) return 'manage';
  
  // 找搭子意图
  if (/找搭子|谁组我就去|懒得组局|等人约|我的意向|取消意向|确认匹配|确认发布/.test(text)) return 'partner';
  
  // 修改意图（需要草稿上下文）
  if (hasDraftContext && /改|换|加|减|调|发布/.test(text)) return 'create';
  
  // 明确创建意图
  if (/帮我组|帮我创建|自己组|我来组|我要组|我想组/.test(text)) return 'create';
  
  // 探索意图
  if (/想找|找人|一起|有什么|附近|推荐|看看|想.*打|想.*吃|想.*玩/.test(text)) return 'explore';
  if (/想|约/.test(text)) return 'explore';
  
  // 继承上一轮意图
  if (previousIntent && previousIntent !== 'unknown') return previousIntent;
  
  return 'unknown';
}

/**
 * 获取所有 AI Tools（完整版）
 */
export function getAIToolsV34(userId: string | null) {
  return {
    createActivityDraft: createActivityDraftTool(userId),
    getDraft: getDraftTool(userId),
    refineDraft: refineDraftTool(userId),
    publishActivity: publishActivityTool(userId),
    exploreNearby: exploreNearbyTool(userId),
    getActivityDetail: getActivityDetailTool(userId),
    joinActivity: joinActivityTool(userId),
    cancelActivity: cancelActivityTool(userId),
    getMyActivities: getMyActivitiesTool(userId),
    askPreference: askPreferenceTool(userId),
  };
}

/**
 * 根据意图动态获取 Tools（精简版）
 */
export function getToolsByIntent(
  userId: string | null,
  intent: IntentType,
  hasDraftContext: boolean,
  userLocation?: { lat: number; lng: number } | null
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tools: Record<string, any> = {};
  
  switch (intent) {
    case 'create':
      tools.createActivityDraft = createActivityDraftTool(userId);
      if (hasDraftContext) {
        tools.refineDraft = refineDraftTool(userId);
        tools.publishActivity = publishActivityTool(userId);
      }
      tools.getDraft = getDraftTool(userId);
      break;
      
    case 'explore':
      tools.exploreNearby = exploreNearbyTool(userId);
      tools.getActivityDetail = getActivityDetailTool(userId);
      tools.joinActivity = joinActivityTool(userId);
      tools.askPreference = askPreferenceTool(userId);
      tools.createPartnerIntent = createPartnerIntentTool(userId, userLocation || null);
      break;
      
    case 'manage':
      tools.getMyActivities = getMyActivitiesTool(userId);
      tools.cancelActivity = cancelActivityTool(userId);
      tools.getActivityDetail = getActivityDetailTool(userId);
      break;
      
    case 'partner':
      tools.createPartnerIntent = createPartnerIntentTool(userId, userLocation || null);
      tools.getMyIntents = getMyIntentsTool(userId);
      tools.cancelIntent = cancelIntentTool(userId);
      tools.confirmMatch = confirmMatchTool(userId);
      tools.askPreference = askPreferenceTool(userId);
      break;
      
    case 'idle':
    case 'chitchat':
      break;
      
    default:
      tools.createActivityDraft = createActivityDraftTool(userId);
      tools.exploreNearby = exploreNearbyTool(userId);
      tools.askPreference = askPreferenceTool(userId);
      tools.createPartnerIntent = createPartnerIntentTool(userId, userLocation || null);
      break;
  }
  
  return tools;
}
