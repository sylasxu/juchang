import { z } from 'zod';

/**
 * 加入活动 DTO Schema
 */
export const joinActivitySchema = z.object({
  applicationMsg: z.string().max(500).optional(), // 申请理由（仅当 joinMode=approval 时使用）
});

export type JoinActivityDto = z.infer<typeof joinActivitySchema>;

