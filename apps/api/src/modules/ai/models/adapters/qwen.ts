/**
 * Qwen Adapter - 阿里通义千问模型适配器
 * 
 * 使用阿里云百炼平台的 OpenAI 兼容接口
 * 
 * 支持：
 * - Embedding: text-embedding-v4 (Qwen3-Embedding 系列)
 * 
 * 配置：
 * - 环境变量: DASHSCOPE_API_KEY
 * - 维度: 1536 (可选 64-2048)
 */

import type { LanguageModel } from 'ai';
import type { ModelProvider, EmbedResponse, EmbedParams } from '../types';
import { MODEL_IDS, EMBEDDING_DIMENSIONS } from '../types';

/**
 * 阿里云百炼 API 基础 URL (OpenAI 兼容)
 */
const DASHSCOPE_BASE_URL = process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';

/**
 * Qwen Embedding 模型 ID
 */
export const QWEN_EMBEDDING_MODEL = MODEL_IDS.QWEN_EMBEDDING;

/**
 * 默认向量维度
 * 1536 维：平衡语义表达和存储成本
 */
export const QWEN_EMBEDDING_DIMENSION = EMBEDDING_DIMENSIONS.QWEN;

/**
 * 获取 DashScope API Key
 */
function getApiKey(): string {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    throw new Error('DASHSCOPE_API_KEY is not set');
  }
  return apiKey;
}

/**
 * Qwen Chat 模型（暂不实现，使用 DeepSeek 作为主力）
 */
function getChatModel(_modelId?: string): LanguageModel {
  throw new Error(
    'Qwen chat model is not implemented. Use DeepSeek as primary provider.'
  );
}

/**
 * Qwen Embedding（通过 OpenAI 兼容接口）
 * 
 * 使用 text-embedding-v4 模型，1536 维
 */
async function embed(params: EmbedParams): Promise<EmbedResponse> {
  const apiKey = getApiKey();
  const modelId = params.modelId || QWEN_EMBEDDING_MODEL;
  
  const response = await fetch(`${DASHSCOPE_BASE_URL}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelId,
      input: params.texts,
      dimensions: QWEN_EMBEDDING_DIMENSION,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Qwen embedding failed: ${error}`);
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
    const apiKey = process.env.DASHSCOPE_API_KEY;
    return !!apiKey && apiKey.length > 0;
  } catch {
    return false;
  }
}

/**
 * Qwen 模型提供商
 */
export const qwenProvider: ModelProvider = {
  name: 'qwen' as any, // 扩展类型
  getChatModel,
  embed,
  healthCheck,
};

/**
 * 获取 Qwen Embedding（便捷函数）
 * 
 * 直接返回向量，使用 1536 维
 */
export async function getQwenEmbeddings(texts: string[]): Promise<number[][]> {
  const result = await embed({ texts });
  return result.embeddings;
}

/**
 * 获取单个文本的 Embedding
 */
export async function getQwenEmbedding(text: string): Promise<number[]> {
  const result = await embed({ texts: [text] });
  return result.embeddings[0];
}
