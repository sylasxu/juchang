// // src/common/guards/risk.guard.ts
// import { createMiddleware } from 'hono/factory';
// import { tencentIMS } from '@juchang/utils';

// export const riskGuard = createMiddleware(async (c, next) => {
//   // 1. 获取数据 (Pre-process)
//   const body = await c.req.parseBody().catch(() => ({}));
//   const textToCheck = [body.title, body.description, body.message].join(' ');

//   // 2. 判定逻辑 (Logic)
//   if (textToCheck.trim()) {
//     const isSafe = await tencentIMS.checkText(textToCheck);
//     if (!isSafe) {
//       // 3. 拦截 (Block)
//       return c.json({ code: 400, message: '内容包含敏感信息，请修改' }, 400);
//     }
//   }

//   // 4. 放行 (Pass)
//   await next();
// });