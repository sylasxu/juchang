/**
 * Input Guard Processor - 输入安全检查
 * 
 * 纯函数实现，无抽象层
 */

import { checkInput, sanitizeInput } from '../guardrails/input-guard';
import { createLogger } from '../observability/logger';

const logger = createLogger('processor.input-guard');

export interface InputGuardResult {
    /** 清理后的消息 */
    sanitized: string;
    /** 是否被拦截 */
    blocked: boolean;
    /** 拦截原因 */
    blockReason?: string;
    /** 建议响应 */
    suggestedResponse?: string;
    /** 触发的规则 */
    triggeredRules?: string[];
}

/**
 * 输入安全检查 + 清理
 * 
 * @param message - 用户原始消息
 * @param userId - 用户 ID (用于日志)
 * @returns 检查结果
 */
export function sanitizeAndGuard(
    message: string,
    userId?: string | null
): InputGuardResult {
    // 1. 清理输入（移除潜在危险内容）
    const sanitized = sanitizeInput(message);

    // 2. 检查输入
    const result = checkInput(sanitized, {}, { userId: userId || undefined });

    if (result.blocked) {
        logger.warn('Input blocked', {
            userId: userId || 'anon',
            reason: result.reason,
            triggeredRules: result.triggeredRules,
        });

        return {
            sanitized,
            blocked: true,
            blockReason: result.reason,
            suggestedResponse: result.suggestedResponse || '这个话题我帮不了你 😅',
            triggeredRules: result.triggeredRules,
        };
    }

    // 记录清理日志（如果有变化）
    if (sanitized !== message) {
        logger.debug('Input sanitized', {
            userId: userId || 'anon',
            originalLength: message.length,
            sanitizedLength: sanitized.length,
        });
    }

    return {
        sanitized,
        blocked: false,
    };
}
