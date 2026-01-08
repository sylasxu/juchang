/**
 * cancelIntent Tool
 * 
 * 取消搭子意向。
 * 
 * v4.0 Smart Broker
 */

import { t } from 'elysia';
import { tool, jsonSchema } from 'ai';
import { toJsonSchema } from '@juchang/utils';
import { db, partnerIntents, eq, and } from '@juchang/db';

const cancelIntentSchema = t.Object({
  intentId: t.String({ description: '要取消的意向 ID' }),
});

type CancelIntentParams = typeof cancelIntentSchema.static;

export function cancelIntentTool(userId: string | null) {
  return tool({
    description: '取消搭子意向。',
    
    inputSchema: jsonSchema<CancelIntentParams>(toJsonSchema(cancelIntentSchema)),
    
    execute: async ({ intentId }: CancelIntentParams) => {
      if (!userId) {
        return {
          success: false as const,
          error: '需要先登录',
          requireAuth: true,
        };
      }
      
      try {
        // 查询意向
        const [intent] = await db
          .select()
          .from(partnerIntents)
          .where(and(
            eq(partnerIntents.id, intentId),
            eq(partnerIntents.userId, userId)
          ))
          .limit(1);
        
        if (!intent) {
          return { success: false as const, error: '找不到这个意向' };
        }
        
        if (intent.status !== 'active') {
          return { success: false as const, error: '这个意向已经不能取消了' };
        }
        
        // 更新状态
        await db
          .update(partnerIntents)
          .set({ status: 'cancelled', updatedAt: new Date() })
          .where(eq(partnerIntents.id, intentId));
        
        return {
          success: true as const,
          message: '意向已取消',
        };
      } catch (error) {
        console.error('[cancelIntent] Error:', error);
        return { success: false as const, error: '取消失败，请再试一次' };
      }
    },
  });
}
