/**
 * AI Pipeline - AI 请求处理管道（简化版）
 * 
 * 只保留用户画像注入，移除语义检索依赖
 */

import { getEnhancedUserProfile, buildProfilePrompt } from '../memory/working';
import { createLogger } from '../observability/logger';

const logger = createLogger('ai-pipeline');

/**
 * 处理 AI 请求上下文（简化版）
 * 
 * 只保留用户画像注入，移除语义检索
 */
export async function processAIContext(params: {
  userId: string | null;
  message: string;
  systemPrompt: string;
  history?: Array<{ role: string; content: string }>;
}): Promise<string> {
  let prompt = params.systemPrompt;
  
  // 1. 注入用户画像（如果有）
  if (params.userId) {
    const profile = await getEnhancedUserProfile(params.userId);
    if (profile.preferences.length > 0 || profile.frequentLocations.length > 0) {
      const profilePrompt = buildProfilePrompt(profile);
      if (profilePrompt) {
        prompt += `\n\n${profilePrompt}`;
        logger.debug('User profile injected', { 
          preferencesCount: profile.preferences.length,
        });
      }
    }
  }
  
  // 2. Token 限制（简单截断）
  const maxLength = 12000;
  if (prompt.length > maxLength) {
    logger.warn('System prompt truncated', { originalLength: prompt.length });
    prompt = prompt.slice(0, maxLength) + '\n...[内容过长，已截断]';
  }
  
  return prompt;
}
