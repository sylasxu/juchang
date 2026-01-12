/**
 * Agent Module - Mastra 风格的 Agent 封装层
 * 
 * v4.5 活动语义搜索功能
 * 
 * 提供：
 * - streamChat() / generateChat() - 对话入口
 * - getAgent() - 获取 Agent 实例
 * - Processors - 输入/输出处理器
 */

// 对话入口
export { 
  streamChat, 
  generateChat, 
  toDataStreamResponse,
  type StreamChatResult,
  type GenerateChatResult,
} from './chat';

// Agent 工厂和实例
export { 
  createAgent, 
  getAgent, 
  getAgentNames,
  agents,
  type AgentName,
} from './agents';

// 意图路由
export { 
  classifyIntent, 
  classifyIntentFast,
  getIntentForAgent,
  type RouteResult,
} from './router';

// 上下文构建
export { 
  buildContext, 
  buildSimpleContext,
  type BuildContextParams,
  type BuildContextResult,
} from './context';

// Processors
export {
  // Input Processors
  inputGuardProcessor,
  userProfileProcessor,
  tokenLimitProcessor,
  // Output Processors
  outputGuardProcessor,
  saveHistoryProcessor,
  extractPreferencesProcessor,
  // Default Chains
  defaultInputProcessors,
  defaultOutputProcessors,
  // Utilities
  runInputProcessors,
  runOutputProcessors,
  // Legacy compatibility
  processAIContext,
} from './processors';

// 类型
export type {
  Message,
  AIMessage,
  SystemMessage,
  AgentConfig,
  RuntimeContext,
  ChatParams,
  AgentGenerateOptions,
  AgentStreamOptions,
  StepResult,
  ToolCall,
  ToolResult,
  Processor,
  Agent,
  IntentType,
  ToolsInput,
} from './types';

export { INTENT_TO_AGENT } from './types';
