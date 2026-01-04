/**
 * Location Context Enricher
 * 
 * 检测用户消息中的位置相关词汇（如"附近"、"这边"），
 * 注入用户当前位置信息到 System Prompt。
 */

import type { EnrichmentResult } from '../types';

/**
 * 位置相关关键词
 */
export const LOCATION_KEYWORDS = [
  '附近',
  '这边',
  '我这里',
  '这附近',
  '周围',
  '旁边',
  '这一带',
  '我这',
  '身边',
];

/**
 * 检测消息中的位置关键词，注入用户位置上下文
 * 
 * @param message 用户消息
 * @param location 用户位置（可选）
 * @returns 增强结果
 */
export function enrichWithLocationContext(
  message: string,
  location?: { lat: number; lng: number; name?: string }
): EnrichmentResult {
  // 如果没有位置信息，直接返回
  if (!location) {
    return {
      originalMessage: message,
      enrichedMessage: message,
      appliedEnrichments: [],
    };
  }
  
  // 检测是否包含位置关键词
  const hasLocationKeyword = LOCATION_KEYWORDS.some(keyword => 
    message.includes(keyword)
  );
  
  if (!hasLocationKeyword) {
    return {
      originalMessage: message,
      enrichedMessage: message,
      appliedEnrichments: [],
    };
  }
  
  // 生成 XML 格式的位置上下文
  const locationName = location.name || '当前位置';
  const contextXml = `<user_location lat="${location.lat.toFixed(4)}" lng="${location.lng.toFixed(4)}">
  ${locationName}
</user_location>`;
  
  return {
    originalMessage: message,
    enrichedMessage: message, // 位置上下文不修改原消息，只注入上下文
    appliedEnrichments: ['location_context'],
    contextInjectionXml: contextXml,
  };
}
