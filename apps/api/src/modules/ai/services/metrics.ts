/**
 * AI Metrics Service - 简化版
 * 
 * 仅保留日志输出，不写入数据库
 */

// ==========================================
// Types
// ==========================================

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cacheHitTokens?: number;
  cacheMissTokens?: number;
}

// ==========================================
// 记录函数（仅日志）
// ==========================================

/**
 * 记录 Token 使用量（仅日志输出）
 */
export function recordTokenUsage(
  userId: string | null,
  usage: TokenUsage,
  toolCalls?: Array<{ toolName: string }>,
  _options?: { model?: string; source?: string; intent?: string }
): void {
  let cacheInfo = '';
  if (usage.cacheHitTokens !== undefined && usage.cacheMissTokens !== undefined) {
    const totalPromptTokens = usage.cacheHitTokens + usage.cacheMissTokens;
    const cacheHitRate = totalPromptTokens > 0 
      ? ((usage.cacheHitTokens / totalPromptTokens) * 100).toFixed(1)
      : '0';
    cacheInfo = `, Cache: ${usage.cacheHitTokens}/${totalPromptTokens} (${cacheHitRate}% hit)`;
  }
  console.log(`[AI Metrics] User: ${userId || 'anon'}, Tokens: ${usage.totalTokens}${cacheInfo}, Tools: ${toolCalls?.length || 0}`);
}

// ==========================================
// 查询函数（返回空数据）
// ==========================================

export interface DailyTokenUsage {
  date: string;
  totalRequests: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cacheHitTokens: number;
  cacheMissTokens: number;
  cacheHitRate: number;
}

export interface TokenUsageSummary {
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  avgTokensPerRequest: number;
  totalCacheHitTokens: number;
  totalCacheMissTokens: number;
  overallCacheHitRate: number;
}

export interface ToolStats {
  toolName: string;
  totalCount: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  avgDurationMs: number | null;
}

/**
 * 获取每日 Token 使用统计（返回空数组）
 */
export async function getTokenUsageStats(
  _startDate: Date,
  _endDate: Date
): Promise<DailyTokenUsage[]> {
  return [];
}

/**
 * 获取 Token 使用汇总（返回空数据）
 */
export async function getTokenUsageSummary(
  _startDate: Date,
  _endDate: Date
): Promise<TokenUsageSummary> {
  return {
    totalRequests: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalTokens: 0,
    avgTokensPerRequest: 0,
    totalCacheHitTokens: 0,
    totalCacheMissTokens: 0,
    overallCacheHitRate: 0,
  };
}

/**
 * 获取 Tool 调用统计（返回空数组）
 */
export async function getToolCallStats(
  _startDate: Date,
  _endDate: Date
): Promise<ToolStats[]> {
  return [];
}
