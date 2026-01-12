/**
 * Activity Tools - 活动相关 Tool 集合
 * 
 * 整合活动创建、修改、发布、查询等功能
 * 
 * v4.5: 从多个文件整合为单一模块
 */

import { t } from 'elysia';
import { tool, jsonSchema } from 'ai';
import { toJsonSchema } from '@juchang/utils';
import { db, activities, participants, users, eq, and, desc, sql } from '@juchang/db';

// ============ Schema 定义 ============

/** 活动类型枚举 */
const activityTypeSchema = t.Union([
  t.Literal('food'),
  t.Literal('entertainment'),
  t.Literal('sports'),
  t.Literal('boardgame'),
  t.Literal('other'),
], { description: '活动类型' });

/** 创建草稿参数 */
const createDraftSchema = t.Object({
  title: t.String({ description: '活动标题，必须包含 Emoji，格式：Emoji + 核心活动 + 状态，最多12字' }),
  type: activityTypeSchema,
  locationName: t.String({ description: '地点名称（POI），如"观音桥北城天街"' }),
  locationHint: t.String({ description: '重庆地形备注：楼层、入口、交通等信息' }),
  location: t.Tuple([t.Number(), t.Number()], { description: '位置坐标 [lng, lat]' }),
  startAt: t.String({ description: '开始时间，ISO 8601 格式' }),
  maxParticipants: t.Number({ minimum: 2, maximum: 50, description: '最大参与人数' }),
  summary: t.String({ maxLength: 30, description: '小聚的推荐语，30字内，温暖接地气' }),
});

/** 查询草稿参数 */
const getDraftSchema = t.Object({
  activityId: t.Optional(t.String({ description: '活动 ID（如果知道的话）' })),
  title: t.Optional(t.String({ description: '活动标题（用于模糊搜索）' })),
});

/** 修改草稿参数 */
const refineDraftSchema = t.Object({
  activityId: t.String({ description: '要修改的活动 ID' }),
  updates: t.Object({
    title: t.Optional(t.String({ description: '新标题' })),
    type: t.Optional(activityTypeSchema),
    locationName: t.Optional(t.String({ description: '新地点名称' })),
    locationHint: t.Optional(t.String({ description: '新位置备注' })),
    location: t.Optional(t.Tuple([t.Number(), t.Number()], { description: '新坐标 [lng, lat]' })),
    startAt: t.Optional(t.String({ description: '新开始时间，ISO 8601 格式' })),
    maxParticipants: t.Optional(t.Number({ minimum: 2, maximum: 50, description: '新人数上限' })),
  }, { description: '要更新的字段，只传需要修改的' }),
  reason: t.String({ description: '修改原因，用于生成回复' }),
});

/** 发布活动参数 */
const publishActivitySchema = t.Object({
  activityId: t.String({ description: '要发布的活动 ID' }),
});

// ============ 类型导出 ============

export type CreateDraftParams = typeof createDraftSchema.static;
export type GetDraftParams = typeof getDraftSchema.static;
export type RefineDraftParams = typeof refineDraftSchema.static;
export type PublishActivityParams = typeof publishActivitySchema.static;

// ============ 辅助函数 ============

async function checkAIQuota(userId: string): Promise<{ hasQuota: boolean; remaining: number }> {
  const [user] = await db
    .select({ aiCreateQuotaToday: users.aiCreateQuotaToday })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return { hasQuota: false, remaining: 0 };
  return { hasQuota: user.aiCreateQuotaToday > 0, remaining: user.aiCreateQuotaToday };
}

async function consumeAIQuota(userId: string): Promise<boolean> {
  const [user] = await db
    .select({ aiCreateQuotaToday: users.aiCreateQuotaToday })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user || user.aiCreateQuotaToday <= 0) return false;

  await db
    .update(users)
    .set({ aiCreateQuotaToday: user.aiCreateQuotaToday - 1 })
    .where(eq(users.id, userId));

  return true;
}

function generateShareUrl(activityId: string): string {
  return `https://juchang.app/activity/${activityId}`;
}

// ============ Tool 工厂函数 ============

/**
 * 创建活动草稿 Tool
 */
export function createActivityDraftTool(userId: string | null) {
  return tool({
    description: '创建活动草稿。推断缺失信息（时间默认明天14:00，人数默认4人），不反问。',
    inputSchema: jsonSchema<CreateDraftParams>(toJsonSchema(createDraftSchema)),
    
    execute: async (params: CreateDraftParams) => {
      if (!userId) {
        return {
          success: true as const,
          activityId: 'test-' + Date.now(),
          draft: params,
          message: '草稿已创建（测试模式）',
        };
      }
      
      try {
        const { location, startAt, ...activityData } = params;
        
        const [newActivity] = await db
          .insert(activities)
          .values({
            ...activityData,
            creatorId: userId,
            location: sql`ST_SetSRID(ST_MakePoint(${location[0]}, ${location[1]}), 4326)`,
            startAt: new Date(startAt),
            currentParticipants: 1,
            status: 'draft',
          })
          .returning({ id: activities.id });
        
        await db
          .insert(participants)
          .values({ activityId: newActivity.id, userId, status: 'joined' });
        
        return {
          success: true as const,
          activityId: newActivity.id,
          draft: params,
          message: '草稿已创建，可以在卡片上修改或直接发布',
        };
      } catch (error) {
        console.error('[createActivityDraft] Error:', error);
        return { success: false as const, error: '创建草稿失败，请再试一次' };
      }
    },
  });
}

/**
 * 查询草稿 Tool
 */
export function getDraftTool(userId: string | null) {
  return tool({
    description: '查询草稿。按 activityId 或 title 搜索，不传参返回最近草稿。',
    inputSchema: jsonSchema<GetDraftParams>(toJsonSchema(getDraftSchema)),
    
    execute: async ({ activityId, title }: GetDraftParams) => {
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
        const drafts = await db
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
          .where(and(eq(activities.creatorId, userId), eq(activities.status, 'draft')))
          .orderBy(desc(activities.createdAt))
          .limit(5);
        
        if (drafts.length === 0) {
          return { success: false as const, error: '你还没有草稿，要不要现在创建一个？' };
        }
        
        // 精确匹配 activityId
        if (activityId) {
          const draft = drafts.find(d => d.id === activityId);
          if (draft) {
            return {
              success: true as const,
              draft: { activityId: draft.id, ...draft, startAt: draft.startAt.toISOString() },
              message: '已获取草稿信息',
            };
          }
        }
        
        // 模糊匹配标题
        if (title) {
          const normalizedTitle = title.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim().toLowerCase();
          const matchedDraft = drafts.find(d => {
            const draftTitle = d.title.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim().toLowerCase();
            return draftTitle.includes(normalizedTitle) || normalizedTitle.includes(draftTitle);
          });
          
          if (matchedDraft) {
            return {
              success: true as const,
              draft: { activityId: matchedDraft.id, ...matchedDraft, startAt: matchedDraft.startAt.toISOString() },
              message: '已找到匹配的草稿',
            };
          }
        }
        
        // 返回最近草稿
        const latestDraft = drafts[0];
        return {
          success: true as const,
          draft: { activityId: latestDraft.id, ...latestDraft, startAt: latestDraft.startAt.toISOString() },
          allDrafts: drafts.length > 1 ? drafts.map(d => ({ id: d.id, title: d.title })) : undefined,
          message: drafts.length > 1 ? `找到 ${drafts.length} 个草稿，这是最近的一个` : '已获取草稿信息',
        };
      } catch (error) {
        console.error('[getDraft] Error:', error);
        return { success: false as const, error: '查询失败，请再试一次' };
      }
    },
  });
}

/**
 * 修改草稿 Tool
 */
export function refineDraftTool(userId: string | null) {
  return tool({
    description: '修改草稿。只改用户要求的字段，需要 activityId。',
    inputSchema: jsonSchema<RefineDraftParams>(toJsonSchema(refineDraftSchema)),
    
    execute: async ({ activityId, updates, reason }: RefineDraftParams) => {
      if (!userId) {
        return { success: true as const, activityId, updates, message: `已更新：${reason}（沙盒模式）` };
      }
      
      try {
        const [existingActivity] = await db
          .select({ id: activities.id, creatorId: activities.creatorId, status: activities.status })
          .from(activities)
          .where(eq(activities.id, activityId))
          .limit(1);
        
        if (!existingActivity) return { success: false as const, error: '找不到这个草稿，可能已经被删除了' };
        if (existingActivity.creatorId !== userId) return { success: false as const, error: '你没有权限修改这个活动' };
        if (existingActivity.status !== 'draft') return { success: false as const, error: '只能修改草稿状态的活动' };
        
        const updateData: Record<string, unknown> = {};
        if (updates.title) updateData.title = updates.title;
        if (updates.type) updateData.type = updates.type;
        if (updates.locationName) updateData.locationName = updates.locationName;
        if (updates.locationHint) updateData.locationHint = updates.locationHint;
        if (updates.maxParticipants) updateData.maxParticipants = updates.maxParticipants;
        if (updates.startAt) updateData.startAt = new Date(updates.startAt);
        
        if (updates.location) {
          await db.execute(sql`
            UPDATE activities 
            SET location = ST_SetSRID(ST_MakePoint(${updates.location[0]}, ${updates.location[1]}), 4326), updated_at = NOW()
            WHERE id = ${activityId}
          `);
        }
        
        if (Object.keys(updateData).length > 0) {
          await db.update(activities).set(updateData).where(eq(activities.id, activityId));
        }
        
        const [updatedActivity] = await db
          .select({
            id: activities.id, title: activities.title, type: activities.type,
            locationName: activities.locationName, locationHint: activities.locationHint,
            startAt: activities.startAt, maxParticipants: activities.maxParticipants,
          })
          .from(activities)
          .where(eq(activities.id, activityId))
          .limit(1);
        
        return {
          success: true as const,
          activityId,
          draft: { ...updatedActivity, startAt: updatedActivity.startAt.toISOString() },
          message: `已更新：${reason}`,
        };
      } catch (error) {
        console.error('[refineDraft] Error:', error);
        return { success: false as const, error: '修改失败，请再试一次' };
      }
    },
  });
}

/**
 * 发布活动 Tool
 */
export function publishActivityTool(userId: string | null) {
  return tool({
    description: '发布活动。将草稿改为 active 状态，消耗每日额度。',
    inputSchema: jsonSchema<PublishActivityParams>(toJsonSchema(publishActivitySchema)),
    
    execute: async ({ activityId }: PublishActivityParams) => {
      if (!userId) {
        return { success: true as const, activityId, shareUrl: generateShareUrl(activityId), message: '活动发布成功！（沙盒模式）' };
      }
      
      try {
        const [existingActivity] = await db
          .select({ id: activities.id, title: activities.title, creatorId: activities.creatorId, status: activities.status, startAt: activities.startAt })
          .from(activities)
          .where(eq(activities.id, activityId))
          .limit(1);
        
        if (!existingActivity) return { success: false as const, error: '找不到这个活动，可能已经被删除了' };
        if (existingActivity.creatorId !== userId) return { success: false as const, error: '你没有权限发布这个活动' };
        if (existingActivity.status !== 'draft') return { success: false as const, error: '这个活动已经发布过了' };
        if (existingActivity.startAt < new Date()) return { success: false as const, error: '活动时间已过期，请修改时间后再发布' };
        
        const quota = await checkAIQuota(userId);
        if (!quota.hasQuota) return { success: false as const, error: '今天的 AI 额度用完了，明天再来吧～', quotaRemaining: 0 };
        
        await db.update(activities).set({ status: 'active' }).where(eq(activities.id, activityId));
        await consumeAIQuota(userId);
        
        return {
          success: true as const,
          activityId,
          title: existingActivity.title,
          shareUrl: generateShareUrl(activityId),
          message: '活动发布成功！快分享给朋友吧',
          quotaRemaining: quota.remaining - 1,
        };
      } catch (error) {
        console.error('[publishActivity] Error:', error);
        return { success: false as const, error: '发布失败，请再试一次' };
      }
    },
  });
}
