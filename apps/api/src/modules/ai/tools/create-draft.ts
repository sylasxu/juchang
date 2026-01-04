/**
 * createActivityDraft Tool
 * 
 * 当用户首次表达创建活动的意图时使用。
 * AI 必须推断所有缺失信息，生成完整草稿。
 */

import { t } from 'elysia';
import { tool, jsonSchema } from 'ai';
import { toJsonSchema } from '@juchang/utils';
import { db, activities, participants, sql } from '@juchang/db';

/**
 * Tool Schema - 使用 TypeBox 语法
 * 每个字段包含 description 属性供 AI 理解参数含义
 */
const createActivityDraftSchema = t.Object({
  title: t.String({ description: '活动标题，必须包含 Emoji，格式：Emoji + 核心活动 + 状态，最多12字' }),
  type: t.Union([
    t.Literal('food'),
    t.Literal('entertainment'),
    t.Literal('sports'),
    t.Literal('boardgame'),
    t.Literal('other'),
  ], { description: '活动类型' }),
  locationName: t.String({ description: '地点名称（POI），如"观音桥北城天街"' }),
  locationHint: t.String({ description: '重庆地形备注：楼层、入口、交通等信息' }),
  location: t.Tuple([t.Number(), t.Number()], { description: '位置坐标 [lng, lat]' }),
  startAt: t.String({ description: '开始时间，ISO 8601 格式' }),
  maxParticipants: t.Number({ minimum: 2, maximum: 50, description: '最大参与人数' }),
  summary: t.String({ maxLength: 30, description: '小聚的推荐语，30字内，温暖接地气' }),
});

/** 类型自动推导 */
type CreateActivityDraftParams = typeof createActivityDraftSchema.static;

/**
 * 创建 createActivityDraft Tool
 * 
 * @param userId - 用户 ID，null 时为测试模式（不写数据库）
 */
export function createActivityDraftTool(userId: string | null) {
  return tool({
    description: `创建活动草稿。当用户首次表达创建活动的意图时使用。

必须推断所有缺失信息，绝不反问：
- 时间：根据当前时间推断（今晚→19:00，明天→14:00，周末→周六14:00）
- 地点：使用用户位置附近的热门地标，补充楼层/入口信息
- 人数：默认 4 人
- 类型：从关键词推断（火锅→food，KTV→entertainment）

返回的草稿会渲染为 Widget_Draft 卡片，用户可以在卡片上修改。`,
    
    inputSchema: jsonSchema<CreateActivityDraftParams>(toJsonSchema(createActivityDraftSchema)),
    
    execute: async (params: CreateActivityDraftParams) => {
      // 测试模式（无用户）：不写数据库
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
        
        // 创建 draft 状态的活动
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
        
        // 将创建者加入参与者列表
        await db
          .insert(participants)
          .values({
            activityId: newActivity.id,
            userId,
            status: 'joined',
          });
        
        // v3.8: 对话记录由小程序端统一处理，Tool 只返回结果
        return {
          success: true as const,
          activityId: newActivity.id,
          draft: params,
          message: '草稿已创建，可以在卡片上修改或直接发布',
        };
      } catch (error) {
        console.error('[createActivityDraft] Error:', error);
        return {
          success: false as const,
          error: '创建草稿失败，请再试一次',
        };
      }
    },
  });
}
