/**
 * Models Module Types - 模型抽象层类型定义
 * 
 * 只支持 DeepSeek（主力）+ 智谱（备选）
 */

import type { LanguageModel } from 'ai';

/**
 * 模型提供商名称
 */
export type ModelProviderName = 'deepseek' | 'zhipu';

/**
 * 模型类型
 */
export type ModelType = 'chat' | 'embedding' | 'rerank';

/**
 * 模型配置
 */
export interface ModelConfig {
  /** 提供商 */
  provider: ModelProviderName;
  /** 模型 ID */
  modelId: string;
  /** 模型类型 */
  type: ModelType;
  /** 是否启用 */
  enabled: boolean;
  /** 优先级（数字越小优先级越高） */
  priority: number;
}

/**
 * Chat 请求参数
 */
export interface ChatParams {
  /** 模型 ID（可选，默认使用主力模型） */
  modelId?: string;
  /** 系统提示词 */
  system?: string;
  /** 消息列表 */
  messages: ChatMessage[];
  /** 温度 */
  temperature?: number;
  /** 最大 Token 数 */
  maxTokens?: number;
  /** 工具列表 */
  tools?: Record<string, unknown>;
  /** 是否流式 */
  stream?: boolean;
}

/**
 * Chat 消息
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCallId?: string;
  toolCalls?: ToolCallPart[];
}

/**
 * Tool 调用部分
 */
export interface ToolCallPart {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

/**
 * Chat 响应
 */
export interface ChatResponse {
  /** 响应文本 */
  text: string;
  /** Tool 调用 */
  toolCalls?: ToolCallPart[];
  /** Token 用量 */
  usage: TokenUsage;
  /** 完成原因 */
  finishReason: 'stop' | 'tool-calls' | 'length' | 'content-filter' | 'error';
}

/**
 * Token 用量
 */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  /** DeepSeek 缓存 Token */
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
}

/**
 * Embedding 请求参数
 */
export interface EmbedParams {
  /** 模型 ID（可选） */
  modelId?: string;
  /** 文本列表 */
  texts: string[];
}

/**
 * Embedding 响应
 */
export interface EmbedResponse {
  /** 向量列表 */
  embeddings: number[][];
  /** Token 用量 */
  usage: TokenUsage;
}

/**
 * Rerank 请求参数
 */
export interface RerankParams {
  /** 模型 ID（可选） */
  modelId?: string;
  /** 查询文本 */
  query: string;
  /** 文档列表 */
  documents: string[];
  /** 返回数量 */
  topK?: number;
}

/**
 * Rerank 响应
 */
export interface RerankResponse {
  /** 重排序结果 */
  results: RerankResult[];
  /** Token 用量 */
  usage: TokenUsage;
}

/**
 * Rerank 结果项
 */
export interface RerankResult {
  /** 文档索引 */
  index: number;
  /** 相关性分数 */
  score: number;
  /** 文档内容 */
  document: string;
}

/**
 * 模型提供商接口
 */
export interface ModelProvider {
  /** 提供商名称 */
  name: ModelProviderName;
  /** 获取 Chat 模型 */
  getChatModel: (modelId?: string) => LanguageModel;
  /** 获取 Embedding（部分提供商支持） */
  embed?: (params: EmbedParams) => Promise<EmbedResponse>;
  /** 执行 Rerank（部分提供商支持） */
  rerank?: (params: RerankParams) => Promise<RerankResponse>;
  /** 检查健康状态 */
  healthCheck: () => Promise<boolean>;
}

/**
 * 降级配置
 */
export interface FallbackConfig {
  /** 主力提供商 */
  primary: ModelProviderName;
  /** 备选提供商 */
  fallback: ModelProviderName;
  /** 重试次数 */
  maxRetries: number;
  /** 重试延迟（毫秒） */
  retryDelay: number;
  /** 是否启用降级 */
  enableFallback: boolean;
}

/**
 * 默认降级配置
 */
export const DEFAULT_FALLBACK_CONFIG: FallbackConfig = {
  primary: 'deepseek',
  fallback: 'zhipu',
  maxRetries: 2,
  retryDelay: 1000,
  enableFallback: true,
};

/**
 * 模型 ID 常量
 */
export const MODEL_IDS = {
  // DeepSeek
  DEEPSEEK_CHAT: 'deepseek-chat',
  DEEPSEEK_REASONER: 'deepseek-reasoner',
  
  // 智谱
  ZHIPU_GLM4: 'glm-4-flash',
  ZHIPU_GLM4_PLUS: 'glm-4-plus',
  ZHIPU_EMBEDDING: 'embedding-3',
} as const;

