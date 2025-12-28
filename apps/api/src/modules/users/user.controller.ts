// User Controller - 用户管理接口 (纯 RESTful)
import { Elysia } from 'elysia';
import { basePlugins } from '../../setup';
import { 
  userModel, 
  UserResponseSchema,
  UserListResponseSchema,
  type ErrorResponse 
} from './user.model';
import { 
  getUserById, 
  getUserList, 
  updateUser,
  getQuota
} from './user.service';

export const userController = new Elysia({ prefix: '/users' })
  .use(basePlugins)
  .use(userModel)

  // 获取用户列表 (分页、搜索)
  .get(
    '/',
    async ({ query }) => {
      return await getUserList(query);
    },
    {
      detail: {
        tags: ['Users'],
        summary: '获取用户列表',
        description: '获取分页用户列表，支持按昵称或手机号搜索',
      },
      query: 'user.listQuery',
      response: {
        200: UserListResponseSchema,
      },
    }
  )

  // 获取用户详情
  .get(
    '/:id',
    async ({ params, set }) => {
      const user = await getUserById(params.id, { excludeSensitive: true });
      if (!user) {
        set.status = 404;
        return { code: 404, msg: '用户不存在' } satisfies ErrorResponse;
      }
      return user;
    },
    {
      detail: {
        tags: ['Users'],
        summary: '获取用户详情',
        description: '根据 ID 获取用户详细信息',
      },
      response: {
        200: UserResponseSchema,
        404: 'user.error',
      },
    }
  )

  // 更新用户信息
  .put(
    '/:id',
    async ({ params, body, set }) => {
      const updated = await updateUser(params.id, body);
      if (!updated) {
        set.status = 404;
        return { code: 404, msg: '用户不存在' } satisfies ErrorResponse;
      }
      return updated;
    },
    {
      detail: {
        tags: ['Users'],
        summary: '更新用户信息',
        description: '更新指定用户的昵称和头像',
      },
      body: 'user.updateRequest',
      response: {
        200: UserResponseSchema,
        404: 'user.error',
      },
    }
  )

  // 获取用户额度
  .get(
    '/:id/quota',
    async ({ params, set }) => {
      const quota = await getQuota(params.id);
      if (!quota) {
        set.status = 404;
        return { code: 404, msg: '用户不存在' } satisfies ErrorResponse;
      }
      return quota;
    },
    {
      detail: {
        tags: ['Users'],
        summary: '获取用户额度',
        description: '获取指定用户今日剩余的 AI 创建额度',
      },
      response: {
        200: 'user.quotaResponse',
        404: 'user.error',
      },
    }
  );
