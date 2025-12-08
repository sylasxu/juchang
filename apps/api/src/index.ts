// Elysia API Server Entry
import { Elysia } from 'elysia';
import { setup } from './setup';
import { openapi } from '@elysiajs/openapi';

// 导入路由模块（Controller）
import { authController } from './modules/auth/auth.controller';
import { userController } from './modules/users/user.controller';
import { activityController } from './modules/activities/activity.controller';

// 创建 Elysia 应用
const app = new Elysia()
.use(
  openapi()
)
  // 使用全局配置（CORS, OpenAPI, JWT）
  .use(setup)
  // 注册路由模块（Controller）
  .use(authController)
  .use(userController)
  .use(activityController)
  // 健康检查
  .get('/', () => 'Hello Juchang API')
  .get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }));

// 🔥 启动定时任务（仅在非 Serverless 环境）
if (process.env.NODE_ENV !== 'test') {
  // initSchedules();
}

// 启动服务器
const port = Number(process.env.API_PORT || 3000);
app.listen(port, () => {
  console.log(`🚀 API Server is running on http://localhost:${port}`);
  console.log(`📚 OpenAPI JSON: http://localhost:${port}/openapi/json`);
});

// 导出类型给 Eden Treaty (Web 使用)
export type App = typeof app;
