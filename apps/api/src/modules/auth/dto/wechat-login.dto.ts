import { z } from 'zod';

// 1. 定义 Zod Schema
export const WechatLoginSchema = z.object({
  code: z.string().min(1, { message: '微信授权 Code 不能为空' }),
});

// 2. 导出 TS 类型 (供 Controller 参数使用)
export type WechatLoginDto = z.infer<typeof WechatLoginSchema>;