/**
 * createPartnerIntent Tool
 * 
 * 创建搭子意向。当用户完成需求澄清后使用。
 * 必须包含 tags 和 activityType。
 * 
 * v4.0 Smart Broker: Agent 追问澄清后才能调用此 Tool
 */

import { t } from 'elysia';
import { tool, jsonSchema } from 'ai';
import { toJsonSchema } from '@juchang/utils';
import { db, users, partnerIntents, eq, and, sql } from '@juchang/db';
import { detectMatchesForIntent } from './helpers/match';

const createPartnerIntentSchema = t.Object({
  rawInput: t.String({ description: '用户原始输入' }),
  activityType: t.Union([
    t.Literal('food'),
    t.Literal('entertainment'),
    t.Literal('sports'),
    t.Literal('boardgame'),
    t.Literal('other'),
  ], { description: '活动类型' }),
  locationHint: t.String({ description: '地点提示: 观音桥/解放碑' }),
  timePreference: t.Optional(t.String({ description: '时间偏好: 今晚/周末/明天下午' })),
  tags: t.Array(t.String(), { description: '偏好标签: ["AA", "NoAlcohol", "Quiet"]' }),
  budgetType: t.Optional(t.Union([
    t.Literal('AA'),
    t.Literal('Treat'),
    t.Literal('Free'),
  ], { description: '预算类型' })),
  poiPreference: t.Optional(t.String({ description: '具体店铺偏好: 朱光玉' })),
});

type CreatePartnerIntentParams = typeof createPartnerIntentSchema.static;

export function createPartnerIntentTool(
  userId: string | null,
  userLocation: { lat: number; lng: number } | null
) {
  return tool({
    description: '创建搭子意向。当用户完成需求澄清后使用。必须包含 tags 和 activityType。',
    
    inputSchema: jsonSchema<CreatePartnerIntentParams>(
      toJsonSchema(createPartnerIntentSchema)
    ),
    
    execute: async (params: CreatePartnerIntentParams) => {
      // 1. 验证登录
      if (!userId) {
        return {
          success: false as const,
          error: '需要先登录才能发布搭子意向',
          requireAuth: true,
        };
      }
      
      try {
        // 2. 验证手机号 (CP-9)
        const [user] = await db
          .select({ phoneNumber: users.phoneNumber })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);
        
        if (!user?.phoneNumber) {
          return {
            success: false as const,
            error: '需要先绑定手机号才能发布搭子意向',
            requireAuth: true,
          };
        }
        
        // 3. 验证位置
        if (!userLocation) {
          return {
            success: false as const,
            error: '需要获取你的位置才能匹配附近的搭子',
          };
        }
        
        // 4. 检查重复意向 (同类型只能有一个 active)
        const [existingIntent] = await db
          .select({ id: partnerIntents.id })
          .from(partnerIntents)
          .where(and(
            eq(partnerIntents.userId, userId),
            eq(partnerIntents.activityType, params.activityType),
            eq(partnerIntents.status, 'active')
          ))
          .limit(1);
        
        if (existingIntent) {
          const typeNames: Record<string, string> = {
            food: '美食',
            entertainment: '娱乐',
            sports: '运动',
            boardgame: '桌游',
            other: '其他',
          };
          return {
            success: false as const,
            error: `你已经有一个[${typeNames[params.activityType]}]意向在等待匹配了`,
          };
        }

        // 5. 创建意向
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
        
        const [intent] = await db.insert(partnerIntents).values({
          userId,
          activityType: params.activityType,
          locationHint: params.locationHint,
          location: sql`ST_SetSRID(ST_MakePoint(${userLocation.lng}, ${userLocation.lat}), 4326)`,
          timePreference: params.timePreference,
          metaData: {
            tags: params.tags,
            poiPreference: params.poiPreference,
            budgetType: params.budgetType,
            rawInput: params.rawInput,
          },
          expiresAt,
          status: 'active',
        }).returning();
        
        // 6. 触发匹配检测
        const matchResult = await detectMatchesForIntent(intent.id);
        
        // 7. 返回结果
        if (matchResult) {
          return {
            success: true as const,
            intentId: intent.id,
            matchFound: true,
            matchId: matchResult.id,
            message: '🎉 找到匹配的搭子了！',
            extractedTags: params.tags,
          };
        }
        
        return {
          success: true as const,
          intentId: intent.id,
          matchFound: false,
          message: '意向已发布，有匹配会第一时间通知你',
          extractedTags: params.tags,
          expiresAt: expiresAt.toISOString(),
        };
      } catch (error) {
        console.error('[createPartnerIntent] Error:', error);
        return { success: false as const, error: '创建意向失败，请再试一次' };
      }
    },
  });
}
