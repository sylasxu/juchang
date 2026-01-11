/**
 * getDraft Tool
 * 
 * 查询用户的活动草稿。支持两种方式：
 * 1. 按 activityId 精确查询
 * 2. 按标题模糊搜索（当用户说"继续编辑 xxx"时）
 */

import { t } from 'elysia';
import { tool, jsonSchema } from 'ai';
import { toJsonSchema } from '@juchang/utils';
import { db, activities, eq, and, desc } from '@juchang/db';

/**
 * Tool Schema
 */
const getDraftSchema = t.Object({
  activityId: t.Optional(t.String({ description: '活动 ID（如果知道的话）' })),
  title: t.Optional(t.String({ description: '活动标题（用于模糊搜索）' })),
});

type GetDraftParams = typeof getDraftSchema.static;

/**
 * 创建 getDraft Tool
 * 
 * @param userId - 用户 ID，null 时为沙盒模式
 */
export function getDraftTool(userId: string | null) {
  return tool({
    description: '查询草稿。按 activityId 或 title 搜索，不传参返回最近草稿。',
    
    inputSchema: jsonSchema<GetDraftParams>(toJsonSchema(getDraftSchema)),
    
    execute: async ({ activityId, title }: GetDraftParams) => {
      // 沙盒模式
      if (!userId) {
        return {
          success: true as const,
          draft: {
            activityId: 'sandbox-draft-id',
            title: title || '🀄️ 观音桥麻将局',
            type: 'boardgame',
            locationName: '观音桥',
            locationHint: '具体地点待定',
            startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            maxParticipants: 4,
            status: 'draft',
          },
          message: '已获取草稿信息（沙盒模式）',
        };
      }
      
      try {
        let query = db
          .select({
            id: activities.id,
            title: activities.title,
            type: activities.type,
            locationName: activities.locationName,
            locationHint: activities.locationHint,
            startAt: activities.startAt,
            maxParticipants: activities.maxParticipants,
            status: activities.status,
          })
          .from(activities)
          .where(
            and(
              eq(activities.creatorId, userId),
              eq(activities.status, 'draft')
            )
          )
          .orderBy(desc(activities.createdAt))
          .limit(5);
        
        const drafts = await query;
        
        if (drafts.length === 0) {
          return {
            success: false as const,
            error: '你还没有草稿，要不要现在创建一个？',
          };
        }
        
        // 如果提供了 activityId，精确匹配
        if (activityId) {
          const draft = drafts.find(d => d.id === activityId);
          if (draft) {
            return {
              success: true as const,
              draft: {
                activityId: draft.id,
                title: draft.title,
                type: draft.type,
                locationName: draft.locationName,
                locationHint: draft.locationHint,
                startAt: draft.startAt.toISOString(),
                maxParticipants: draft.maxParticipants,
                status: draft.status,
              },
              message: '已获取草稿信息',
            };
          }
        }
        
        // 如果提供了标题，模糊匹配
        if (title) {
          // 移除 emoji 和空格进行匹配
          const normalizedTitle = title.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim().toLowerCase();
          const matchedDraft = drafts.find(d => {
            const draftTitle = d.title.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim().toLowerCase();
            return draftTitle.includes(normalizedTitle) || normalizedTitle.includes(draftTitle);
          });
          
          if (matchedDraft) {
            return {
              success: true as const,
              draft: {
                activityId: matchedDraft.id,
                title: matchedDraft.title,
                type: matchedDraft.type,
                locationName: matchedDraft.locationName,
                locationHint: matchedDraft.locationHint,
                startAt: matchedDraft.startAt.toISOString(),
                maxParticipants: matchedDraft.maxParticipants,
                status: matchedDraft.status,
              },
              message: '已找到匹配的草稿',
            };
          }
        }
        
        // 没有匹配到，返回最近的草稿
        const latestDraft = drafts[0];
        return {
          success: true as const,
          draft: {
            activityId: latestDraft.id,
            title: latestDraft.title,
            type: latestDraft.type,
            locationName: latestDraft.locationName,
            locationHint: latestDraft.locationHint,
            startAt: latestDraft.startAt.toISOString(),
            maxParticipants: latestDraft.maxParticipants,
            status: latestDraft.status,
          },
          allDrafts: drafts.length > 1 ? drafts.map(d => ({ id: d.id, title: d.title })) : undefined,
          message: drafts.length > 1 
            ? `找到 ${drafts.length} 个草稿，这是最近的一个` 
            : '已获取草稿信息',
        };
      } catch (error) {
        console.error('[getDraft] Error:', error);
        return {
          success: false as const,
          error: '查询失败，请再试一次',
        };
      }
    },
  });
}
