// User Controller - Elysia 实例作为控制器
import { Elysia } from 'elysia';
import { selectUserSchema } from '@juchang/db';
import { userModel, type ErrorResponse } from './user.model';
import { getUserList, getUserById } from './user.service';

export const userController = new Elysia({ prefix: '/users' })
  .use(userModel) // 引入 DTO
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
  .get(
    '/:id',
    async ({ params, set }) => {
      const user = await getUserById(params.id);

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

