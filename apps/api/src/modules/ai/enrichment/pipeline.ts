/**
 * Message Enrichment Pipeline
 * 
 * 编排所有增强器，按顺序处理用户消息，
 * 合并 XML 上下文并收集增强追踪信息。
 */

import type {
  EnrichmentContext,
  EnrichmentPipelineResult,
  EnrichmentTrace,
} from './types';
import type { UIMessage } from 'ai';

import { enrichWithDraftContext } from './enrichers/draft-context';
import { enrichWithTimeContext } from './enrichers/time-expression';
import { enrichWithLocationContext } from './enrichers/location-context';
import { resolvePronouns } from './enrichers/pronoun-resolver';
import { enrichWithUserPreference } from './enrichers/user-preference';

/**
 * 从 UIMessage 中提取文本内容
 * AI SDK v6 使用 parts 数组而非 content 字符串
 */
function extractTextContent(message: UIMessage): string {
  // AI SDK v6: 使用 parts 数组
  if (message.parts && Array.isArray(message.parts)) {
    return message.parts
      .filter((part): part is { type: 'text'; text: string } => 
        part.type === 'text' && typeof (part as { text?: string }).text === 'string'
      )
      .map(part => part.text)
      .join(' ');
  }
  
  return '';
}

/**
 * 消息增强 Pipeline
 * 
 * 按顺序执行所有增强器：
 * 1. Draft Context - 注入草稿上下文
 * 2. Time Expression - 解析时间表达
 * 3. Location Context - 注入位置上下文
 * 4. Pronoun Resolution - 解析指代词
 * 5. User Preference - 注入用户偏好
 * 
 * @param messages 原始消息列表
 * @param context 增强上下文
 * @returns 增强后的消息、XML 上下文、追踪信息
 */
export async function enrichMessages(
  messages: UIMessage[],
  context: EnrichmentContext
): Promise<EnrichmentPipelineResult> {
  const enrichmentTrace: EnrichmentTrace[] = [];
  const contextXmlParts: string[] = [];
  
  const enrichedMessages = await Promise.all(
    messages.map(async (msg) => {
      // 只处理用户消息
      if (msg.role !== 'user') {
        return msg;
      }
      
      const originalContent = extractTextContent(msg);
      let currentMessage = originalContent;
      const appliedEnrichments: string[] = [];
      
      // 1. Draft Context Enricher
      const draftResult = enrichWithDraftContext(
        currentMessage,
        context.draftContext
      );
      currentMessage = draftResult.enrichedMessage;
      appliedEnrichments.push(...draftResult.appliedEnrichments);
      if (draftResult.contextInjectionXml) {
        contextXmlParts.push(draftResult.contextInjectionXml);
      }
      
      // 2. Time Expression Enricher
      const timeResult = enrichWithTimeContext(
        currentMessage,
        context.currentTime
      );
      currentMessage = timeResult.enrichedMessage;
      appliedEnrichments.push(...timeResult.appliedEnrichments);
      if (timeResult.contextInjectionXml) {
        contextXmlParts.push(timeResult.contextInjectionXml);
      }
      
      // 3. Location Context Enricher
      const locationResult = enrichWithLocationContext(
        currentMessage,
        context.location
      );
      currentMessage = locationResult.enrichedMessage;
      appliedEnrichments.push(...locationResult.appliedEnrichments);
      if (locationResult.contextInjectionXml) {
        contextXmlParts.push(locationResult.contextInjectionXml);
      }
      
      // 4. Pronoun Resolution
      const pronounResult = resolvePronouns(
        currentMessage,
        context.conversationHistory
      );
      currentMessage = pronounResult.enrichedMessage;
      appliedEnrichments.push(...pronounResult.appliedEnrichments);
      
      // 5. User Preference Enricher (async)
      const preferenceResult = await enrichWithUserPreference(
        currentMessage,
        context.userId
      );
      currentMessage = preferenceResult.enrichedMessage;
      appliedEnrichments.push(...preferenceResult.appliedEnrichments);
      if (preferenceResult.contextInjectionXml) {
        contextXmlParts.push(preferenceResult.contextInjectionXml);
      }
      
      // 记录增强追踪
      if (appliedEnrichments.length > 0 || currentMessage !== originalContent) {
        enrichmentTrace.push({
          originalMessage: originalContent,
          enrichedMessage: currentMessage,
          appliedEnrichments,
        });
      }
      
      // 返回增强后的消息（更新 parts 中的 text）
      if (currentMessage !== originalContent && msg.parts) {
        const updatedParts = msg.parts.map(part => {
          if (part.type === 'text') {
            return { ...part, text: currentMessage };
          }
          return part;
        });
        return {
          ...msg,
          parts: updatedParts,
        };
      }
      
      return msg;
    })
  );
  
  // 合并所有 XML 上下文（去重）
  const uniqueXmlParts = [...new Set(contextXmlParts)];
  const contextXml = uniqueXmlParts.length > 0
    ? `<enrichment_hints>\n${uniqueXmlParts.join('\n')}\n</enrichment_hints>`
    : '';
  
  return {
    enrichedMessages,
    contextXml,
    enrichmentTrace,
  };
}

/**
 * 将 XML 上下文注入到 System Prompt
 * 
 * @param systemPrompt 原始 System Prompt
 * @param contextXml XML 上下文
 * @returns 注入后的 System Prompt
 */
export function injectContextToSystemPrompt(
  systemPrompt: string,
  contextXml: string
): string {
  if (!contextXml) {
    return systemPrompt;
  }
  
  // 在 # Context 部分后注入 XML
  const contextMarker = '# Context';
  const insertIndex = systemPrompt.indexOf(contextMarker);
  
  if (insertIndex === -1) {
    // 如果没有 Context 标记，追加到末尾
    return `${systemPrompt}\n\n${contextXml}`;
  }
  
  // 找到 Context 部分的结束位置（下一个 # 标记）
  const nextSectionIndex = systemPrompt.indexOf(
    '\n#',
    insertIndex + contextMarker.length
  );
  const insertPosition = nextSectionIndex === -1
    ? systemPrompt.length
    : nextSectionIndex;
  
  return (
    systemPrompt.slice(0, insertPosition) +
    '\n\n' + contextXml + '\n' +
    systemPrompt.slice(insertPosition)
  );
}
