// App Entry + Scalar 挂载
import { extendZodWithOpenApi, OpenAPIHono } from '@hono/zod-openapi';
import { Scalar } from '@scalar/hono-api-reference';
import { serve } from '@hono/node-server'
import type { Context } from 'hono'

import { initSchedules } from './schedules'
import * as users from './modules/users/users.route';
import * as activities from './modules/activities/activities.route';

import { z } from 'zod';

// ✅ 这一步至关重要！
// 它把 .openapi() 方法注入到了原生 Zod 的原型链上
// 这样 @juchang/db 里的原生 schema 也就变成了 Hono 能识别的 schema
extendZodWithOpenApi(z); 

const app = new OpenAPIHono();

app.openapi(users.list, users.listHandler);
app.openapi(activities.getById, activities.getByIdHandler);
app.doc('/doc', {
  openapi: '3.0.0',
  info: { title: 'API Document', version: '1.0.0' },
});
// Or with dynamic configuration
app.get(
  '/scalar',
  Scalar((c: Context) => {
    return {
      url: '/doc',
      proxyUrl:
        c.env.ENVIRONMENT === 'development'
          ? 'https://proxy.scalar.com'
          : undefined,
    }
  })
)
// 🔥 启动定时任务
// 注意：仅在非 Serverless 环境（如 Docker/VPS）下直接运行
// 如果是 Vercel/Cloudflare，这里不能这样写，需要改用 HTTP Trigger
if (process.env.NODE_ENV !== 'test') {
  initSchedules();
}


serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
