/**
 * AI Module - 模块化 AI 系统（精简版）
 * 
 * 架构清理后保留的模块：
 * - intent/ - 意图识别
 * - memory/ - 记忆系统（会话存储, WorkingMemory）
 * - processors/ - 处理管道（简化版，只有 processAIContext）
 * - tools/ - 工具系统
 * - prompts/ - 提示词
 * - models/ - 模型路由
 * - workflow/ - HITL 工作流（broker, draft-flow, match-flow）
 * - guardrails/ - 安全护栏
 * - observability/ - 可观测性
 * - evals/ - 评估系统
 * 
 * 已删除：
 * - agent/ - Vercel AI SDK 已足够
 * - orchestrator - 额外抽象层无价值
 * - rag/ - "按图索骥"不需要语义检索
 */

// Intent Module
export {
  classifyIntent as classifyIntentAsync,
  classifyByRegex,
  classifyDraftContext,
  classifyIntentSync,
  intentPatterns,
  intentPriority,
  draftModifyPatterns,
  getToolsForIntent as getToolsForIntentNew,
} from './intent';

export type {
  IntentType as IntentTypeNew,
  ClassifyResult,
  ClassifyContext,
} from './intent';

// Memory Module
export * from './memory';

// Processors Module
export * from './processors';

// Tools Module
export {
  TOOL_DISPLAY_NAMES,
  TOOL_WIDGET_TYPES,
  getToolDisplayName,
  getToolWidgetType,
  WidgetType,
  buildDraftWidget,
  buildExploreWidget,
  buildAskPreferenceWidget,
  buildShareWidget,
  buildErrorWidget,
  getToolNamesForIntent,
  getAllTools,
  getTool,
  // Tool factories
  createActivityDraftTool,
  getDraftTool,
  refineDraftTool,
  publishActivityTool,
  exploreNearbyTool,
  askPreferenceTool,
  joinActivityTool,
  cancelActivityTool,
  getMyActivitiesTool,
  getActivityDetailTool,
  createPartnerIntentTool,
  getMyIntentsTool,
  cancelIntentTool,
  confirmMatchTool,
  // Legacy exports
  getAIToolsV34,
  getToolsByIntent,
  classifyIntent,
  type IntentType,
} from './tools';

export type {
  ToolContext,
  ToolResult,
  WidgetChunk,
  ToolDefinition,
  WidgetTypeValue,
  WidgetDraftPayload,
  WidgetExplorePayload,
  WidgetAskPreferencePayload,
  WidgetSharePayload,
  WidgetErrorPayload,
} from './tools';

// Prompts Module
export * from './prompts';

// Models Module
export * from './models';

// Workflow Module
export * from './workflow';

// Guardrails Module
export * from './guardrails';

// Observability Module
export * from './observability';

// Evals Module
export * from './evals';

// Legacy exports from ai.service.ts (for backward compatibility)
export {
  streamChat,
  checkAIQuota,
  consumeAIQuota,
  getWelcomeCard,
  generateGreeting,
  listConversations,
  getConversationMessages,
  addMessageToConversation,
  getOrCreateCurrentConversation,
  getMessagesByActivityId,
  clearConversations,
  deleteConversation,
  deleteConversationsBatch,
  type ChatRequest,
  type WelcomeResponse,
  type WelcomeSection,
} from './ai.service';
