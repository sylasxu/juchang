/**
 * joinActivity Tool
 * 
 * 报名参与活动。当用户说"我要报名"、"帮我加入"等时使用。
 */

import { t } from 'elysia';
import { tool, jsonSchema } from 'ai';
import { toJsonSchema } from '@juchang/utils';
import { db, activities, participants, eq, and } from '@juchang/db';

const joinActivitySchema = t.Object({
  activityId: t.String({ description: '要报名的活动 ID' }),
});

type JoinActivityParams = typeof joinActivitySchema.static;

export function joinActivityTool(userId: string | null) {
  return tool({
    description: '报名活动。需要 activityId。',
    
    inputSchema: jsonSchema<JoinActivityParams>(toJsonSchema(joinActivitySchema)),
    
    execute: async ({ activityId }: JoinActivityParams) => {
      if (!userId) {
        return {
          success: false as const,
          error: '需要先登录才能报名活动',
          requireAuth: true,
        };
      }
      
      try {
        // 查询活动
        const [activity] = await db
          .select({
            id: activities.id,
            title: activities.title,
            status: activities.status,
            currentParticipants: activities.currentParticipants,
            maxParticipants: activities.maxParticipants,
            creatorId: activities.creatorId,
            startAt: activities.startAt,
          })
          .from(activities)
          .where(eq(activities.id, activityId))
          .limit(1);
        
        if (!activity) {
          return { success: false as const, error: '找不到这个活动' };
        }
        
        if (activity.status !== 'active') {
          return { success: false as const, error: '这个活动还不能报名（可能是草稿或已结束）' };
        }
        
        if (activity.creatorId === userId) {
          return { success: false as const, error: '你是活动发起人，不需要报名哦' };
        }
        
        if (new Date(activity.startAt) < new Date()) {
          return { success: false as const, error: '活动已经开始了，不能报名了' };
        }
        
        if (activity.currentParticipants >= activity.maxParticipants) {
          return { success: false as const, error: '活动已满员，下次早点来！' };
        }
        
        // 检查是否已报名
        const [existing] = await db
          .select({ id: participants.id, status: participants.status })
          .from(participants)
          .where(and(
            eq(participants.activityId, activityId),
            eq(participants.userId, userId)
          ))
          .limit(1);
        
        if (existing) {
          if (existing.status === 'joined') {
            return { success: false as const, error: '你已经报名了这个活动' };
          }
          // 如果之前退出过，重新加入
          await db
            .update(participants)
            .set({ status: 'joined' })
            .where(eq(participants.id, existing.id));
        } else {
          // 新增报名
          await db.insert(participants).values({
            activityId,
            userId,
            status: 'joined',
          });
        }
        
        // 更新参与人数
        await db
          .update(activities)
          .set({ currentParticipants: activity.currentParticipants + 1 })
          .where(eq(activities.id, activityId));
        
        return {
          success: true as const,
          activityId,
          activityTitle: activity.title,
          message: `报名成功！「${activity.title}」等你来～`,
        };
      } catch (error) {
        console.error('[joinActivity] Error:', error);
        return { success: false as const, error: '报名失败，请再试一次' };
      }
    },
  });
}
