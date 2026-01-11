/**
 * Zhipu Adapter - 智谱模型适配器（备选）
 * 
 * 注意：当前项目未安装 @ai-sdk/openai-compatible
 * 智谱作为备选方案，暂时使用 fetch 直接调用 API
 * 
 * 支持：
 * - Chat: glm-4-flash, glm-4-plus
 * - Embedding: embedding-3（通过 fetch）
 */

import type { LanguageModel } from 'ai';
import type { ModelProvider, EmbedResponse, EmbedParams } from '../types';
import { MODEL_IDS } from '../types';

/**
 * 智谱 API 基础 URL
 */
const ZHIPU_BASE_URL = 'https://open.bigmodel.cn/api/paas/v4';

/**
 * 获取智谱 API Key
 */
function getApiKey(): string {
  const apiKey = process.env.ZHIPU_API_KEY;
  if (!apiKey) {
    throw new Error('ZHIPU_API_KEY is not set');
  }
  return apiKey;
}

/**
 * 智谱 Chat 模型（通过 fetch 实现）
 * 
 * 注意：这是一个简化实现，不完全兼容 AI SDK 的 LanguageModel 接口
 * 主要用于降级场景
 */
function getChatModel(modelId?: string): LanguageModel {
  // 由于没有 @ai-sdk/openai-compatible，暂时抛出错误
  // 实际使用时应该安装依赖或使用其他方式
  throw new Error(
    'Zhipu chat model requires @ai-sdk/openai-compatible package. ' +
    'Please install it or use DeepSeek as primary provider.'
  );
}

/**
 * 智谱 Embedding（通过 fetch 实现）
 */
async function embed(params: EmbedParams): Promise<EmbedResponse> {
  const apiKey = getApiKey();
  const modelId = params.modelId || MODEL_IDS.ZHIPU_EMBEDDING;
  
  const response = await fetch(`${ZHIPU_BASE_URL}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelId,
      input: params.texts,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Zhipu embedding failed: ${error}`);
  }
  
  const data = await response.json() as {
    data: Array<{ embedding: number[]; index: number }>;
    usage: { prompt_tokens: number; total_tokens: number };
  };
  
  // 按 index 排序确保顺序正确
  const sortedData = [...data.data].sort((a, b) => a.index - b.index);
  
  return {
    embeddings: sortedData.map(d => d.embedding),
    usage: {
      inputTokens: data.usage.prompt_tokens,
      outputTokens: 0,
      totalTokens: data.usage.total_tokens,
    },
  };
}

/**
 * 健康检查
 */
async function healthCheck(): Promise<boolean> {
  try {
    const apiKey = process.env.ZHIPU_API_KEY;
    return !!apiKey && apiKey.length > 0;
  } catch {
    return false;
  }
}

/**
 * 智谱模型提供商
 */
export const zhipuProvider: ModelProvider = {
  name: 'zhipu',
  getChatModel,
  embed,
  healthCheck,
};

/**
 * 获取智谱 Embedding（便捷函数）
 * 
 * 直接返回向量，不使用 AI SDK 的 EmbeddingModel
 */
export async function getZhipuEmbeddings(texts: string[]): Promise<number[][]> {
  const result = await embed({ texts });
  return result.embeddings;
}

/**
 * 获取单个文本的 Embedding
 */
export async function getZhipuEmbedding(text: string): Promise<number[]> {
  const result = await embed({ texts: [text] });
  return result.embeddings[0];
}

