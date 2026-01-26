/**
 * Intent Router - 意图路由器
 * 
 * 将意图映射到对应的工具集
 */

import type { IntentType } from './types';

/**
 * 意图到工具的映射
 */
const intentToolMap: Record<IntentType, string[]> = {
  create: ['createActivityDraft', 'refineDraft', 'publishActivity'],
  explore: ['exploreNearby', 'getActivityDetail', 'joinActivity'],
  manage: ['getMyActivities', 'cancelActivity'],
  partner: ['createPartnerIntent', 'getMyIntents', 'confirmMatch', 'cancelIntent'],
  chitchat: [], // 模板响应，不调用 Tool
  idle: ['askPreference'],
  modify: ['refineDraft', 'publishActivity'], // 修改草稿
  confirm: ['publishActivity', 'confirmMatch'], // 确认操作
  deny: [], // 拒绝操作，通常不需要工具
  cancel: ['cancelActivity', 'cancelIntent'], // 取消操作
  share: ['getActivityDetail', 'getMyActivities'], // 分享活动
  join: ['exploreNearby', 'getActivityDetail', 'joinActivity'], // 报名活动
  show_activity: ['getMyActivities', 'getActivityDetail'], // 展示活动
  unknown: ['askPreference', 'exploreNearby'], // 兜底工具
};

/**
 * 获取意图对应的工具列表（纯函数）
 * 
 * @param intent - 意图类型
 * @returns 工具名称列表
 */
export function getToolsForIntent(intent: IntentType): string[] {
  return intentToolMap[intent] ?? [];
}

/**
 * 检查意图是否需要调用 Tool
 */
export function intentRequiresTool(intent: IntentType): boolean {
  return intentToolMap[intent]?.length > 0;
}

/**
 * 检查意图是否为闲聊（不需要 LLM）
 */
export function isChitchatIntent(intent: IntentType): boolean {
  return intent === 'chitchat';
}

/**
 * 获取所有可用工具名称
 */
export function getAllToolNames(): string[] {
  const allTools = new Set<string>();
  for (const tools of Object.values(intentToolMap)) {
    for (const tool of tools) {
      allTools.add(tool);
    }
  }
  return Array.from(allTools);
}

/**
 * 根据用户状态动态调整工具列表
 * 
 * @param intent - 意图类型
 * @param options - 选项
 * @returns 调整后的工具列表
 */
export function getToolsWithContext(
  intent: IntentType,
  options: {
    hasDraftContext?: boolean;
    hasLocation?: boolean;
    isLoggedIn?: boolean;
  } = {}
): string[] {
  const baseTools = getToolsForIntent(intent);
  const tools = [...baseTools];

  // 有草稿上下文时，添加草稿相关工具
  if (options.hasDraftContext && intent === 'create') {
    if (!tools.includes('refineDraft')) {
      tools.push('refineDraft');
    }
    if (!tools.includes('publishActivity')) {
      tools.push('publishActivity');
    }
  }

  // 无位置时，添加询问偏好工具
  if (!options.hasLocation && intent === 'explore') {
    if (!tools.includes('askPreference')) {
      tools.unshift('askPreference');
    }
  }

  // 未登录时，移除需要登录的工具
  if (!options.isLoggedIn) {
    const loginRequiredTools = [
      'createActivityDraft',
      'publishActivity',
      'joinActivity',
      'cancelActivity',
      'getMyActivities',
      'createPartnerIntent',
      'confirmMatch',
      'cancelIntent',
      'getMyIntents',
    ];
    return tools.filter(t => !loginRequiredTools.includes(t));
  }

  return tools;
}
