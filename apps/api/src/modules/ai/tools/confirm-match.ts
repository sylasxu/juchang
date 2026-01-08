/**
 * confirmMatch Tool
 * 
 * 确认匹配，将匹配转为正式活动。只有临时召集人可以确认。
 * 
 * v4.0 Smart Broker
 */

import { t } from 'elysia';
import { tool, jsonSchema } from 'ai';
import { toJsonSchema } from '@juchang/utils';
import { confirmMatch as confirmMatchService } from './helpers/match';

const confirmMatchSchema = t.Object({
  matchId: t.String({ description: '要确认的匹配 ID' }),
});

type ConfirmMatchParams = typeof confirmMatchSchema.static;

export function confirmMatchTool(userId: string | null) {
  return tool({
    description: '确认匹配，将匹配转为正式活动。只有临时召集人可以确认。',
    
    inputSchema: jsonSchema<ConfirmMatchParams>(toJsonSchema(confirmMatchSchema)),
    
    execute: async ({ matchId }: ConfirmMatchParams) => {
      if (!userId) {
        return {
          success: false as const,
          error: '需要先登录',
          requireAuth: true,
        };
      }
      
      try {
        const result = await confirmMatchService(matchId, userId);
        
        if (!result.success) {
          return {
            success: false as const,
            error: result.error,
          };
        }
        
        return {
          success: true as const,
          activityId: result.activityId,
          message: '🎉 活动创建成功！大家可以开始聊天了～',
        };
      } catch (error) {
        console.error('[confirmMatch] Error:', error);
        return { success: false as const, error: '确认失败，请再试一次' };
      }
    },
  });
}
