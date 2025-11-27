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
    name: z.string().optional(),
    address: z.string().optional(),
  }),
  maxParticipants: z.number().min(2).max(20),
  feeType: z.enum(['free', 'aa', 'treat']).default('free'), // 费用类型：仅作信息展示，用户需在线下自行结算
  estimatedCost: z.number().min(0).optional(), // 预估费用（仅信息展示，单位：元），不涉及交易
  joinMode: z.enum(['instant', 'approval']).default('instant'), // 加入模式：instant=即时加入，approval=需要审核
  riskScore: z.number().min(0).max(100).optional(), // 风险分：0-100分，系统自动计算，>60分为高风险
});

export type CreateActivityDto = z.infer<typeof createActivitySchema>;