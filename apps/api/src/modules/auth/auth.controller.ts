// Auth Controller - 认证相关接口 (MVP 简化版)
// 只保留 /auth/login 和 /auth/bindPhone
import { Elysia } from 'elysia';
import { basePlugins, verifyAuth } from '../../setup';
import { authModel, type ErrorResponse } from './auth.model';
import { wxLogin, bindPhone } from './auth.service';

export const authController = new Elysia({ prefix: '/auth' })
  .use(basePlugins)
  .use(authModel)
  
  // 微信登录 (静默登录)
  .post(
    '/login',
    async ({ body, jwt, set }) => {
      try {
        const { user, isNewUser } = await wxLogin(body);

        // 生成 JWT Token
        const token = await jwt.sign({
          id: user.id,
          wxOpenId: user.wxOpenId,
          role: 'user',
        });

        return {
          user,
          token,
          isNewUser,
        };
      } catch (error: any) {
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
        description: '使用微信授权码静默登录，返回用户信息和 JWT Token',
      },
      body: 'auth.wxLogin',
      response: {
        200: 'auth.loginResponse',
        400: 'auth.error',
      },
    }
  )

  // 绑定手机号 (延迟验证)
  .post(
    '/bindPhone',
    async ({ body, jwt, headers, set }) => {
      // JWT 认证
      const user = await verifyAuth(jwt, headers);
      if (!user) {
        set.status = 401;
        return {
          code: 401,
          msg: '未授权',
        } satisfies ErrorResponse;
      }

      try {
        const result = await bindPhone(user.id, body);
        return result;
      } catch (error: any) {
        console.error('绑定手机号失败:', error);
        set.status = 400;
        return {
          code: 400,
          msg: error.message || '绑定手机号失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Auth'],
        summary: '绑定手机号',
        description: '使用 getPhoneNumber 返回的 code 绑定手机号（延迟验证）',
      },
      body: 'auth.bindPhone',
      response: {
        200: 'auth.bindPhoneResponse',
        400: 'auth.error',
        401: 'auth.error',
      },
    }
  );
