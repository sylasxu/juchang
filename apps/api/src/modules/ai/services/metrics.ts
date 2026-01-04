/**
 * AI Metrics Service
 * 
 * Token 使用量记录和统计。
 * 数据存储在 conversations.content 中，不新建表。
 */

import { db, conversations, sql, toTimestamp } from '@juchang/db';

/**
 * Token 使用量
 */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

/**
 * 记录 Token 使用量
 * 
 * 存储在 conversations.content.usage 中
 * userId 为 null 时使用 'anonymous' 标识
 */
export async function recordTokenUsage(
  userId: string | null,
  usage: TokenUsage,
  toolCalls?: Array<{ toolName: string }>
): Promise<void> {
  // 使用 'anonymous' 作为匿名用户的标识
  const effectiveUserId = userId || 'anonymous';
  
  await db.insert(conversations).values({
    userId: effectiveUserId,
    role: 'assistant',
    messageType: 'text',
    content: {
      type: 'metrics',
      usage,
      toolCalls: toolCalls?.map(t => t.toolName) || [],
      timestamp: new Date().toISOString(),
    },
  });
  
  console.log(`[AI Metrics] User: ${effectiveUserId}, Tokens: ${usage.totalTokens}, Tools: ${toolCalls?.length || 0}`);
}

/**
 * 每日 Token 使用统计
 */
export interface DailyTokenUsage {
  date: string;
  totalRequests: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

/**
 * 获取 Token 使用统计（Admin 用）
 * 
 * 从 conversations 表实时聚合，不预计算
 */
export async function getTokenUsageStats(
  startDate: Date,
  endDate: Date
): Promise<DailyTokenUsage[]> {
  const result = await db.execute(sql`
    SELECT 
      TO_CHAR(DATE(created_at), 'YYYY-MM-DD') as date,
      COUNT(*)::int as "totalRequests",
      COALESCE(SUM((content->'usage'->>'inputTokens')::int), 0)::int as "inputTokens",
      COALESCE(SUM((content->'usage'->>'outputTokens')::int), 0)::int as "outputTokens",
      COALESCE(SUM((content->'usage'->>'totalTokens')::int), 0)::int as "totalTokens"
    FROM conversations
    WHERE role = 'assistant' 
      AND content->>'type' = 'metrics'
      AND created_at >= ${toTimestamp(startDate)}
      AND created_at <= ${toTimestamp(endDate)}
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `) as unknown as DailyTokenUsage[];
  
  return result;
}

/**
 * 获取 Token 使用汇总（Admin 用）
 */
export interface TokenUsageSummary {
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  avgTokensPerRequest: number;
}

export async function getTokenUsageSummary(
  startDate: Date,
  endDate: Date
): Promise<TokenUsageSummary> {
  const result = await db.execute(sql`
    SELECT 
      COUNT(*)::int as "totalRequests",
      COALESCE(SUM((content->'usage'->>'inputTokens')::int), 0)::int as "totalInputTokens",
      COALESCE(SUM((content->'usage'->>'outputTokens')::int), 0)::int as "totalOutputTokens",
      COALESCE(SUM((content->'usage'->>'totalTokens')::int), 0)::int as "totalTokens"
    FROM conversations
    WHERE role = 'assistant' 
      AND content->>'type' = 'metrics'
      AND created_at >= ${toTimestamp(startDate)}
      AND created_at <= ${toTimestamp(endDate)}
  `) as unknown as Array<{
    totalRequests: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalTokens: number;
  }>;
  
  const data = result[0] || {
    totalRequests: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalTokens: 0,
  };
  
  return {
    ...data,
    avgTokensPerRequest: data.totalRequests > 0 
      ? Math.round(data.totalTokens / data.totalRequests) 
      : 0,
  };
}

/**
 * 获取 Tool 调用统计（Admin 用）
 */
export interface ToolCallStats {
  toolName: string;
  count: number;
}

export async function getToolCallStats(
  startDate: Date,
  endDate: Date
): Promise<ToolCallStats[]> {
  // 使用 JSONB 数组展开统计
  const result = await db.execute(sql`
    SELECT 
      tool_name as "toolName",
      COUNT(*)::int as count
    FROM conversations,
      LATERAL jsonb_array_elements_text(content->'toolCalls') as tool_name
    WHERE role = 'assistant' 
      AND content->>'type' = 'metrics'
      AND created_at >= ${toTimestamp(startDate)}
      AND created_at <= ${toTimestamp(endDate)}
    GROUP BY tool_name
    ORDER BY count DESC
  `) as unknown as ToolCallStats[];
  
  return result;
}
