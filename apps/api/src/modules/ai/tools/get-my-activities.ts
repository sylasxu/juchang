/**
 * getMyActivities Tool
 * 
 * 查看用户的活动列表。支持查看"我发布的"、"我参与的"。
 */

import { t } from 'elysia';
import { tool, jsonSchema } from 'ai';
import { toJsonSchema } from '@juchang/utils';
import { db, activities, participants, eq, and, desc, sql } from '@juchang/db';

const getMyActivitiesSchema = t.Object({
  type: t.Union([
    t.Literal('created'),
    t.Literal('joined'),
  ], { description: '"created" 我发布的，"joined" 我参与的' }),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 10, description: '返回数量，默认 5' })),
});

type GetMyActivitiesParams = typeof getMyActivitiesSchema.static;

export function getMyActivitiesTool(userId: string | null) {
  return tool({
    description: `查看用户的活动列表。

使用场景：
- "看看我发布的活动" → type: "created"
- "我参与了哪些活动" → type: "joined"
- "我的活动" → 默认 type: "created"`,
    
    inputSchema: jsonSchema<GetMyActivitiesParams>(toJsonSchema(getMyActivitiesSchema)),
    
    execute: async ({ type, limit = 5 }: GetMyActivitiesParams) => {
      if (!userId) {
        return {
          success: false as const,
          error: '需要先登录才能查看活动',
        };
      }
      
      try {
        if (type === 'created') {
          // 我发布的
          const myActivities = await db
            .select({
              id: activities.id,
              title: activities.title,
              type: activities.type,
              status: activities.status,
              startAt: activities.startAt,
              locationName: activities.locationName,
              currentParticipants: activities.currentParticipants,
              maxParticipants: activities.maxParticipants,
            })
            .from(activities)
            .where(eq(activities.creatorId, userId))
            .orderBy(desc(activities.createdAt))
            .limit(limit);
          
          if (myActivities.length === 0) {
            return {
              success: true as const,
              type: 'created',
              activities: [],
              message: '你还没有发布过活动，要不要现在创建一个？',
            };
          }
          
          return {
            success: true as const,
            type: 'created',
            activities: myActivities.map(a => ({
              ...a,
              startAt: a.startAt.toISOString(),
            })),
            message: `你发布了 ${myActivities.length} 个活动`,
          };
        } else {
          // 我参与的
          const joinedActivities = await db
            .select({
              id: activities.id,
              title: activities.title,
              type: activities.type,
              status: activities.status,
              startAt: activities.startAt,
              locationName: activities.locationName,
              currentParticipants: activities.currentParticipants,
              maxParticipants: activities.maxParticipants,
            })
            .from(activities)
            .innerJoin(participants, eq(activities.id, participants.activityId))
            .where(and(
              eq(participants.userId, userId),
              eq(participants.status, 'joined')
            ))
            .orderBy(desc(activities.startAt))
            .limit(limit);
          
          if (joinedActivities.length === 0) {
            return {
              success: true as const,
              type: 'joined',
              activities: [],
              message: '你还没有参与过活动，去探索一下附近有什么好玩的？',
            };
          }
          
          return {
            success: true as const,
            type: 'joined',
            activities: joinedActivities.map(a => ({
              ...a,
              startAt: a.startAt.toISOString(),
            })),
            message: `你参与了 ${joinedActivities.length} 个活动`,
          };
        }
      } catch (error) {
        console.error('[getMyActivities] Error:', error);
        return { success: false as const, error: '查询失败，请再试一次' };
      }
    },
  });
}
