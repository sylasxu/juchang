/**
 * Guardrails Module - 安全护栏
 * 
 * 提供输入/输出检测和频率限制
 * 
 * 使用示例：
 * ```typescript
 * import { checkInput, checkOutput, checkRateLimit } from './guardrails';
 * 
 * // 检查输入
 * const inputResult = checkInput(userMessage);
 * if (inputResult.blocked) {
 *   return inputResult.suggestedResponse;
 * }
 * 
 * // 检查频率限制
 * const rateResult = checkRateLimit(userId);
 * if (!rateResult.allowed) {
 *   return `请求太频繁，${rateResult.retryAfter}秒后再试`;
 * }
 * 
 * // 检查输出
 * const outputResult = checkOutput(aiResponse);
 * const safeResponse = outputResult.blocked 
 *   ? outputResult.suggestedResponse 
 *   : sanitizeOutput(aiResponse);
 * ```
 */

// Types
export type {
  GuardResult,
  RiskLevel,
  InputGuardConfig,
  OutputGuardConfig,
  RateLimitConfig,
  RateLimitResult,
} from './types';

export {
  DEFAULT_INPUT_GUARD_CONFIG,
  DEFAULT_OUTPUT_GUARD_CONFIG,
  DEFAULT_RATE_LIMIT_CONFIG,
} from './types';

// Input Guard
export {
  checkInput,
  sanitizeInput,
  shouldBlock,
} from './input-guard';

// Output Guard
export {
  checkOutput,
  sanitizeOutput,
  shouldBlockOutput,
} from './output-guard';

// Rate Limiter
export {
  checkRateLimit,
  consumeQuota,
  resetQuota,
  getUsage,
} from './rate-limiter';

