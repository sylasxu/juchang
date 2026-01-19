/**
 * Model Router - 模型路由器
 * 
 * 提供统一的模型访问接口，支持降级
 * 
 * 策略：
 * - 主力：DeepSeek（性价比高）
 * - 备选：智谱（Embedding）
 */

import type { LanguageModel } from 'ai';
import { deepseekProvider } from './adapters/deepseek';
import { zhipuProvider, getZhipuEmbeddings } from './adapters/zhipu';
import type { ModelProvider, ModelProviderName, FallbackConfig } from './types';
import { DEFAULT_FALLBACK_CONFIG, MODEL_IDS } from './types';

/**
 * 提供商映射
 */
const providers: Partial<Record<ModelProviderName, ModelProvider>> = {
  deepseek: deepseekProvider,
  zhipu: zhipuProvider,
};

/**
 * 当前降级配置
 */
let fallbackConfig: FallbackConfig = { ...DEFAULT_FALLBACK_CONFIG };

/**
 * 设置降级配置
 */
export function setFallbackConfig(config: Partial<FallbackConfig>): void {
  fallbackConfig = { ...fallbackConfig, ...config };
}

/**
 * 获取降级配置
 */
export function getFallbackConfig(): FallbackConfig {
  return { ...fallbackConfig };
}

/**
 * 获取 Chat 模型（带降级）
 * 
 * @param modelId - 模型 ID（可选）
 * @param preferredProvider - 首选提供商（可选）
 */
export function getChatModel(
  modelId?: string,
  preferredProvider?: ModelProviderName
): LanguageModel {
  const primary = preferredProvider || fallbackConfig.primary;
  
  try {
    const provider = providers[primary];
    if (!provider) {
      throw new Error(`Provider ${primary} not found`);
    }
    return provider.getChatModel(modelId);
  } catch (error) {
    if (!fallbackConfig.enableFallback) {
      throw error;
    }
    
    console.warn(`[ModelRouter] ${primary} failed, falling back to ${fallbackConfig.fallback}`, error);
    const fallbackProvider = providers[fallbackConfig.fallback];
    if (!fallbackProvider) {
      throw new Error(`Fallback provider ${fallbackConfig.fallback} not found`);
    }
    return fallbackProvider.getChatModel();
  }
}

/**
 * 获取 Embedding（使用智谱）
 * 
 * 注意：DeepSeek 暂不支持 Embedding，直接使用智谱 fetch API
 */
export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  return getZhipuEmbeddings(texts);
}

/**
 * 获取单个文本的 Embedding
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const embeddings = await getEmbeddings([text]);
  return embeddings[0];
}

/**
 * 获取默认 Chat 模型
 */
export function getDefaultChatModel(): LanguageModel {
  return getChatModel(MODEL_IDS.DEEPSEEK_CHAT);
}

/**
 * 执行带重试的操作
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options?: {
    maxRetries?: number;
    retryDelay?: number;
    onRetry?: (attempt: number, error: unknown) => void;
  }
): Promise<T> {
  const maxRetries = options?.maxRetries ?? fallbackConfig.maxRetries;
  const retryDelay = options?.retryDelay ?? fallbackConfig.retryDelay;
  
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        options?.onRetry?.(attempt + 1, error);
        // 指数退避 + 随机抖动
        const delay = retryDelay * Math.pow(2, attempt) * (0.5 + Math.random() * 0.5);
        await sleep(delay);
      }
    }
  }
  
  throw lastError;
}

/**
 * 执行带降级的操作
 */
export async function withFallback<T>(
  primaryOp: () => Promise<T>,
  fallbackOp: () => Promise<T>,
  options?: {
    onFallback?: (error: unknown) => void;
  }
): Promise<T> {
  if (!fallbackConfig.enableFallback) {
    return primaryOp();
  }
  
  try {
    return await primaryOp();
  } catch (error) {
    options?.onFallback?.(error);
    console.warn('[ModelRouter] Primary operation failed, using fallback', error);
    return fallbackOp();
  }
}

/**
 * 检查提供商健康状态
 */
export async function checkProviderHealth(
  providerName: ModelProviderName
): Promise<boolean> {
  const provider = providers[providerName];
  if (!provider) {
    return false;
  }
  return provider.healthCheck();
}

/**
 * 检查所有提供商健康状态
 */
export async function checkAllProvidersHealth(): Promise<Partial<Record<ModelProviderName, boolean>>> {
  const results = await Promise.all([
    checkProviderHealth('deepseek'),
    checkProviderHealth('zhipu'),
  ]);
  
  return {
    deepseek: results[0],
    zhipu: results[1],
  };
}

/**
 * 获取可用的提供商
 */
export async function getAvailableProviders(): Promise<ModelProviderName[]> {
  const health = await checkAllProvidersHealth();
  return (Object.entries(health) as [ModelProviderName, boolean][])
    .filter(([, healthy]) => healthy)
    .map(([name]) => name);
}

// ============ 便捷导出（向后兼容） ============

/**
 * 获取模型实例（向后兼容）
 */
export function getModel(modelId: string): LanguageModel {
  return getChatModel(modelId);
}

// ============ 内部工具函数 ============

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

