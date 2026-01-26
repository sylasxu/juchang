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

// IntentType 已移至 ../intent/types.ts，这里导入使用
import type { IntentType } from '../intent/types';

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
    
    // 新增的意图类型处理
    case 'modify':
      // 修改意图 - 类似 create，但更侧重修改现有草稿
      if (hasDraftContext) {
        tools.refineDraft = refineDraftTool(userId);
        tools.publishActivity = publishActivityTool(userId);
      }
      tools.getDraft = getDraftTool(userId);
      tools.createActivityDraft = createActivityDraftTool(userId);
      break;
    
    case 'confirm':
      // 确认意图 - 发布活动或确认匹配
      if (hasDraftContext) {
        tools.publishActivity = publishActivityTool(userId);
      }
      tools.confirmMatch = confirmMatchTool(userId);
      break;
    
    case 'deny':
    case 'cancel':
      // 拒绝/取消意图
      tools.cancelActivity = cancelActivityTool(userId);
      tools.cancelIntent = cancelIntentTool(userId);
      break;
    
    case 'share':
      // 分享意图 - 获取活动详情用于分享
      tools.getActivityDetail = getActivityDetailTool(userId);
      tools.getMyActivities = getMyActivitiesTool(userId);
      break;
    
    case 'join':
      // 报名意图
      tools.exploreNearby = exploreNearbyTool(userId);
      tools.getActivityDetail = getActivityDetailTool(userId);
      tools.joinActivity = joinActivityTool(userId);
      break;
    
    case 'show_activity':
      // 展示活动意图
      tools.getMyActivities = getMyActivitiesTool(userId);
      tools.getActivityDetail = getActivityDetailTool(userId);
      break;
      
    case 'idle':
    case 'chitchat':
      // 闲聊/空闲 - 不提供工具
      break;
      
    case 'unknown':
    default:
      // 未知意图 - 提供基础工具集
      tools.createActivityDraft = createActivityDraftTool(userId);
      tools.exploreNearby = exploreNearbyTool(userId);
      tools.askPreference = askPreferenceTool(userId);
      tools.createPartnerIntent = createPartnerIntentTool(userId, userLocation || null);
      break;
  }
  
  return tools;
}
