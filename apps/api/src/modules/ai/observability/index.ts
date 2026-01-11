/**
 * Observability Module - 可观测性
 * 
 * 提供追踪、日志、指标收集功能
 * 
 * 使用示例：
 * ```typescript
 * import { 
 *   withSpan, 
 *   createLogger, 
 *   countAIRequest, 
 *   recordAILatency 
 * } from './observability';
 * 
 * const logger = createLogger('ai.chat');
 * 
 * // 追踪函数执行
 * const result = await withSpan('processMessage', async (span) => {
 *   logger.info('Processing message', { userId });
 *   
 *   // 业务逻辑...
 *   
 *   return result;
 * });
 * 
 * // 记录指标
 * countAIRequest('deepseek-chat', 'success');
 * recordAILatency('deepseek-chat', 1500);
 * ```
 */

// Types
export type {
  SpanStatus,
  LogLevel,
  Span,
  SpanEvent,
  LogEntry,
  MetricPoint,
  MetricType,
  TraceData,
  AIRequestTrace,
  ObservabilityConfig,
} from './types';

export { DEFAULT_OBSERVABILITY_CONFIG } from './types';

// Tracer
export {
  createTrace,
  getCurrentTraceId,
  getCurrentSpanId,
  startSpan,
  endSpan,
  addSpanEvent,
  setSpanAttribute,
  withSpan,
  withSpanSync,
  spanToTraceData,
  recordAIRequest,
  getAIRequestTrace,
  getSpansByTraceId,
  cleanupOldTraces,
  resetTraceContext,
} from './tracer';

// Logger
export {
  setLogLevel,
  getLogLevel,
  debug,
  info,
  warn,
  error,
  createLogger,
  getRecentLogs,
  getLogsByTraceId,
  clearLogs,
} from './logger';

// Metrics
export {
  incrementCounter,
  countAIRequest,
  countToolCall,
  setGauge,
  setActiveSessions,
  recordHistogram,
  recordAILatency,
  recordTokenUsage,
  recordToolDuration,
  getMetric,
  getMetricNames,
  getMetricSummary,
  clearMetrics,
  cleanupOldMetrics,
} from './metrics';

