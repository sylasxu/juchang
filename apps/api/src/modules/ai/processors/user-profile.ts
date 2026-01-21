/**
 * User Profile Processor - 用户画像注入
 * 
 * 纯函数实现，注入用户偏好到 System Prompt
 */

import { getEnhancedUserProfile, buildProfilePrompt } from '../memory/working';
import { createLogger } from '../observability/logger';

const logger = createLogger('processor.user-profile');

/**
 * 注入用户画像到 System Prompt
 * 
 * @param systemPrompt - 原始 System Prompt
 * @param userId - 用户 ID
 * @returns 注入画像后的 Prompt
 */
export async function injectUserProfile(
    systemPrompt: string,
    userId: string | null
): Promise<string> {
    if (!userId) return systemPrompt;

    try {
        const profile = await getEnhancedUserProfile(userId);

        // 如果没有有效画像，直接返回
        if (!profile || (profile.preferences.length === 0 && profile.frequentLocations.length === 0)) {
            return systemPrompt;
        }

        // 构建画像 Prompt
        const profilePrompt = buildProfilePrompt(profile);
        if (!profilePrompt) return systemPrompt;

        logger.debug('User profile injected', {
            userId,
            preferencesCount: profile.preferences.length,
            locationsCount: profile.frequentLocations.length,
        });

        return `${systemPrompt}\n\n${profilePrompt}`;

    } catch (error) {
        logger.error('Failed to inject user profile', {
            userId,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        return systemPrompt; // 失败时返回原始 Prompt
    }
}
