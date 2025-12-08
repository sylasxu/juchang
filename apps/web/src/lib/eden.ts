// Eden Treaty 客户端（用于 Admin Web）
// Eden Treaty 是 Elysia 的类型安全客户端，利用 TypeScript 类型推导实现零代码生成
import { treaty } from '@elysiajs/eden';
// 从 @juchang/api 导入 App 类型
import type { App } from '@juchang/api';

// API 基础 URL（根据环境变量配置）
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// 创建 Eden Treaty 客户端
// 注意：Eden Treaty 使用 Proxy，小程序不支持，所以仅用于 Web 端
export const api = treaty<App>(API_BASE_URL);

// 使用示例：
// import { api } from '@/lib/eden';
// 
// // 完全类型安全，后端改代码前端立即报错
// const users = await api.users.get({ query: { page: 1, limit: 20 } });
// const activity = await api.activities({ id: 'xxx' }).get();
