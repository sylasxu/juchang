/**
 * Message Enrichment Module
 * 
 * 消息预处理增强服务，在用户消息发送给 AI Agent 之前，
 * 自动注入上下文信息，提高意图识别准确率。
 * 
 * 核心原则：
 * 1. 透明增强 - 增强后的消息只用于 AI 处理，不修改存储的原始消息
 * 2. 可组合 - 多个增强器可以链式组合
 * 3. 可追踪 - trace 模式下可以看到每个增强步骤
 */

// Types
export type {
  EnrichmentContext,
  EnrichmentResult,
  EnrichmentTrace,
  EnrichmentPipelineResult,
  MessageEnricher,
} from './types';

// Pipeline
export { enrichMessages, injectContextToSystemPrompt } from './pipeline';

// Enrichers
export { enrichWithTimeContext } from './enrichers/time-expression';
export { enrichWithLocationContext } from './enrichers/location-context';
export { enrichWithDraftContext } from './enrichers/draft-context';
export { resolvePronouns } from './enrichers/pronoun-resolver';
export { enrichWithUserPreference } from './enrichers/user-preference';
