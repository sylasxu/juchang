// User Controller - Elysia 实例作为控制器
import { selectUserSchema } from '@juchang/db';
import { basePlugins, verifyAuth } from '../../setup';
import { userModel, type ErrorResponse } from './user.model';
import { Elysia } from 'elysia';
import { 
  getUserList, 
  getUserById, 
  blockUser, 
  unblockUser, 
  updateUser, 
  deleteUser,
  getUserReliability,
  getUserActivities,
  getUserParticipations,
  reportUser,
  getUserDisputes,
  appealDispute,
  getAdminUserList,
  getAdminUserById
} from './user.service';

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
        401: 'user.error',
        404: 'user.error',
      },
    }
  )

  // 更新当前用户信息
  .put(
    '/me',
    async ({ body, set, jwt, headers }) => {
      // JWT 认证
      const user = await verifyAuth(jwt, headers);
      if (!user) {
        set.status = 401;
        return {
          code: 401,
          msg: '未授权',
        } satisfies ErrorResponse;
      }

      const updated = await updateUser(user.id, body);

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
        summary: '更新当前用户信息',
        description: '更新当前登录用户的个人信息',
      },
      body: 'user.updateBody',
      response: {
        200: selectUserSchema,
        401: 'user.error',
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

  // 管理员获取用户列表（增强版）
  .get(
    '/admin',
    async ({ query }) => {
      const result = await getAdminUserList(query);
      return result;
    },
    {
      detail: {
        tags: ['Admin', 'Users'],
        summary: '管理员获取用户列表',
        description: '管理员专用的用户列表接口，包含更多筛选和排序选项',
      },
      query: 'user.adminQuery',
      response: {
        200: 'user.adminListResponse',
      },
    }
  )

  // 管理员获取用户详情（增强版）
  .get(
    '/admin/:id',
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
        tags: ['Admin', 'Users'],
        summary: '管理员获取用户详情',
        description: '管理员专用的用户详情接口，包含风险评估和统计信息',
      },
      params: 'user.idParams',
      response: {
        200: 'user.adminUserView',
        404: 'user.error',
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
  )

  // 封禁用户
  .post(
    '/:id/block',
    async ({ params, set }) => {
      try {
        const success = await blockUser(params.id);
        
        if (!success) {
          set.status = 404;
          return {
            code: 404,
            msg: '用户不存在',
          } satisfies ErrorResponse;
        }

        return {
          code: 200,
          msg: '用户已封禁',
        };
      } catch (error) {
        set.status = 500;
        return {
          code: 500,
          msg: '封禁用户失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Users'],
        summary: '封禁用户',
        description: '封禁指定用户',
      },
      params: 'user.idParams',
      response: {
        200: 'user.error',
        404: 'user.error',
        500: 'user.error',
      },
    }
  )

  // 解封用户
  .post(
    '/:id/unblock',
    async ({ params, set }) => {
      try {
        const success = await unblockUser(params.id);
        
        if (!success) {
          set.status = 404;
          return {
            code: 404,
            msg: '用户不存在',
          } satisfies ErrorResponse;
        }

        return {
          code: 200,
          msg: '用户已解封',
        };
      } catch (error) {
        set.status = 500;
        return {
          code: 500,
          msg: '解封用户失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Users'],
        summary: '解封用户',
        description: '解封指定用户',
      },
      params: 'user.idParams',
      response: {
        200: 'user.error',
        404: 'user.error',
        500: 'user.error',
      },
    }
  )

  // 更新用户
  .put(
    '/:id',
    async ({ params, body, set }) => {
      const updated = await updateUser(params.id, body);

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
        summary: '更新用户',
        description: '更新用户信息',
      },
      params: 'user.idParams',
      body: 'user.updateBody',
      response: {
        200: selectUserSchema,
        404: 'user.error',
      },
    }
  )

  // 删除用户
  .delete(
    '/:id',
    async ({ params, set }) => {
      const success = await deleteUser(params.id);

      if (!success) {
        set.status = 404;
        return {
          code: 404,
          msg: '用户不存在或删除失败',
        } satisfies ErrorResponse;
      }

      return {
        code: 200,
        msg: '用户已删除',
      };
    },
    {
      detail: {
        tags: ['Users'],
        summary: '删除用户',
        description: '删除指定用户',
      },
      params: 'user.idParams',
      response: {
        200: 'user.success',
        404: 'user.error',
      },
    }
  );



// 获取用户靠谱度详情
userController.get(
  '/:id/reliability',
  async ({ params, set }) => {
    try {
      const reliability = await getUserReliability(params.id);
      if (!reliability) {
        set.status = 404;
        return { code: 404, msg: '用户不存在' };
      }
      return reliability;
    } catch (error) {
      set.status = 500;
      return { code: 500, msg: '获取靠谱度失败' };
    }
  },
  {
    detail: {
      tags: ['Users'],
      summary: '获取用户靠谱度详情',
    },
    params: 'user.idParams',
  }
);

// 获取用户创建的活动列表
userController.get(
  '/:id/activities',
  async ({ params, query, set }) => {
    try {
      const activities = await getUserActivities(params.id, query);
      return activities;
    } catch (error) {
      set.status = 500;
      return { code: 500, msg: '获取活动列表失败' };
    }
  },
  {
    detail: {
      tags: ['Users'],
      summary: '获取用户创建的活动',
    },
    params: 'user.idParams',
    query: 'user.paginationQuery',
  }
);

// 获取用户参与的活动列表
userController.get(
  '/:id/participations',
  async ({ params, query, set }) => {
    try {
      const participations = await getUserParticipations(params.id, query);
      return participations;
    } catch (error) {
      set.status = 500;
      return { code: 500, msg: '获取参与记录失败' };
    }
  },
  {
    detail: {
      tags: ['Users'],
      summary: '获取用户参与的活动',
    },
    params: 'user.idParams',
    query: 'user.paginationQuery',
  }
);

// 举报用户
userController.post(
  '/:id/report',
  async ({ params, body, set, jwt, headers }) => {
    const user = await verifyAuth(jwt, headers);
    if (!user) {
      set.status = 401;
      return { code: 401, msg: '未授权' };
    }

    try {
      await reportUser(params.id, user.id, body);
      return { msg: '举报已提交' };
    } catch (error: any) {
      set.status = 400;
      return { code: 400, msg: error.message || '举报失败' };
    }
  },
  {
    detail: {
      tags: ['Users'],
      summary: '举报用户',
    },
    params: 'user.idParams',
    body: 'user.reportBody',
  }
);

// 获取我的争议记录
userController.get(
  '/me/disputes',
  async ({ query, set, jwt, headers }) => {
    const user = await verifyAuth(jwt, headers);
    if (!user) {
      set.status = 401;
      return { code: 401, msg: '未授权' };
    }

    try {
      const disputes = await getUserDisputes(user.id, query);
      return disputes;
    } catch (error) {
      set.status = 500;
      return { code: 500, msg: '获取争议记录失败' };
    }
  },
  {
    detail: {
      tags: ['Users'],
      summary: '获取我的争议记录',
    },
    query: 'user.paginationQuery',
  }
);

// 申诉履约争议
userController.post(
  '/me/appeal',
  async ({ body, set, jwt, headers }) => {
    const user = await verifyAuth(jwt, headers);
    if (!user) {
      set.status = 401;
      return { code: 401, msg: '未授权' };
    }

    try {
      await appealDispute(user.id, body);
      return { msg: '申诉已提交' };
    } catch (error: any) {
      set.status = 400;
      return { code: 400, msg: error.message || '申诉失败' };
    }
  },
  {
    detail: {
      tags: ['Users'],
      summary: '申诉履约争议',
    },
    body: 'user.appealBody',
  }
);