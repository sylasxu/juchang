import { z } from 'zod';

// 定义环境变量的 Schema
const envSchema = z.object({
  // 数据库 (虽然 API 不直接连，但 Services 需要，这里校验为了保险)
  DATABASE_URL: z.string().url(),
  
  // JWT
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  
  // 微信
  WECHAT_APP_ID: z.string().min(1),
  WECHAT_APP_SECRET: z.string().min(1),
  
  // 端口 (带默认值和转换)
  PORT: z.coerce.number().default(3000),
  
  // 运行环境
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// 供 ConfigModule 使用的校验函数
export function validate(config: Record<string, unknown>) {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    console.error('❌ Invalid environment variables:', result.error.format());
    throw new Error('Environment validation error');
  }

  return result.data;
}