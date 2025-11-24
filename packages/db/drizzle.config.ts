
export default {
  schema: './src/schema/*',
  out: './drizzle',
  dialect: 'postgresql', 
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // 包含自定义类型
  verbose: true,
  strict: true,
};