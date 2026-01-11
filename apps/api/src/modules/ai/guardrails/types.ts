/**
 * Guardrails Module Types - 安全护栏类型定义
 */

/**
 * 护栏检查结果
 */
export interface GuardResult {
  /** 是否通过 */
  passed: boolean;
  /** 是否被阻止 */
  blocked: boolean;
  /** 阻止原因 */
  reason?: string;
  /** 风险等级 */
  riskLevel?: RiskLevel;
  /** 触发的规则 */
  triggeredRules?: string[];
  /** 建议的响应（被阻止时） */
  suggestedResponse?: string;
}

/**
 * 风险等级
 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * 输入护栏配置
 */
export interface InputGuardConfig {
  /** 是否启用注入检测 */
  enableInjectionDetection: boolean;
  /** 是否启用敏感词检测 */
  enableSensitiveWordDetection: boolean;
  /** 最大输入长度 */
  maxInputLength: number;
  /** 自定义敏感词列表 */
  customSensitiveWords?: string[];
}

/**
 * 输出护栏配置
 */
export interface OutputGuardConfig {
  /** 是否启用 PII 检测 */
  enablePIIDetection: boolean;
  /** 是否启用有害内容检测 */
  enableHarmfulContentDetection: boolean;
  /** 最大输出长度 */
  maxOutputLength: number;
}

/**
 * 频率限制配置
 */
export interface RateLimitConfig {
  /** 时间窗口（秒） */
  windowSeconds: number;
  /** 最大请求数 */
  maxRequests: number;
  /** 是否按用户限制 */
  perUser: boolean;
}

/**
 * 频率限制结果
 */
export interface RateLimitResult {
  /** 是否允许 */
  allowed: boolean;
  /** 剩余请求数 */
  remaining: number;
  /** 重置时间（Unix 时间戳） */
  resetAt: number;
  /** 等待时间（秒） */
  retryAfter?: number;
}

/**
 * 默认输入护栏配置
 */
export const DEFAULT_INPUT_GUARD_CONFIG: InputGuardConfig = {
  enableInjectionDetection: true,
  enableSensitiveWordDetection: true,
  maxInputLength: 2000,
};

/**
 * 默认输出护栏配置
 */
export const DEFAULT_OUTPUT_GUARD_CONFIG: OutputGuardConfig = {
  enablePIIDetection: true,
  enableHarmfulContentDetection: true,
  maxOutputLength: 4000,
};

/**
 * 默认频率限制配置
 */
export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  windowSeconds: 60,
  maxRequests: 20,
  perUser: true,
};

