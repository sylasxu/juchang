/**
 * getActivityDetail Tool
 * 
 * 查看活动详情。支持按 ID 或标题查询。
 */

import { t } from 'elysia';
import { tool, jsonSchema } from 'ai';
import { toJsonSchema } from '@juchang/utils';
import { db, activities, users, participants, eq, sql, desc } from '@juchang/db';

const getActivityDetailSchema = t.Object({
  activityId: t.Optional(t.String({ description: '活动 ID（精确查询）' })),
  title: t.Optional(t.String({ description: '活动标题（模糊搜索）' })),
});

type GetActivityDetailParams = typeof getActivityDetailSchema.static;

export function getActivityDetailTool(userId: string | null) {
  return tool({
    description: '查看活动详情。按 activityId 或 title 查询。',
    
    inputSchema: jsonSchema<GetActivityDetailParams>(toJsonSchema(getActivityDetailSchema)),
    
    execute: async ({ activityId, title }: GetActivityDetailParams) => {
      try {
        let activity;
        
        if (activityId) {
          // 按 ID 精确查询
          const [result] = await db
            .select({
              id: activities.id,
              title: activities.title,
              type: activities.type,
              status: activities.status,
              startAt: activities.startAt,
              locationName: activities.locationName,
              locationHint: activities.locationHint,
              currentParticipants: activities.currentParticipants,
              maxParticipants: activities.maxParticipants,
              creatorId: activities.creatorId,
              creatorNickname: users.nickname,
            })
            .from(activities)
            .leftJoin(users, eq(activities.creatorId, users.id))
            .where(eq(activities.id, activityId))
            .limit(1);
          
          activity = result;
        } else if (title) {
          // 按标题模糊搜索
          const normalizedTitle = title.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim().toLowerCase();
          
          const results = await db
            .select({
              id: activities.id,
              title: activities.title,
              type: activities.type,
              status: activities.status,
              startAt: activities.startAt,
              locationName: activities.locationName,
              locationHint: activities.locationHint,
              currentParticipants: activities.currentParticipants,
              maxParticipants: activities.maxParticipants,
              creatorId: activities.creatorId,
              creatorNickname: users.nickname,
            })
            .from(activities)
            .leftJoin(users, eq(activities.creatorId, users.id))
            .where(sql`${activities.status} IN ('active', 'draft')`)
            .orderBy(desc(activities.createdAt))
            .limit(10);
          
          // 模糊匹配
          activity = results.find(a => {
            const actTitle = a.title.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim().toLowerCase();
            return actTitle.includes(normalizedTitle) || normalizedTitle.includes(actTitle);
          });
        }
        
        if (!activity) {
          return {
            success: false as const,
            error: '找不到这个活动',
          };
        }
        
        // 查询参与者列表
        const participantList = await db
          .select({
            id: participants.id,
            nickname: users.nickname,
            avatarUrl: users.avatarUrl,
          })
          .from(participants)
          .innerJoin(users, eq(participants.userId, users.id))
          .where(eq(participants.activityId, activity.id))
          .limit(10);
        
        // 判断当前用户是否已报名
        let isJoined = false;
        let isCreator = false;
        if (userId) {
          isCreator = activity.creatorId === userId;
          const [joined] = await db
            .select({ id: participants.id })
            .from(participants)
            .where(sql`${participants.activityId} = ${activity.id} AND ${participants.userId} = ${userId} AND ${participants.status} = 'joined'`)
            .limit(1);
          isJoined = !!joined;
        }
        
        return {
          success: true as const,
          activity: {
            ...activity,
            startAt: activity.startAt.toISOString(),
          },
          participants: participantList,
          isJoined,
          isCreator,
          canJoin: activity.status === 'active' && 
                   activity.currentParticipants < activity.maxParticipants &&
                   !isJoined && !isCreator,
          message: `「${activity.title}」${activity.currentParticipants}/${activity.maxParticipants} 人`,
        };
      } catch (error) {
        console.error('[getActivityDetail] Error:', error);
        return { success: false as const, error: '查询失败，请再试一次' };
      }
    },
  });
}
