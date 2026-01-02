/**
 * publishActivity Tool
 * 
 * 发布活动。将草稿状态的活动改为 active 状态。
 * 需要用户确认后才能调用（Human-in-the-Loop）。
 */

import { t } from 'elysia';
import { tool, jsonSchema } from 'ai';
import { toJsonSchema } from '@juchang/utils';
import { db, activities, users, conversations, eq } from '@juchang/db';

/**
 * Tool Schema - 使用 TypeBox 语法
 * 简单 Schema，只需要 activityId
 */
const publishActivitySchema = t.Object({
  activityId: t.String({ description: '要发布的活动 ID' }),
});

/** 类型自动推导 */
export type PublishActivityParams = typeof publishActivitySchema.static;

/** Tool 返回类型 */
export interface PublishActivityResult {
  success: boolean;
  activityId?: string;
  title?: string;
  shareUrl?: string;
  message?: string;
  quotaRemaining?: number;
  error?: string;
}

/**
 * 检查用户 AI 额度
 */
async function checkAIQuota(userId: string): Promise<{ hasQuota: boolean; remaining: number }> {
  const [user] = await db
    .select({
      aiCreateQuotaToday: users.aiCreateQuotaToday,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return { hasQuota: false, remaining: 0 };
  }

  return {
    hasQuota: user.aiCreateQuotaToday > 0,
    remaining: user.aiCreateQuotaToday,
  };
}

/**
 * 消耗 AI 额度
 */
async function consumeAIQuota(userId: string): Promise<boolean> {
  const [user] = await db
    .select({
      aiCreateQuotaToday: users.aiCreateQuotaToday,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user || user.aiCreateQuotaToday <= 0) {
    return false;
  }

  await db
    .update(users)
    .set({
      aiCreateQuotaToday: user.aiCreateQuotaToday - 1,
    })
    .where(eq(users.id, userId));

  return true;
}

/**
 * 生成分享链接
 */
function generateShareUrl(activityId: string): string {
  // TODO: 实际实现需要配置域名
  return `https://juchang.app/activity/${activityId}`;
}

/**
 * 创建 publishActivity Tool
 * 
 * @param userId - 用户 ID，null 时为沙盒模式
 */
export function publishActivityTool(userId: string | null) {
  return tool<PublishActivityParams, PublishActivityResult>({
    description: `发布活动。将草稿状态的活动改为 active 状态。

需要用户确认后才能调用。发布后会消耗用户的 AI 创建额度（每日 3 次）。`,
    
    inputSchema: jsonSchema<PublishActivityParams>(toJsonSchema(publishActivitySchema)),
    
    execute: async ({ activityId }): Promise<PublishActivityResult> => {
      // 沙盒模式
      if (!userId) {
        return {
          success: true,
          activityId,
          shareUrl: generateShareUrl(activityId),
          message: '活动发布成功！（沙盒模式）',
        };
      }
      
      try {
        // 验证活动存在且属于当前用户
        const [existingActivity] = await db
          .select({
            id: activities.id,
            title: activities.title,
            creatorId: activities.creatorId,
            status: activities.status,
            startAt: activities.startAt,
          })
          .from(activities)
          .where(eq(activities.id, activityId))
          .limit(1);
        
        if (!existingActivity) {
          return {
            success: false,
            error: '找不到这个活动，可能已经被删除了',
          };
        }
        
        if (existingActivity.creatorId !== userId) {
          return {
            success: false,
            error: '你没有权限发布这个活动',
          };
        }
        
        if (existingActivity.status !== 'draft') {
          return {
            success: false,
            error: '这个活动已经发布过了',
          };
        }
        
        // 检查活动时间是否已过期
        if (existingActivity.startAt < new Date()) {
          return {
            success: false,
            error: '活动时间已过期，请修改时间后再发布',
          };
        }
        
        // 检查额度
        const quota = await checkAIQuota(userId);
        if (!quota.hasQuota) {
          return {
            success: false,
            error: '今天的 AI 额度用完了，明天再来吧～',
            quotaRemaining: 0,
          };
        }
        
        // 发布活动
        await db
          .update(activities)
          .set({
            status: 'active',
          })
          .where(eq(activities.id, activityId));
        
        // 消耗额度
        await consumeAIQuota(userId);
        
        // 记录对话
        await db
          .insert(conversations)
          .values({
            userId,
            role: 'assistant',
            messageType: 'widget_share',
            content: {
              activityId,
              title: existingActivity.title,
              shareUrl: generateShareUrl(activityId),
            },
            activityId,
          });
        
        return {
          success: true,
          activityId,
          title: existingActivity.title,
          shareUrl: generateShareUrl(activityId),
          message: '活动发布成功！快分享给朋友吧',
          quotaRemaining: quota.remaining - 1,
        };
      } catch (error) {
        console.error('[publishActivity] Error:', error);
        return {
          success: false,
          error: '发布失败，请再试一次',
        };
      }
    },
  });
}
