/**
 * AI Metrics Service
 * 
 * Token 使用量记录和统计。
 * 
 * v3.8 更新：conversations 表已重构为两层结构，metrics 数据暂时只打印日志
 * TODO: 后续可以新建 ai_metrics 表专门存储
 */

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
 * v3.8: 暂时只打印日志，不写入数据库
 * TODO: 后续可以新建 ai_metrics 表专门存储
 */
export async function recordTokenUsage(
  userId: string | null,
  usage: TokenUsage,
  toolCalls?: Array<{ toolName: string }>
): Promise<void> {
  const effectiveUserId = userId || 'anonymous';
  
  // 暂时只打印日志
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
