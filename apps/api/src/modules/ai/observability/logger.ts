/**
 * Logger - 结构化日志
 * 
 * 提供统一的日志接口
 */

import type { LogEntry, LogLevel } from './types';
import { DEFAULT_OBSERVABILITY_CONFIG } from './types';
import { getCurrentTraceId, getCurrentSpanId } from './tracer';

/**
 * 日志级别优先级
 */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * 当前日志级别
 */
let currentLogLevel: LogLevel = DEFAULT_OBSERVABILITY_CONFIG.logLevel;

/**
 * 日志存储（内存，生产环境应持久化）
 */
const logStore: LogEntry[] = [];
const MAX_LOG_ENTRIES = 1000;

/**
 * 设置日志级别
 */
export function setLogLevel(level: LogLevel): void {
  currentLogLevel = level;
}

/**
 * 获取日志级别
 */
export function getLogLevel(): LogLevel {
  return currentLogLevel;
}

/**
 * 检查是否应该记录该级别的日志
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[currentLogLevel];
}

/**
 * 创建日志条目
 */
function createLogEntry(
  level: LogLevel,
  message: string,
  data?: Record<string, unknown>,
  module?: string
): LogEntry {
  return {
    timestamp: Date.now(),
    level,
    message,
    traceId: getCurrentTraceId() || undefined,
    spanId: getCurrentSpanId() || undefined,
    data,
    module,
  };
}

/**
 * 记录日志
 */
function log(
  level: LogLevel,
  message: string,
  data?: Record<string, unknown>,
  module?: string
): void {
  if (!shouldLog(level)) return;
  
  const entry = createLogEntry(level, message, data, module);
  
  // 存储日志
  logStore.push(entry);
  if (logStore.length > MAX_LOG_ENTRIES) {
    logStore.shift();
  }
  
  // 输出到控制台
  const prefix = `[${new Date(entry.timestamp).toISOString()}] [${level.toUpperCase()}]`;
  const traceInfo = entry.traceId ? ` [trace:${entry.traceId.slice(0, 8)}]` : '';
  const moduleInfo = module ? ` [${module}]` : '';
  
  const consoleMethod = level === 'error' ? console.error 
    : level === 'warn' ? console.warn 
    : level === 'debug' ? console.debug 
    : console.log;
  
  if (data && Object.keys(data).length > 0) {
    consoleMethod(`${prefix}${traceInfo}${moduleInfo} ${message}`, data);
  } else {
    consoleMethod(`${prefix}${traceInfo}${moduleInfo} ${message}`);
  }
}

/**
 * Debug 日志
 */
export function debug(message: string, data?: Record<string, unknown>, module?: string): void {
  log('debug', message, data, module);
}

/**
 * Info 日志
 */
export function info(message: string, data?: Record<string, unknown>, module?: string): void {
  log('info', message, data, module);
}

/**
 * Warn 日志
 */
export function warn(message: string, data?: Record<string, unknown>, module?: string): void {
  log('warn', message, data, module);
}

/**
 * Error 日志
 */
export function error(message: string, data?: Record<string, unknown>, module?: string): void {
  log('error', message, data, module);
}

/**
 * 创建模块专用 Logger
 */
export function createLogger(moduleName: string) {
  return {
    debug: (message: string, data?: Record<string, unknown>) => debug(message, data, moduleName),
    info: (message: string, data?: Record<string, unknown>) => info(message, data, moduleName),
    warn: (message: string, data?: Record<string, unknown>) => warn(message, data, moduleName),
    error: (message: string, data?: Record<string, unknown>) => error(message, data, moduleName),
  };
}

/**
 * 获取最近的日志
 */
export function getRecentLogs(count: number = 100): LogEntry[] {
  return logStore.slice(-count);
}

/**
 * 按 Trace ID 获取日志
 */
export function getLogsByTraceId(traceId: string): LogEntry[] {
  return logStore.filter(entry => entry.traceId === traceId);
}

/**
 * 清空日志
 */
export function clearLogs(): void {
  logStore.length = 0;
}

