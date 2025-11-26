import { z } from 'zod';

/**
 * 活动创建 DTO Schema
 * 搭配全局 ZodValidationPipe 使用，无需 nestjs-zod
 */
export const createActivitySchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().optional(),
  type: z.enum(['sports', 'food', 'entertainment', 'culture', 'travel', 'study']),
  startAt: z.string().datetime(), // 前端传 ISO 字符串
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    name: z.string(),
    address: z.string(),
  }),
  maxParticipants: z.number().min(2).max(20),
  price: z.number().optional(),
});

export type CreateActivityDto = z.infer<typeof createActivitySchema>;