/**
 * Extract Preferences Processor - 偏好提取
 * 
 * 纯函数实现，从对话中提取用户偏好并更新画像
 */

import { extractPreferences } from '../memory/extractor';
import { updateEnhancedUserProfile } from '../memory/working';
import { createLogger } from '../observability/logger';

const logger = createLogger('processor.extract-preferences');

/**
 * 从对话中提取偏好并更新用户画像
 * 
 * 异步执行，不阻塞响应
 * 
 * @param userId - 用户 ID
 * @param conversationHistory - 对话历史
 */
export async function extractAndUpdatePreferences(
    userId: string | null,
    conversationHistory: Array<{ role: string; content: string }>
): Promise<void> {
    if (!userId) return;
    if (conversationHistory.length === 0) return;

    try {
        // 使用 LLM 提取偏好
        const extraction = await extractPreferences(conversationHistory, { useLLM: true });

        // 如果提取到偏好，更新用户画像
        if (extraction.preferences.length > 0 || extraction.frequentLocations.length > 0) {
            await updateEnhancedUserProfile(userId, extraction);

            logger.debug('User preferences extracted and updated', {
                userId,
                preferencesCount: extraction.preferences.length,
                locationsCount: extraction.frequentLocations.length,
            });
        }

    } catch (error) {
        // 提取失败不影响主流程
        logger.warn('Failed to extract preferences', {
            userId,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
