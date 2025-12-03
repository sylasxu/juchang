// App Entry + Scalar 挂载
import { OpenAPIHono } from '@hono/zod-openapi';
import { Scalar } from '@scalar/hono-api-reference';
import { serve } from '@hono/node-server'
import type { Context } from 'hono'
import { z } from 'zod';
import { extendZodWithOpenApi } from '@hono/zod-openapi';

// ⚡️ 全局激活：这会让 db schema, service dto, api schema 全都拥有 OpenAPI 能力
extendZodWithOpenApi(z);
import * as users from './modules/users/users.routes';
import { initSchedules } from './schedules'

const app = new OpenAPIHono()

// 1. 挂载子模块
app.route('/users', users);


// Use the middleware to serve the Scalar API Reference at /scalar
app.get('/scalar', Scalar({ url: '/doc' }))

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
