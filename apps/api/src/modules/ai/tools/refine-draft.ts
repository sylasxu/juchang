/**
 * refineDraft Tool
 * 
 * 修改现有活动草稿。当用户说"换个地方"、"改时间"、"加人"等时使用。
 * 只修改用户明确要求的字段，其他字段保持不变。
 */

import { t } from 'elysia';
import { tool, jsonSchema } from 'ai';
import { toJsonSchema } from '@juchang/utils';
import { db, activities, eq, sql } from '@juchang/db';

/**
 * Tool Schema - 使用 TypeBox 语法
 * 使用 t.Optional() 处理可选字段
 */
const refineDraftSchema = t.Object({
  activityId: t.String({ description: '要修改的活动 ID' }),
  updates: t.Object({
    title: t.Optional(t.String({ description: '新标题' })),
    type: t.Optional(t.Union([
      t.Literal('food'),
      t.Literal('entertainment'),
      t.Literal('sports'),
      t.Literal('boardgame'),
      t.Literal('other'),
    ], { description: '新活动类型' })),
    locationName: t.Optional(t.String({ description: '新地点名称' })),
    locationHint: t.Optional(t.String({ description: '新位置备注' })),
    location: t.Optional(t.Tuple([t.Number(), t.Number()], { description: '新坐标 [lng, lat]' })),
    startAt: t.Optional(t.String({ description: '新开始时间，ISO 8601 格式' })),
    maxParticipants: t.Optional(t.Number({ minimum: 2, maximum: 50, description: '新人数上限' })),
  }, { description: '要更新的字段，只传需要修改的' }),
  reason: t.String({ description: '修改原因，用于生成回复' }),
});

/** 类型自动推导 */
type RefineDraftParams = typeof refineDraftSchema.static;

/**
 * 创建 refineDraft Tool
 * 
 * @param userId - 用户 ID，null 时为沙盒模式
 */
export function refineDraftTool(userId: string | null) {
  return tool({
    description: `修改现有活动草稿。当用户说"换个地方"、"改时间"、"加人"等时使用。

只修改用户明确要求的字段，其他字段保持不变。
必须提供 activityId（从当前草稿上下文获取）。`,
    
    inputSchema: jsonSchema<RefineDraftParams>(toJsonSchema(refineDraftSchema)),
    
    execute: async ({ activityId, updates, reason }: RefineDraftParams) => {
      // 沙盒模式
      if (!userId) {
        return {
          success: true as const,
          activityId,
          updates,
          message: `已更新：${reason}（沙盒模式）`,
        };
      }
      
      try {
        // 验证活动存在且属于当前用户
        const [existingActivity] = await db
          .select({
            id: activities.id,
            creatorId: activities.creatorId,
            status: activities.status,
          })
          .from(activities)
          .where(eq(activities.id, activityId))
          .limit(1);
        
        if (!existingActivity) {
          return {
            success: false as const,
            error: '找不到这个草稿，可能已经被删除了',
          };
        }
        
        if (existingActivity.creatorId !== userId) {
          return {
            success: false as const,
            error: '你没有权限修改这个活动',
          };
        }
        
        if (existingActivity.status !== 'draft') {
          return {
            success: false as const,
            error: '只能修改草稿状态的活动',
          };
        }
        
        // 构建更新对象
        const updateData: Record<string, unknown> = {};
        
        if (updates.title) updateData.title = updates.title;
        if (updates.type) updateData.type = updates.type;
        if (updates.locationName) updateData.locationName = updates.locationName;
        if (updates.locationHint) updateData.locationHint = updates.locationHint;
        if (updates.maxParticipants) updateData.maxParticipants = updates.maxParticipants;
        if (updates.startAt) updateData.startAt = new Date(updates.startAt);
        
        // 位置需要特殊处理
        if (updates.location) {
          await db.execute(sql`
            UPDATE activities 
            SET location = ST_SetSRID(ST_MakePoint(${updates.location[0]}, ${updates.location[1]}), 4326),
                updated_at = NOW()
            WHERE id = ${activityId}
          `);
        }
        
        // 更新其他字段
        if (Object.keys(updateData).length > 0) {
          await db
            .update(activities)
            .set(updateData)
            .where(eq(activities.id, activityId));
        }
        
        // 获取更新后的活动
        const [updatedActivity] = await db
          .select({
            id: activities.id,
            title: activities.title,
            type: activities.type,
            locationName: activities.locationName,
            locationHint: activities.locationHint,
            startAt: activities.startAt,
            maxParticipants: activities.maxParticipants,
          })
          .from(activities)
          .where(eq(activities.id, activityId))
          .limit(1);
        
        return {
          success: true as const,
          activityId,
          draft: {
            ...updatedActivity,
            startAt: updatedActivity.startAt.toISOString(),
          },
          message: `已更新：${reason}`,
        };
      } catch (error) {
        console.error('[refineDraft] Error:', error);
        return {
          success: false as const,
          error: '修改失败，请再试一次',
        };
      }
    },
  });
}
