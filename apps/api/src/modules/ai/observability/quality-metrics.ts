/**
 * Quality Metrics - 对话质量指标记录
 * 
 * 记录每次 AI 对话的质量指标到数据库，用于：
 * - 对话质量监控（意图识别率、Tool 成功率）
 * - 转化率追踪（对话 → 活动创建/报名）
 * - 历史趋势分析
 * 
 * v4.6 新增
 */

import { db, aiConversationMetrics } from '@juchang/db';
import { createLogger } from './logger';

const logger = createLogger('quality-metrics');

/**
 * 对话指标数据
 */
export interface ConversationMetricsData {
  conversationId?: string;
  userId?: string;
  
  // 意图识别
  intent?: string;
  intentConfidence?: number;
  intentRecognized?: boolean;
  
  // Tool 调用
  toolsCalled?: string[];
  toolsSucceeded?: number;
  toolsFailed?: number;
  
  // Token 用量
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  
  // 性能
  latencyMs?: number;
  
  // 转化追踪
  activityCreated?: boolean;
  activityJoined?: boolean;
  activityId?: string;
  
  // 元数据
  source?: 'miniprogram' | 'admin';
}

/**
 * 计算对话质量评分
 * 
 * 公式：0.4 * intentConfidence + 0.6 * (toolsSucceeded / max(toolsCalled.length, 1))
 * 
 * - 意图识别置信度占 40%
 * - Tool 调用成功率占 60%
 */
export function calculateQualityScore(data: ConversationMetricsData): number {
  const intentConfidence = data.intentConfidence ?? 0.5;
  const toolsCalled = data.toolsCalled?.length ?? 0;
  const toolsSucceeded = data.toolsSucceeded ?? 0;
  
  // 如果没有 Tool 调用，Tool 成功率视为 1（不扣分）
  const toolSuccessRate = toolsCalled > 0 
    ? toolsSucceeded / toolsCalled 
    : 1;
  
  const score = 0.4 * intentConfidence + 0.6 * toolSuccessRate;
  
  return Math.round(score * 100) / 100; // 保留两位小数
}

/**
 * 记录对话质量指标到数据库
 */
export async function recordConversationMetrics(data: ConversationMetricsData): Promise<void> {
  try {
    const qualityScore = calculateQualityScore(data);
    
    await db.insert(aiConversationMetrics).values({
      conversationId: data.conversationId || null,
      userId: data.userId || null,
      intent: data.intent || null,
      intentConfidence: data.intentConfidence || null,
      intentRecognized: data.intentRecognized ?? true,
      toolsCalled: data.toolsCalled || [],
      toolsSucceeded: data.toolsSucceeded || 0,
      toolsFailed: data.toolsFailed || 0,
      qualityScore,
      inputTokens: data.inputTokens || 0,
      outputTokens: data.outputTokens || 0,
      totalTokens: data.totalTokens || 0,
      latencyMs: data.latencyMs || null,
      activityCreated: data.activityCreated || false,
      activityJoined: data.activityJoined || false,
      activityId: data.activityId || null,
      source: data.source || 'miniprogram',
    });
    
    // 低质量对话记录到异常日志
    if (qualityScore < 0.6) {
      logger.warn('Low quality conversation detected', {
        qualityScore,
        intent: data.intent,
        toolsCalled: data.toolsCalled,
        toolsSucceeded: data.toolsSucceeded,
        toolsFailed: data.toolsFailed,
        userId: data.userId,
      });
    }
    
    logger.debug('Conversation metrics recorded', {
      qualityScore,
      intent: data.intent,
      toolsCalled: data.toolsCalled?.length || 0,
    });
  } catch (error) {
    logger.error('Failed to record conversation metrics', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * 从 Tool 调用结果中提取转化信息
 */
export function extractConversionInfo(toolCalls: Array<{ toolName: string; result?: unknown }>): {
  activityCreated: boolean;
  activityJoined: boolean;
  activityId?: string;
} {
  let activityCreated = false;
  let activityJoined = false;
  let activityId: string | undefined;
  
  for (const tc of toolCalls) {
    const result = tc.result as Record<string, unknown> | undefined;
    
    if (result?.activityId) {
      activityId = result.activityId as string;
      
      // 根据 Tool 名称判断是创建还是报名
      if (tc.toolName === 'createActivity' || tc.toolName === 'create_activity') {
        activityCreated = true;
      } else if (tc.toolName === 'joinActivity' || tc.toolName === 'join_activity') {
        activityJoined = true;
      }
    }
  }
  
  return { activityCreated, activityJoined, activityId };
}
