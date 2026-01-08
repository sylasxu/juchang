/**
 * getMyIntents Tool
 * 
 * 查询用户的搭子意向列表和待确认的匹配。
 * 
 * v4.0 Smart Broker
 */

import { tool, jsonSchema } from 'ai';
import { db, partnerIntents, eq, and } from '@juchang/db';
import { getPendingMatchesForUser } from './helpers/match';

export function getMyIntentsTool(userId: string | null) {
  return tool({
    description: '查询用户的搭子意向列表和待确认的匹配。',
    
    inputSchema: jsonSchema<{}>({ type: 'object', properties: {} }),
    
    execute: async () => {
      if (!userId) {
        return {
          success: false as const,
          error: '需要先登录',
          requireAuth: true,
        };
      }
      
      try {
        // 查询活跃意向
        const intents = await db
          .select()
          .from(partnerIntents)
          .where(and(
            eq(partnerIntents.userId, userId),
            eq(partnerIntents.status, 'active')
          ));
        
        // 查询待确认的匹配
        const pendingMatches = await getPendingMatchesForUser(userId);
        
        // 活动类型名称映射
        const typeNames: Record<string, string> = {
          food: '美食',
          entertainment: '娱乐',
          sports: '运动',
          boardgame: '桌游',
          other: '其他',
        };
        
        // 格式化意向列表
        const formattedIntents = intents.map(intent => ({
          id: intent.id,
          type: intent.activityType,
          typeName: typeNames[intent.activityType] || intent.activityType,
          locationHint: intent.locationHint,
          timePreference: intent.timePreference,
          tags: intent.metaData?.tags || [],
          status: intent.status,
          expiresAt: intent.expiresAt,
          createdAt: intent.createdAt,
        }));
        
        // 格式化匹配列表
        const formattedMatches = pendingMatches.map(match => ({
          id: match.id,
          type: match.activityType,
          typeName: typeNames[match.activityType] || match.activityType,
          matchScore: match.matchScore,
          commonTags: match.commonTags,
          locationHint: match.centerLocationHint,
          confirmDeadline: match.confirmDeadline,
          isTempOrganizer: match.tempOrganizerId === userId,
        }));
        
        return {
          success: true as const,
          intents: formattedIntents,
          pendingMatches: formattedMatches,
          summary: intents.length > 0 || pendingMatches.length > 0
            ? `你有 ${intents.length} 个活跃意向，${pendingMatches.length} 个待确认匹配`
            : '你还没有发布搭子意向',
        };
      } catch (error) {
        console.error('[getMyIntents] Error:', error);
        return { success: false as const, error: '查询失败，请再试一次' };
      }
    },
  });
}
