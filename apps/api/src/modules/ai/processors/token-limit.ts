/**
 * Token Limit Processor - Token 限制
 * 
 * 纯函数实现，截断过长的 Prompt
 */

import { createLogger } from '../observability/logger';

const logger = createLogger('processor.token-limit');

/**
 * 按字符数限制截断 Prompt
 * 
 * 估算规则：中文约 2 字符/token，英文约 4 字符/token
 * 保守估计使用 2 字符/token
 * 
 * @param prompt - 原始 Prompt
 * @param maxTokens - 最大 Token 数（默认 12000）
 * @returns 截断后的 Prompt
 */
export function truncateByTokenLimit(
    prompt: string,
    maxTokens: number = 12000
): string {
    // 保守估算：2 字符 ≈ 1 token
    const maxChars = maxTokens * 2;

    if (prompt.length <= maxChars) {
        return prompt;
    }

    logger.warn('System prompt truncated', {
        originalLength: prompt.length,
        truncatedLength: maxChars,
        estimatedTokens: Math.ceil(prompt.length / 2),
    });

    return prompt.slice(0, maxChars) + '\n\n...[内容过长，已截断]';
}

/**
 * 估算 Token 数量
 * 
 * @param text - 文本
 * @returns 估算的 Token 数
 */
export function estimateTokens(text: string): number {
    // 简单估算：中文 2 字符/token，英文 4 字符/token
    // 这里取平均 2.5 字符/token
    return Math.ceil(text.length / 2.5);
}
