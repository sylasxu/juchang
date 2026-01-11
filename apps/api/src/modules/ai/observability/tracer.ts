/**
 * Tracer - 分布式追踪
 * 
 * 提供 Span 创建和管理功能
 */

import type { Span, SpanEvent, SpanStatus, TraceData, AIRequestTrace } from './types';

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * 当前 Trace 上下文（简化版，生产环境应使用 AsyncLocalStorage）
 */
let currentTraceId: string | null = null;
let currentSpanId: string | null = null;

/**
 * Span 存储（内存，生产环境应持久化）
 */
const spanStore: Map<string, Span> = new Map();
const traceStore: Map<string, AIRequestTrace> = new Map();

/**
 * 创建新的 Trace
 */
export function createTrace(): string {
  const traceId = generateId();
  currentTraceId = traceId;
  return traceId;
}

/**
 * 获取当前 Trace ID
 */
export function getCurrentTraceId(): string | null {
  return currentTraceId;
}

/**
 * 获取当前 Span ID
 */
export function getCurrentSpanId(): string | null {
  return currentSpanId;
}

/**
 * 创建 Span
 */
export function startSpan(
  name: string,
  attributes: Record<string, unknown> = {}
): Span {
  const span: Span = {
    id: generateId(),
    parentId: currentSpanId || undefined,
    traceId: currentTraceId || createTrace(),
    name,
    startTime: Date.now(),
    status: 'ok',
    attributes,
    events: [],
  };
  
  currentSpanId = span.id;
  spanStore.set(span.id, span);
  
  return span;
}

/**
 * 结束 Span
 */
export function endSpan(span: Span, status: SpanStatus = 'ok'): void {
  span.endTime = Date.now();
  span.duration = span.endTime - span.startTime;
  span.status = status;
  
  // 恢复父 Span
  currentSpanId = span.parentId || null;
}

/**
 * 添加 Span 事件
 */
export function addSpanEvent(
  span: Span,
  name: string,
  attributes?: Record<string, unknown>
): void {
  const event: SpanEvent = {
    name,
    timestamp: Date.now(),
    attributes,
  };
  span.events.push(event);
}

/**
 * 设置 Span 属性
 */
export function setSpanAttribute(
  span: Span,
  key: string,
  value: unknown
): void {
  span.attributes[key] = value;
}

/**
 * 包装函数执行并追踪
 */
export async function withSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  attributes: Record<string, unknown> = {}
): Promise<T> {
  const span = startSpan(name, attributes);
  
  try {
    const result = await fn(span);
    endSpan(span, 'ok');
    return result;
  } catch (error) {
    endSpan(span, 'error');
    setSpanAttribute(span, 'error.message', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * 同步版本的 withSpan
 */
export function withSpanSync<T>(
  name: string,
  fn: (span: Span) => T,
  attributes: Record<string, unknown> = {}
): T {
  const span = startSpan(name, attributes);
  
  try {
    const result = fn(span);
    endSpan(span, 'ok');
    return result;
  } catch (error) {
    endSpan(span, 'error');
    setSpanAttribute(span, 'error.message', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * 转换为 TraceData（用于 SSE 流）
 */
export function spanToTraceData(span: Span): TraceData {
  return {
    spanId: span.id,
    name: span.name,
    duration: span.duration || 0,
    metadata: span.attributes,
  };
}

/**
 * 记录 AI 请求追踪
 */
export function recordAIRequest(trace: AIRequestTrace): void {
  traceStore.set(trace.traceId, trace);
}

/**
 * 获取 AI 请求追踪
 */
export function getAIRequestTrace(traceId: string): AIRequestTrace | undefined {
  return traceStore.get(traceId);
}

/**
 * 获取 Trace 下的所有 Span
 */
export function getSpansByTraceId(traceId: string): Span[] {
  return Array.from(spanStore.values()).filter(s => s.traceId === traceId);
}

/**
 * 清理过期数据（保留最近 1 小时）
 */
export function cleanupOldTraces(): void {
  const cutoff = Date.now() - 60 * 60 * 1000;
  
  for (const [id, span] of spanStore.entries()) {
    if (span.startTime < cutoff) {
      spanStore.delete(id);
    }
  }
  
  for (const [id, trace] of traceStore.entries()) {
    if (trace.startTime < cutoff) {
      traceStore.delete(id);
    }
  }
}

/**
 * 重置追踪上下文
 */
export function resetTraceContext(): void {
  currentTraceId = null;
  currentSpanId = null;
}

