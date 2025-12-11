// Auth Controller - Elysia 实例作为控制器
import { Elysia } from 'elysia';
import { basePlugins } from '../../setup';
import { authModel, type ErrorResponse } from './auth.model';
import { validateUser } from './auth.service';

export const authController = new Elysia({ prefix: '/auth' })
  .use(basePlugins) // 引入 JWT 功能
  .use(authModel) // 引入 Model Plugin
  .post(
    '/login',
    async ({ body, jwt, set }) => {
      const user = await validateUser(body.phoneNumber, body.password);

      if (!user) {
        set.status = 401;
        return {
          code: 401,
          msg: '用户名或密码错误',
        } satisfies ErrorResponse;
      }

      // ✍️ 签发 Token
      const token = await jwt.sign({
        id: user.id,
        role: 'user', // 可以从 user.membershipType 转换
      });

      return { token };
    },
    {
      body: 'auth.login',
      response: {
        200: 'auth.token',
        401: 'auth.error',
      },
      detail: {
        tags: ['Auth'],
        summary: '用户登录',
        description: '通过手机号和密码登录，返回 JWT Token',
      },
    }
  );

