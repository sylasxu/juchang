/**
 * Message Enrichment Types
 * 
 * 消息增强模块的类型定义
 */

import type { UIMessage } from 'ai';
import type { ActivityDraftForPrompt } from '../prompts/xiaoju-v35';

/**
 * 增强上下文
 */
export interface EnrichmentContext {
  /** 用户 ID，null 表示未登录 */
  userId: string | null;
  /** 用户位置 */
  location?: {
    lat: number;
    lng: number;
    name?: string;
  };
  /** 草稿上下文（多轮对话时） */
  draftContext?: {
    activityId: string;
    currentDraft: ActivityDraftForPrompt;
  };
  /** 对话历史（用于指代消解） */
  conversationHistory: Array<{
    role: string;
    content: string;
    activityTitle?: string;
    locationName?: string;
  }>;
  /** 当前时间 */
  currentTime: Date;
}

/**
 * 单个增强器的结果
 */
export interface EnrichmentResult {
  /** 原始消息 */
  originalMessage: string;
  /** 增强后的消息（可能被修改，如指代消解） */
  enrichedMessage: string;
  /** 应用的增强类型列表 */
  appliedEnrichments: string[];
  /** XML 格式的上下文注入块（注入到 System Prompt） */
  contextInjectionXml?: string;
}

/**
 * 增强追踪记录（用于调试）
 */
export interface EnrichmentTrace {
  /** 原始消息 */
  originalMessage: string;
  /** 增强后的消息 */
  enrichedMessage: string;
  /** 应用的增强类型列表 */
  appliedEnrichments: string[];
}

/**
 * Pipeline 执行结果
 */
export interface EnrichmentPipelineResult {
  /** 增强后的消息列表（保持 UIMessage 格式） */
  enrichedMessages: UIMessage[];
  /** 合并后的 XML 上下文（注入到 System Prompt） */
  contextXml: string;
  /** 增强追踪记录（用于 trace 模式） */
  enrichmentTrace: EnrichmentTrace[];
}

/**
 * 增强器接口
 */
export interface MessageEnricher {
  /** 增强器名称 */
  name: string;
  /** 执行增强 */
  enrich(message: string, context: EnrichmentContext): EnrichmentResult | Promise<EnrichmentResult>;
}
