/**
 * cancelActivity Tool
 * 
 * 取消活动。仅活动发起人可用。
 */

import { t } from 'elysia';
import { tool, jsonSchema } from 'ai';
import { toJsonSchema } from '@juchang/utils';
import { db, activities, eq } from '@juchang/db';

const cancelActivitySchema = t.Object({
  activityId: t.String({ description: '要取消的活动 ID' }),
  reason: t.Optional(t.String({ description: '取消原因（可选）' })),
});

type CancelActivityParams = typeof cancelActivitySchema.static;

export function cancelActivityTool(userId: string | null) {
  return tool({
    description: '取消活动。仅发起人可用，需要 activityId。',
    
    inputSchema: jsonSchema<CancelActivityParams>(toJsonSchema(cancelActivitySchema)),
    
    execute: async ({ activityId, reason }: CancelActivityParams) => {
      if (!userId) {
        return {
          success: false as const,
          error: '需要先登录才能取消活动',
        };
      }
      
      try {
        const [activity] = await db
          .select({
            id: activities.id,
            title: activities.title,
            status: activities.status,
            creatorId: activities.creatorId,
          })
          .from(activities)
          .where(eq(activities.id, activityId))
          .limit(1);
        
        if (!activity) {
          return { success: false as const, error: '找不到这个活动' };
        }
        
        if (activity.creatorId !== userId) {
          return { success: false as const, error: '只有活动发起人才能取消活动' };
        }
        
        if (activity.status === 'cancelled') {
          return { success: false as const, error: '活动已经取消了' };
        }
        
        if (activity.status === 'completed') {
          return { success: false as const, error: '活动已经结束了，不能取消' };
        }
        
        await db
          .update(activities)
          .set({ status: 'cancelled' })
          .where(eq(activities.id, activityId));
        
        return {
          success: true as const,
          activityId,
          activityTitle: activity.title,
          message: reason 
            ? `「${activity.title}」已取消，原因：${reason}` 
            : `「${activity.title}」已取消`,
        };
      } catch (error) {
        console.error('[cancelActivity] Error:', error);
        return { success: false as const, error: '取消失败，请再试一次' };
      }
    },
  });
}
