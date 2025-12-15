// Elysia API Server Entry
import { config } from 'dotenv';
import { resolve } from 'path';

// 加载根目录的 .env 文件
config({ path: resolve(process.cwd(), '../../.env') });

import { Elysia } from 'elysia';
import { basePlugins } from './setup';
import { openapi } from '@elysiajs/openapi';

// 导入路由模块（Controller）
import { authController } from './modules/auth/auth.controller';
import { userController } from './modules/users/user.controller';
import { activityController } from './modules/activities/activity.controller';
import { aiController } from './modules/ai/ai.controller';
import { participantController } from './modules/participants/participant.controller';
import { dashboardController } from './modules/dashboard/dashboard.controller';
import { chatController } from './modules/chat/chat.controller';
import { transactionController } from './modules/transactions/transaction.controller';

// 创建 Elysia 应用
const app = new Elysia()
  // 全局插件：CORS + JWT + OpenAPI（只在这里使用一次）
  .use(basePlugins)
  .use(openapi({
    documentation: {
      info: {
        title: '聚场 API',
        version: '1.0.0',
        description: 'LBS-based P2P social platform API',
      },
      tags: [
        { name: 'Auth', description: '认证相关' },
        { name: 'Users', description: '用户管理' },
        { name: 'Activities', description: '活动管理' },
        { name: 'AI', description: 'AI 功能' },
        { name: 'Participants', description: '参与者管理' },
        { name: 'Chat', description: '群聊消息' },
        { name: 'Transactions', description: '支付交易' },
        { name: 'Dashboard', description: '仪表板数据' },
      ],
    },
  }))
  // 注册路由模块（Controller）
  .use(authController)
  .use(userController)
  .use(activityController)
  .use(aiController)
  .use(participantController)
  .use(chatController)
  .use(transactionController)
  .use(dashboardController)
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
  console.log(`🚀 API doc on http://localhost:${port}/openapi`);
  console.log(`📚 OpenAPI JSON: http://localhost:${port}/openapi/json`);
});

// 导出类型给 Eden Treaty (Web 使用)
export type App = typeof app;
