import { z } from 'zod';

/**
 * 审核申请 DTO Schema
 */
export const reviewApplicationSchema = z.object({
  action: z.enum(['approve', 'reject']), // 批准或拒绝
});

export type ReviewApplicationDto = z.infer<typeof reviewApplicationSchema>;

