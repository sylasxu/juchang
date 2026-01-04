/**
 * Pronoun Resolver
 * 
 * 解析用户消息中的指代词（如"那个"、"这个"），
 * 从对话历史中找到最近的活动或位置进行替换。
 */

import type { EnrichmentResult } from '../types';

/**
 * 指代词列表
 */
export const PRONOUNS = [
  '那个',
  '这个',
  '它',
  '那边',
  '那里',
  '那儿',
  '这边',
  '这里',
  '这儿',
  '上次那个',
  '刚才那个',
];

/**
 * 活动相关上下文关键词
 */
const ACTIVITY_CONTEXT_KEYWORDS = [
  '活动',
  '局',
  '报名',
  '参加',
  '加入',
  '取消',
  '改',
  '换',
];

/**
 * 位置相关上下文关键词
 */
const LOCATION_CONTEXT_KEYWORDS = [
  '去',
  '到',
  '在',
  '地方',
  '位置',
  '那边',
  '那里',
];

/**
 * 对话历史条目
 */
interface ConversationEntry {
  role: string;
  content: string;
  activityTitle?: string;
  locationName?: string;
}

/**
 * 从对话历史中查找最近提到的活动
 */
export function findRecentActivity(
  conversationHistory: ConversationEntry[]
): string | null {
  // 从最近的消息开始查找
  for (let i = conversationHistory.length - 1; i >= 0; i--) {
    const entry = conversationHistory[i];
    
    // 优先使用明确的活动标题
    if (entry.activityTitle) {
      return entry.activityTitle;
    }
    
    // 尝试从内容中提取活动名称（简单匹配）
    const activityMatch = entry.content.match(/[「「](.+?)[」」]/);
    if (activityMatch) {
      return activityMatch[1];
    }
  }
  
  return null;
}

/**
 * 从对话历史中查找最近提到的位置
 */
export function findRecentLocation(
  conversationHistory: ConversationEntry[]
): string | null {
  // 从最近的消息开始查找
  for (let i = conversationHistory.length - 1; i >= 0; i--) {
    const entry = conversationHistory[i];
    
    // 优先使用明确的位置名称
    if (entry.locationName) {
      return entry.locationName;
    }
  }
  
  return null;
}

/**
 * 判断消息是否在活动上下文中
 */
function isActivityContext(message: string): boolean {
  return ACTIVITY_CONTEXT_KEYWORDS.some(keyword => message.includes(keyword));
}

/**
 * 判断消息是否在位置上下文中
 */
function isLocationContext(message: string): boolean {
  return LOCATION_CONTEXT_KEYWORDS.some(keyword => message.includes(keyword));
}

/**
 * 解析指代词，替换为具体实体
 * 
 * @param message 用户消息
 * @param conversationHistory 对话历史
 * @returns 增强结果
 */
export function resolvePronouns(
  message: string,
  conversationHistory: ConversationEntry[]
): EnrichmentResult {
  let enrichedMessage = message;
  const appliedEnrichments: string[] = [];
  
  // 查找最近的活动和位置
  const recentActivity = findRecentActivity(conversationHistory);
  const recentLocation = findRecentLocation(conversationHistory);
  
  // 检查消息中是否包含指代词
  for (const pronoun of PRONOUNS) {
    if (!message.includes(pronoun)) {
      continue;
    }
    
    // 根据上下文决定替换为活动还是位置
    if (recentActivity && isActivityContext(message)) {
      enrichedMessage = enrichedMessage.replace(
        pronoun,
        `「${recentActivity}」`
      );
      appliedEnrichments.push('pronoun_activity');
    } else if (recentLocation && isLocationContext(message)) {
      enrichedMessage = enrichedMessage.replace(pronoun, recentLocation);
      appliedEnrichments.push('pronoun_location');
    }
    // 如果无法解析，保留原始指代词（不做替换）
  }
  
  return {
    originalMessage: message,
    enrichedMessage,
    appliedEnrichments,
  };
}
