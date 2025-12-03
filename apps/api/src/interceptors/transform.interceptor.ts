// src/common/interceptors/transform.interceptor.ts
import { createMiddleware } from 'hono/factory';

export const transformInterceptor = createMiddleware(async (c, next) => {
  // 等待后续逻辑执行完毕
  await next();

  // 如果已经响应了错误，就不处理
  if (!c.res.ok) return;

  // 获取原本要返回的 JSON 数据
  // 注意：Hono 获取 res body 比较特殊，这里假设我们约定在 c.var.data 中存放结果，或者拦截 c.json
  // 更 Hono Native 的做法是：业务逻辑只返回数据，最后由这个中间件统一 c.json()
  
  // 简化版实现思路：
  // 业务层：return c.json(data)
  // 拦截层：比较难拦截 c.json 的输出流。
  
  // ⭐️ Hono 最佳实践：
  // 其实 Hono 不太推荐“拦截修改 Response”。
  // 但如果你非要实现，可以利用 c.set('response', data) 模式，最后在全局后置中间件输出。
});