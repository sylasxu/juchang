/**
 * Tool Registry - 工具注册表
 * 
 * 管理所有 AI Tools 的注册和获取
 * 支持按意图动态加载 Tools
 */

import type { IntentType } from '../intent/types';
import type { ToolContext } from './types';

// 导入所有 Tool 工厂函数
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

/**
 * 意图到 Tool 的映射配置
 */
const INTENT_TOOL_MAP: Record<IntentType, string[]> = {
  create: ['createActivityDraft', 'getDraft', 'refineDraft', 'publishActivity'],
  explore: ['exploreNearby', 'getActivityDetail', 'joinActivity', 'askPreference', 'createPartnerIntent'],
  manage: ['getMyActivities', 'cancelActivity', 'getActivityDetail'],
  partner: ['createPartnerIntent', 'getMyIntents', 'cancelIntent', 'confirmMatch', 'askPreference'],
  idle: [], // 空闲意图不需要 Tool
  chitchat: [], // 闲聊意图不需要 Tool
  unknown: ['createActivityDraft', 'exploreNearby', 'askPreference', 'createPartnerIntent'],
};

/**
 * Tool 工厂函数映射
 */
type ToolFactory = (userId: string | null, location?: { lat: number; lng: number } | null) => unknown;

const TOOL_FACTORIES: Record<string, ToolFactory> = {
  createActivityDraft: (userId) => createActivityDraftTool(userId),
  getDraft: (userId) => getDraftTool(userId),
  refineDraft: (userId) => refineDraftTool(userId),
  publishActivity: (userId) => publishActivityTool(userId),
  exploreNearby: (userId) => exploreNearbyTool(userId),
  getActivityDetail: (userId) => getActivityDetailTool(userId),
  joinActivity: (userId) => joinActivityTool(userId),
  cancelActivity: (userId) => cancelActivityTool(userId),
  getMyActivities: (userId) => getMyActivitiesTool(userId),
  askPreference: (userId) => askPreferenceTool(userId),
  createPartnerIntent: (userId, location) => createPartnerIntentTool(userId, location || null),
  getMyIntents: (userId) => getMyIntentsTool(userId),
  cancelIntent: (userId) => cancelIntentTool(userId),
  confirmMatch: (userId) => confirmMatchTool(userId),
};

/**
 * 获取意图对应的 Tool 名称列表
 */
export function getToolNamesForIntent(intent: IntentType): string[] {
  return INTENT_TOOL_MAP[intent] || INTENT_TOOL_MAP.unknown;
}

/**
 * 根据意图获取 Tools（动态加载，减少 Token）
 * 
 * @param context - Tool 上下文
 * @param intent - 意图类型
 * @param hasDraftContext - 是否有草稿上下文
 */
export function getToolsForIntent(
  context: ToolContext,
  intent: IntentType,
  hasDraftContext: boolean
): Record<string, unknown> {
  const { userId, location } = context;
  const tools: Record<string, unknown> = {};

  // 根据意图获取 Tool 名称列表
  let toolNames = getToolNamesForIntent(intent);

  // 创建意图：根据草稿上下文调整
  if (intent === 'create') {
    if (hasDraftContext) {
      toolNames = ['refineDraft', 'publishActivity', 'getDraft'];
    } else {
      toolNames = ['createActivityDraft', 'getDraft'];
    }
  }

  // 实例化 Tools
  for (const name of toolNames) {
    const factory = TOOL_FACTORIES[name];
    if (factory) {
      tools[name] = factory(userId, location);
    }
  }

  return tools;
}

/**
 * 获取所有 Tools（完整版，兼容旧代码）
 */
export function getAllTools(context: ToolContext): Record<string, unknown> {
  const { userId, location } = context;
  const tools: Record<string, unknown> = {};

  for (const [name, factory] of Object.entries(TOOL_FACTORIES)) {
    tools[name] = factory(userId, location);
  }

  return tools;
}

/**
 * 获取单个 Tool
 */
export function getTool(
  name: string,
  context: ToolContext
): unknown | undefined {
  const factory = TOOL_FACTORIES[name];
  if (!factory) return undefined;
  return factory(context.userId, context.location);
}
