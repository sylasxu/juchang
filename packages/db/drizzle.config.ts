// packages/db/drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/schema/*',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
  // 包含自定义类型
  verbose: true,
  strict: true,
  // 生成时包含自定义类型定义
  breakpoints: true,
} satisfies Config;