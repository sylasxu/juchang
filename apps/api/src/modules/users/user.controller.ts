// User Controller - 用户相关接口 (MVP 简化版)
// 只保留 /users/me, PATCH /users/me, /users/me/quota
import { Elysia } from 'elysia';
import { selectUserSchema } from '@juchang/db';
import { basePlugins, verifyAuth } from '../../setup';
import { userModel, type ErrorResponse, AdminUserSchema, UserListQuerySchema, UserListResponseSchema, UpdateUserRequestSchema } from './user.model';
import { getUserById, updateProfile, getQuota, getUserList, getAdminUserById, adminUpdateUser } from './user.service';

export const userController = new Elysia({ prefix: '/users' })
  .use(basePlugins)
  .use(userModel)

  // 获取当前用户信息
  .get(
    '/me',
    async ({ set, jwt, headers }) => {
      const user = await verifyAuth(jwt, headers);
      if (!user) {
        set.status = 401;
        return {
          code: 401,
          msg: '未授权',
        } satisfies ErrorResponse;
      }

      const currentUser = await getUserById(user.id);
      if (!currentUser) {
        set.status = 404;
        return {
          code: 404,
          msg: '用户不存在',
        } satisfies ErrorResponse;
      }

      return currentUser;
    },
    {
      detail: {
        tags: ['Users'],
        summary: '获取当前用户信息',
        description: '获取当前登录用户的详细信息',
      },
      response: {
        200: selectUserSchema,
        401: 'user.error',
        404: 'user.error',
      },
    }
  )

  // 更新当前用户资料
  .patch(
    '/me',
    async ({ body, set, jwt, headers }) => {
      const user = await verifyAuth(jwt, headers);
      if (!user) {
        set.status = 401;
        return {
          code: 401,
          msg: '未授权',
        } satisfies ErrorResponse;
      }

      const updated = await updateProfile(user.id, body);
      if (!updated) {
        set.status = 404;
        return {
          code: 404,
          msg: '用户不存在',
        } satisfies ErrorResponse;
      }

      return updated;
    },
    {
      detail: {
        tags: ['Users'],
        summary: '更新当前用户资料',
        description: '更新当前登录用户的昵称和头像',
      },
      body: 'user.updateProfile',
      response: {
        200: selectUserSchema,
        401: 'user.error',
        404: 'user.error',
      },
    }
  )

  // 获取今日额度
  .get(
    '/me/quota',
    async ({ set, jwt, headers }) => {
      const user = await verifyAuth(jwt, headers);
      if (!user) {
        set.status = 401;
        return {
          code: 401,
          msg: '未授权',
        } satisfies ErrorResponse;
      }

      const quota = await getQuota(user.id);
      if (!quota) {
        set.status = 404;
        return {
          code: 404,
          msg: '用户不存在',
        } satisfies ErrorResponse;
      }

      return quota;
    },
    {
      detail: {
        tags: ['Users'],
        summary: '获取今日额度',
        description: '获取当前用户今日剩余的 AI 创建额度',
      },
      response: {
        200: 'user.quotaResponse',
        401: 'user.error',
        404: 'user.error',
      },
    }
  )

  // ============ Admin Endpoints ============

  // Admin: 获取用户列表
  // Requirements: 1.1, 1.2, 1.3, 1.5
  .get(
    '/',
    async ({ query }) => {
      const result = await getUserList(query);
      return result;
    },
    {
      detail: {
        tags: ['Admin - Users'],
        summary: '获取用户列表',
        description: 'Admin 获取分页用户列表，支持搜索',
      },
      query: UserListQuerySchema,
      response: {
        200: UserListResponseSchema,
      },
    }
  )

  // Admin: 获取用户详情
  // Requirements: 2.1, 2.2, 2.3
  .get(
    '/:id',
    async ({ params, set }) => {
      const user = await getAdminUserById(params.id);
      if (!user) {
        set.status = 404;
        return {
          code: 404,
          msg: '用户不存在',
        } satisfies ErrorResponse;
      }
      return user;
    },
    {
      detail: {
        tags: ['Admin - Users'],
        summary: '获取用户详情',
        description: 'Admin 获取指定用户的详细信息（排除敏感字段）',
      },
      response: {
        200: AdminUserSchema,
        404: 'user.error',
      },
    }
  )

  // Admin: 更新用户信息
  // Requirements: 3.1, 3.2, 3.3
  .put(
    '/:id',
    async ({ params, body, set }) => {
      const updated = await adminUpdateUser(params.id, body);
      if (!updated) {
        set.status = 404;
        return {
          code: 404,
          msg: '用户不存在',
        } satisfies ErrorResponse;
      }
      return updated;
    },
    {
      detail: {
        tags: ['Admin - Users'],
        summary: '更新用户信息',
        description: 'Admin 更新指定用户的昵称和头像',
      },
      body: UpdateUserRequestSchema,
      response: {
        200: AdminUserSchema,
        404: 'user.error',
      },
    }
  );
