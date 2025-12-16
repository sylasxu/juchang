// Auth Controller - 认证相关接口
import { Elysia, t } from 'elysia';
import { selectUserSchema } from '@juchang/db';
import { basePlugins, verifyAuth } from '../../setup';
import { authModel, type ErrorResponse } from './auth.model';
import { wxLogin, getUserById, updateUserProfile, registerUser } from './auth.service';

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
        description: '使用微信授权码登录或注册',
      },
      body: 'auth.wxLogin',
      response: {
        200: 'auth.loginResponse',
        400: 'auth.error',
      },
    }
  )

  // 刷新Token
  .post(
    '/refresh',
    async ({ jwt, headers, set }) => {
      const user = await verifyAuth(jwt, headers);
      if (!user) {
        set.status = 401;
        return {
          code: 401,
          msg: '未授权',
        } satisfies ErrorResponse;
      }

      // 生成新的 JWT Token
      const token = await jwt.sign({
        id: user.id,
        role: 'user',
      });

      return {
        token,
        expiresIn: 7 * 24 * 60 * 60, // 7天
      };
    },
    {
      detail: {
        tags: ['Auth'],
        summary: '刷新Token',
        description: '使用当前有效Token换取新Token',
      },
      response: {
        200: t.Object({
          token: t.String(),
          expiresIn: t.Number(),
        }),
        401: 'auth.error',
      },
    }
  )

  // 登出
  .post(
    '/logout',
    async ({ jwt, headers, set }) => {
      const user = await verifyAuth(jwt, headers);
      if (!user) {
        set.status = 401;
        return {
          code: 401,
          msg: '未授权',
        } satisfies ErrorResponse;
      }

      // TODO: 可以将Token加入黑名单（如果需要强制失效）
      return {
        msg: '登出成功',
      };
    },
    {
      detail: {
        tags: ['Auth'],
        summary: '登出',
        description: '用户登出',
      },
      response: {
        200: t.Object({
          msg: t.String(),
        }),
        401: 'auth.error',
      },
    }
  )

  // 获取当前用户信息
  .get(
    '/profile',
    async ({ jwt, headers, set }) => {
      const user = await verifyAuth(jwt, headers);
      if (!user) {
        set.status = 401;
        return {
          code: 401,
          msg: '未授权',
        } satisfies ErrorResponse;
      }

      const profile = await getUserById(user.id);
      if (!profile) {
        set.status = 404;
        return {
          code: 404,
          msg: '用户不存在',
        } satisfies ErrorResponse;
      }

      return profile;
    },
    {
      detail: {
        tags: ['Auth'],
        summary: '获取当前用户信息',
        description: '获取当前登录用户的详细信息',
      },
      response: {
        200: selectUserSchema,
        401: 'auth.error',
        404: 'auth.error',
      },
    }
  )

  // 更新当前用户信息
  .put(
    '/profile',
    async ({ body, jwt, headers, set }) => {
      const user = await verifyAuth(jwt, headers);
      if (!user) {
        set.status = 401;
        return {
          code: 401,
          msg: '未授权',
        } satisfies ErrorResponse;
      }

      try {
        const updated = await updateUserProfile(user.id, body);
        return updated;
      } catch (error: any) {
        set.status = 400;
        return {
          code: 400,
          msg: error.message || '更新失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Auth'],
        summary: '更新当前用户信息',
        description: '更新当前登录用户的个人信息',
      },
      body: 'auth.updateProfile',
      response: {
        200: selectUserSchema,
        401: 'auth.error',
        400: 'auth.error',
      },
    }
  )

  // 完善用户信息（注册）
  .post(
    '/wechat/register',
    async ({ body, jwt, headers, set }) => {
      const user = await verifyAuth(jwt, headers);
      if (!user) {
        set.status = 401;
        return {
          code: 401,
          msg: '未授权',
        } satisfies ErrorResponse;
      }

      try {
        const updated = await registerUser(user.id, body);
        return updated;
      } catch (error: any) {
        set.status = 400;
        return {
          code: 400,
          msg: error.message || '注册失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Auth'],
        summary: '完善用户信息',
        description: '微信登录后完善用户资料（昵称、头像等）',
      },
      body: 'auth.register',
      response: {
        200: selectUserSchema,
        401: 'auth.error',
        400: 'auth.error',
      },
    }
  );