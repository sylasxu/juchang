/**
 * AI Metrics Service
 * 
 * Token 使用量记录和统计。
 * 
 * v3.8 更新：conversations 表已重构为两层结构，metrics 数据暂时只打印日志
 * v3.9 更新：添加 DeepSeek Context Caching 命中记录
 * TODO: 后续可以新建 ai_metrics 表专门存储
 */

/**
 * Token 使用量
 */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  /** DeepSeek 缓存命中的 tokens */
  cacheHitTokens?: number;
  /** DeepSeek 缓存未命中的 tokens */
  cacheMissTokens?: number;
}

/**
 * 记录 Token 使用量
 * 
 * v3.8: 暂时只打印日志，不写入数据库
 * v3.9: 添加缓存命中率日志
 * TODO: 后续可以新建 ai_metrics 表专门存储
 */
export async function recordTokenUsage(
  userId: string | null,
  usage: TokenUsage,
  toolCalls?: Array<{ toolName: string }>
): Promise<void> {
  const effectiveUserId = userId || 'anonymous';
  
  // 计算缓存命中率
  let cacheInfo = '';
  if (usage.cacheHitTokens !== undefined && usage.cacheMissTokens !== undefined) {
    const totalPromptTokens = usage.cacheHitTokens + usage.cacheMissTokens;
    const cacheHitRate = totalPromptTokens > 0 
      ? ((usage.cacheHitTokens / totalPromptTokens) * 100).toFixed(1)
      : '0';
    cacheInfo = `, Cache: ${usage.cacheHitTokens}/${totalPromptTokens} (${cacheHitRate}% hit)`;
  }
  
  console.log(`[AI Metrics] User: ${effectiveUserId}, Tokens: ${usage.totalTokens}${cacheInfo}, Tools: ${toolCalls?.length || 0}`);
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
 * v3.8: 暂时返回空数据，后续新建 ai_metrics 表后实现
 */
export async function getTokenUsageStats(
  _startDate: Date,
  _endDate: Date
): Promise<DailyTokenUsage[]> {
  // TODO: 新建 ai_metrics 表后实现
  return [];
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
  _startDate: Date,
  _endDate: Date
): Promise<TokenUsageSummary> {
  // TODO: 新建 ai_metrics 表后实现
  return {
    totalRequests: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalTokens: 0,
    avgTokensPerRequest: 0,
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
  _startDate: Date,
  _endDate: Date
): Promise<ToolCallStats[]> {
  // TODO: 新建 ai_metrics 表后实现
  return [];
}
