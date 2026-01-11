/**
 * Metrics - 指标收集
 * 
 * 提供计数器、仪表盘、直方图等指标
 */

import type { MetricPoint, MetricType } from './types';

/**
 * 指标存储
 */
const metricsStore: Map<string, MetricPoint[]> = new Map();
const MAX_POINTS_PER_METRIC = 1000;

/**
 * 生成指标 Key
 */
function getMetricKey(name: string, labels: Record<string, string>): string {
  const labelStr = Object.entries(labels)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join(',');
  return `${name}{${labelStr}}`;
}

/**
 * 记录指标点
 */
function recordMetric(
  name: string,
  value: number,
  type: MetricType,
  labels: Record<string, string> = {}
): void {
  const key = getMetricKey(name, labels);
  const point: MetricPoint = {
    name,
    value,
    timestamp: Date.now(),
    labels,
    type,
  };
  
  let points = metricsStore.get(key);
  if (!points) {
    points = [];
    metricsStore.set(key, points);
  }
  
  points.push(point);
  
  // 限制存储数量
  if (points.length > MAX_POINTS_PER_METRIC) {
    points.shift();
  }
}

// ============ Counter（计数器） ============

/**
 * 增加计数器
 */
export function incrementCounter(
  name: string,
  value: number = 1,
  labels: Record<string, string> = {}
): void {
  recordMetric(name, value, 'counter', labels);
}

/**
 * AI 请求计数
 */
export function countAIRequest(
  modelId: string,
  status: 'success' | 'error'
): void {
  incrementCounter('ai_requests_total', 1, { model: modelId, status });
}

/**
 * Tool 调用计数
 */
export function countToolCall(
  toolName: string,
  status: 'success' | 'error'
): void {
  incrementCounter('ai_tool_calls_total', 1, { tool: toolName, status });
}

// ============ Gauge（仪表盘） ============

/**
 * 设置仪表盘值
 */
export function setGauge(
  name: string,
  value: number,
  labels: Record<string, string> = {}
): void {
  recordMetric(name, value, 'gauge', labels);
}

/**
 * 记录活跃会话数
 */
export function setActiveSessions(count: number): void {
  setGauge('ai_active_sessions', count);
}

// ============ Histogram（直方图） ============

/**
 * 记录直方图值
 */
export function recordHistogram(
  name: string,
  value: number,
  labels: Record<string, string> = {}
): void {
  recordMetric(name, value, 'histogram', labels);
}

/**
 * 记录 AI 请求延迟
 */
export function recordAILatency(
  modelId: string,
  durationMs: number
): void {
  recordHistogram('ai_request_duration_ms', durationMs, { model: modelId });
}

/**
 * 记录 Token 用量
 */
export function recordTokenUsage(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): void {
  recordHistogram('ai_input_tokens', inputTokens, { model: modelId });
  recordHistogram('ai_output_tokens', outputTokens, { model: modelId });
}

/**
 * 记录 Tool 执行时间
 */
export function recordToolDuration(
  toolName: string,
  durationMs: number
): void {
  recordHistogram('ai_tool_duration_ms', durationMs, { tool: toolName });
}

// ============ 查询接口 ============

/**
 * 获取指标数据
 */
export function getMetric(
  name: string,
  labels: Record<string, string> = {}
): MetricPoint[] {
  const key = getMetricKey(name, labels);
  return metricsStore.get(key) || [];
}

/**
 * 获取所有指标名称
 */
export function getMetricNames(): string[] {
  const names = new Set<string>();
  for (const points of metricsStore.values()) {
    if (points.length > 0) {
      names.add(points[0].name);
    }
  }
  return Array.from(names);
}

/**
 * 获取指标汇总
 */
export function getMetricSummary(name: string): {
  count: number;
  sum: number;
  avg: number;
  min: number;
  max: number;
} | null {
  const allPoints: MetricPoint[] = [];
  
  for (const [key, points] of metricsStore.entries()) {
    if (key.startsWith(name)) {
      allPoints.push(...points);
    }
  }
  
  if (allPoints.length === 0) return null;
  
  const values = allPoints.map(p => p.value);
  const sum = values.reduce((a, b) => a + b, 0);
  
  return {
    count: values.length,
    sum,
    avg: sum / values.length,
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

/**
 * 清空指标
 */
export function clearMetrics(): void {
  metricsStore.clear();
}

/**
 * 清理过期指标（保留最近 1 小时）
 */
export function cleanupOldMetrics(): void {
  const cutoff = Date.now() - 60 * 60 * 1000;
  
  for (const [key, points] of metricsStore.entries()) {
    const filtered = points.filter(p => p.timestamp > cutoff);
    if (filtered.length === 0) {
      metricsStore.delete(key);
    } else {
      metricsStore.set(key, filtered);
    }
  }
}

