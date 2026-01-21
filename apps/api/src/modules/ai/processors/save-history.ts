/**
 * Save History Processor - 保存对话历史
 * 
 * 纯函数实现，保存用户消息和 AI 响应到数据库
 */

import { getOrCreateThread, saveMessage } from '../memory/store';
import { getToolWidgetType } from '../tools';
import { createLogger } from '../observability/logger';

const logger = createLogger('processor.save-history');

export interface ToolCallTrace {
    toolName: string;
    toolCallId: string;
    args: unknown;
    result?: unknown;
}

/**
 * 保存对话历史到数据库
 * 
 * @param userId - 用户 ID
 * @param userMessage - 用户消息
 * @param aiResponse - AI 响应文本
 * @param toolCalls - Tool 调用记录
 */
export async function saveConversationHistory(
    userId: string | null,
    userMessage: string,
    aiResponse: string,
    toolCalls: ToolCallTrace[] = []
): Promise<void> {
    if (!userId) return;

    try {
        const { id: threadId } = await getOrCreateThread(userId);

        // 1. 保存用户消息
        if (userMessage) {
            await saveMessage({
                conversationId: threadId,
                userId,
                role: 'user',
                messageType: 'text',
                content: { text: userMessage },
            });
        }

        // 2. 保存 AI 响应
        if (aiResponse) {
            // 检查是否有关联的 activityId
            const activityId = extractActivityId(toolCalls);

            // 确定消息类型
            let messageType = 'text';
            if (toolCalls.length > 0) {
                const widgetType = getToolWidgetType(toolCalls[toolCalls.length - 1].toolName);
                if (widgetType) messageType = widgetType;
            }

            await saveMessage({
                conversationId: threadId,
                userId,
                role: 'assistant',
                messageType,
                content: {
                    text: aiResponse,
                    toolCalls: toolCalls.map(tc => ({
                        toolName: tc.toolName,
                        args: tc.args,
                        result: tc.result,
                    })),
                },
                activityId,
            });
        }

        logger.debug('Conversation saved', { userId, threadId, toolCallsCount: toolCalls.length });

    } catch (error) {
        // 保存失败不阻塞响应
        logger.error('Failed to save conversation', {
            userId,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}

/**
 * 从 Tool 结果中提取 activityId
 */
function extractActivityId(toolCalls: ToolCallTrace[]): string | undefined {
    for (const tc of toolCalls) {
        const result = tc.result as any;
        if (result?.data?.activityId) return result.data.activityId;
        if (result?.activityId) return result.activityId;
    }
    return undefined;
}
