// src/common/interceptors/logging.interceptor.ts
import { createMiddleware } from 'hono/factory';

export const loggingInterceptor = createMiddleware(async (c, next) => {
  const start = Date.now();
  const { method, url } = c.req;

  await next(); // 执行业务逻辑

  const ms = Date.now() - start;
  console.log(`[${method}] ${url} - ${c.res.status} - ${ms}ms`);
});