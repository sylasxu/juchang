/**
 * Draft Context Enricher
 * 
 * 检测用户消息中的修改意图关键词（如"改"、"换"），
 * 注入当前草稿上下文到 System Prompt。
 */

import type { EnrichmentResult } from '../types';
import type { ActivityDraftForPrompt } from '../../prompts/xiaoju-v37';

/**
 * 修改意图关键词
 */
export const MODIFICATION_KEYWORDS = [
  '改',
  '换',
  '加',
  '减',
  '调',
  '变',
  '修改',
  '更改',
  '改成',
  '换成',
  '加上',
  '去掉',
  '删掉',
  '增加',
  '减少',
  '调整',
  '变成',
  '改为',
  '换个',
  '改个',
];

/**
 * 草稿上下文类型
 */
interface DraftContext {
  activityId: string;
  currentDraft: ActivityDraftForPrompt;
}

/**
 * XML 转义特殊字符
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * 检测修改意图，注入草稿上下文
 * 
 * @param message 用户消息
 * @param draftContext 草稿上下文（可选）
 * @returns 增强结果
 */
export function enrichWithDraftContext(
  message: string,
  draftContext?: DraftContext
): EnrichmentResult {
  // 如果没有草稿上下文，直接返回
  if (!draftContext) {
    return {
      originalMessage: message,
      enrichedMessage: message,
      appliedEnrichments: [],
    };
  }
  
  // 检测是否包含修改意图关键词
  const hasModificationIntent = MODIFICATION_KEYWORDS.some(keyword => 
    message.includes(keyword)
  );
  
  if (!hasModificationIntent) {
    return {
      originalMessage: message,
      enrichedMessage: message,
      appliedEnrichments: [],
    };
  }
  
  const draft = draftContext.currentDraft;
  
  // 生成 XML 格式的草稿上下文
  const contextXml = `<draft_context activity_id="${draftContext.activityId}">
  <title>${escapeXml(draft.title)}</title>
  <location>${escapeXml(draft.locationName || '')}</location>
  <location_hint>${escapeXml(draft.locationHint || '')}</location_hint>
  <time>${draft.startAt}</time>
  <participants>${draft.maxParticipants}</participants>
  <type>${draft.type}</type>
</draft_context>`;
  
  return {
    originalMessage: message,
    enrichedMessage: message, // 草稿上下文不修改原消息，只注入上下文
    appliedEnrichments: ['draft_context'],
    contextInjectionXml: contextXml,
  };
}
