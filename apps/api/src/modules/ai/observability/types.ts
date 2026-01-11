/**
 * Observability Module Types - 可观测性类型定义
 */

/**
 * Span 状态
 */
export type SpanStatus = 'ok' | 'error' | 'timeout';

/**
 * 日志级别
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Span（追踪单元）
 */
export interface Span {
  /** Span ID */
  id: string;
  /** 父 Span ID */
  parentId?: string;
  /** Trace ID（整个请求链路） */
  traceId: string;
  /** Span 名称 */
  name: string;
  /** 开始时间 */
  startTime: number;
  /** 结束时间 */
  endTime?: number;
  /** 持续时间（毫秒） */
  duration?: number;
  /** 状态 */
  status: SpanStatus;
  /** 属性 */
  attributes: Record<string, unknown>;
  /** 事件列表 */
  events: SpanEvent[];
}

/**
 * Span 事件
 */
export interface SpanEvent {
  /** 事件名称 */
  name: string;
  /** 时间戳 */
  timestamp: number;
  /** 属性 */
  attributes?: Record<string, unknown>;
}

/**
 * 日志条目
 */
export interface LogEntry {
  /** 时间戳 */
  timestamp: number;
  /** 日志级别 */
  level: LogLevel;
  /** 消息 */
  message: string;
  /** Trace ID */
  traceId?: string;
  /** Span ID */
  spanId?: string;
  /** 额外数据 */
  data?: Record<string, unknown>;
  /** 来源模块 */
  module?: string;
}

/**
 * 指标点
 */
export interface MetricPoint {
  /** 指标名称 */
  name: string;
  /** 值 */
  value: number;
  /** 时间戳 */
  timestamp: number;
  /** 标签 */
  labels: Record<string, string>;
  /** 指标类型 */
  type: MetricType;
}

/**
 * 指标类型
 */
export type MetricType = 'counter' | 'gauge' | 'histogram';

/**
 * Trace 数据（用于 Admin Playground）
 */
export interface TraceData {
  /** Span ID */
  spanId: string;
  /** Span 名称 */
  name: string;
  /** 持续时间（毫秒） */
  duration: number;
  /** 元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * AI 请求追踪数据
 */
export interface AIRequestTrace {
  /** Trace ID */
  traceId: string;
  /** 用户 ID */
  userId?: string;
  /** 会话 ID */
  threadId?: string;
  /** 请求消息 */
  input: string;
  /** 响应消息 */
  output?: string;
  /** 模型 ID */
  modelId: string;
  /** Token 用量 */
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  /** Tool 调用 */
  toolCalls?: Array<{
    name: string;
    arguments: Record<string, unknown>;
    result?: unknown;
    duration: number;
  }>;
  /** 总耗时（毫秒） */
  totalDuration: number;
  /** 开始时间 */
  startTime: number;
  /** 结束时间 */
  endTime: number;
  /** 状态 */
  status: 'success' | 'error';
  /** 错误信息 */
  error?: string;
}

/**
 * 可观测性配置
 */
export interface ObservabilityConfig {
  /** 是否启用追踪 */
  enableTracing: boolean;
  /** 是否启用日志 */
  enableLogging: boolean;
  /** 是否启用指标 */
  enableMetrics: boolean;
  /** 日志级别 */
  logLevel: LogLevel;
  /** 采样率 (0-1) */
  samplingRate: number;
}

/**
 * 默认配置
 */
export const DEFAULT_OBSERVABILITY_CONFIG: ObservabilityConfig = {
  enableTracing: true,
  enableLogging: true,
  enableMetrics: true,
  logLevel: 'info',
  samplingRate: 1.0,
};

