/**
 * Draft Context Enricher
 * 
 * 当前端传递 draftContext 时，注入当前草稿上下文到 System Prompt。
 * 这样 AI 就能知道当前正在编辑哪个活动。
 */

import type { EnrichmentResult } from '../types';
import type { ActivityDraftForPrompt } from '../../prompts/xiaoju-v39';

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
 * 注入草稿上下文
 * 
 * 只要前端传递了 draftContext，就始终注入到 System Prompt。
 * 这样 AI 就能知道当前正在编辑哪个活动，即使用户只是说"继续编辑"。
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
