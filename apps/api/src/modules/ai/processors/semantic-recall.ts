/**
 * Semantic Recall Processor - 语义召回历史
 * 
 * 纯函数实现，基于向量相似度召回相关历史对话
 */

import { semanticRecall } from '../memory/semantic';
import { createLogger } from '../observability/logger';

const logger = createLogger('processor.semantic-recall');

export interface SemanticRecallOptions {
    /** 召回数量限制 */
    limit?: number;
    /** 相似度阈值 (0-1) */
    threshold?: number;
}

/**
 * 注入语义召回的相关历史到 System Prompt
 * 
 * @param systemPrompt - 原始 System Prompt
 * @param message - 当前用户消息
 * @param userId - 用户 ID
 * @param options - 召回选项
 * @returns 注入历史后的 Prompt
 */
export async function injectSemanticRecall(
    systemPrompt: string,
    message: string,
    userId: string | null,
    options: SemanticRecallOptions = {}
): Promise<string> {
    if (!userId || !message) return systemPrompt;

    const { limit = 3, threshold = 0.6 } = options;

    try {
        // 召回相关历史消息
        const relevantMsgs = await semanticRecall(message, userId, { limit, threshold });

        if (relevantMsgs.length === 0) {
            return systemPrompt;
        }

        // 构建历史上下文
        let historyContext = '\n\n<relevant_history>\n以下是与当前话题相关的历史对话：\n';

        for (const msg of relevantMsgs) {
            // 截断过长的内容
            const content = msg.content.length > 200
                ? msg.content.slice(0, 200) + '...'
                : msg.content;
            historyContext += `- [${msg.role}]: ${content}\n`;
        }

        historyContext += '</relevant_history>\n请参考历史对话上下文来回答，避免重复问题。';

        logger.debug('Semantic recall injected', {
            userId,
            recalledCount: relevantMsgs.length,
        });

        return systemPrompt + historyContext;

    } catch (error) {
        // 召回失败不影响主流程
        logger.warn('Semantic recall failed', {
            userId,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        return systemPrompt;
    }
}
