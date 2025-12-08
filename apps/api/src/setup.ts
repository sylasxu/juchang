// 全局配置：CORS, OpenAPI, JWT
import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';
import { openapi } from '@elysiajs/openapi';
import { jwt } from '@elysiajs/jwt';

/**
 * 基础应用配置
 * 包含 CORS、OpenAPI、JWT 等全局插件
 */
export const setup = new Elysia({ name: 'setup' })
  .use(cors())
  
  .use(
    jwt({
      name: 'jwt',
      secret: process.env.JWT_SECRET || 'dev-secret', // 生产环境请用 .env
      exp: '7d', // Token 有效期
    })
  );

/**
 * 鉴权中间件 (Guard/Middleware)
 * 任何使用 .use(authenticated) 的路由，都会强制校验 Token
 * 通过 derive 将 user 注入到 Context 中
 */
export const authenticated = new Elysia({ name: 'authenticated' })
  .use(setup) // 继承上面的配置
  .derive(async ({ jwt, headers, set }) => {
    const authHeader = headers['authorization'] || headers['Authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      set.status = 401;
      throw {
        code: 401,
        msg: '未授权或 Token 缺失',
      };
    }

    const token = authHeader.slice(7);
    const profile = await jwt.verify(token);

    if (!profile) {
      // 如果 Token 无效，直接在这里抛出 401
      set.status = 401;
      throw {
        code: 401,
        msg: '未授权或 Token 过期',
      };
    }

    // 🔥 注入 user 到 Context
    return {
      user: profile as { id: string; role: string },
    };
  });

