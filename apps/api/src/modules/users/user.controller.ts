// User Controller - Elysia 实例作为控制器
import { Elysia } from 'elysia';
import { selectUserSchema } from '@juchang/db';
import { basePlugins, verifyAuth } from '../../setup';
import { userModel, type ErrorResponse } from './user.model';
import { getUserList, getUserById } from './user.service';

export const userController = new Elysia({ prefix: '/users' })
  .use(basePlugins) // 引入基础插件（包含 JWT）
  .use(userModel) // 引入 Model Plugin
  // 获取当前用户信息
  .get(
    '/me',
    async ({ set, jwt, headers }) => {
      // JWT 认证
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
        404: 'user.error',
      },
    }
  )
  

  
  // 获取用户列表
  .get(
    '/',
    async ({ query }) => {
      const result = await getUserList(query);
      return result;
    },
    {
      detail: {
        tags: ['Users'],
        summary: '获取用户列表',
        description: '分页获取用户列表',
      },
      query: 'user.paginationQuery',
      response: {
        200: 'user.listResponse',
      },
    }
  )
  
  // 获取用户详情
  .get(
    '/:id',
    async ({ params, set }) => {
      const targetUser = await getUserById(params.id);

      if (!targetUser) {
        set.status = 404;
        return {
          code: 404,
          msg: '用户不存在',
        } satisfies ErrorResponse;
      }

      return targetUser;
    },
    {
      detail: {
        tags: ['Users'],
        summary: '获取用户详情',
        description: '根据用户ID获取用户详情',
      },
      params: 'user.idParams',
      response: {
        200: selectUserSchema,
        404: 'user.error',
      },
    }
  );

