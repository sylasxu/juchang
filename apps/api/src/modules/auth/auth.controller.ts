// Auth Controller - 认证相关接口
import { Elysia } from 'elysia';
import { selectUserSchema } from '@juchang/db';
import { basePlugins } from '../../setup';
import { authModel, type ErrorResponse } from './auth.model';
import { wxLogin } from './auth.service';

export const authController = new Elysia({ prefix: '/auth' })
  .use(basePlugins)
  .use(authModel)
  
  // 微信登录
  .post(
    '/wx-login',
    async ({ body, jwt, set }) => {
      try {
        const user = await wxLogin(body);

        // 生成 JWT Token
        const token = await jwt.sign({
          id: user.id,
          wxOpenId: user.wxOpenId,
          role: 'user',
        });

        return {
          user,
          token,
        };
      } catch (error) {
        console.error('微信登录失败:', error);
        set.status = 400;
        return {
          code: 400,
          msg: error.message || '登录失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Auth'],
        summary: '微信登录',
        description: '使用微信授权码登录或注册',
      },
      body: 'auth.wxLogin',
      response: {
        200: 'auth.loginResponse',
        400: 'auth.error',
      },
    }
  );