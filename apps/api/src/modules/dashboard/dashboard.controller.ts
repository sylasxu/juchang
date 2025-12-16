// Dashboard Controller - Elysia 实例作为控制器
import { Elysia } from 'elysia';
import { basePlugins } from '../../setup';
import { dashboardModel, type ErrorResponse } from './dashboard.model';
import { getDashboardStats, getRecentActivities, getRiskUsers } from './dashboard.service';

export const dashboardController = new Elysia({ prefix: '/dashboard' })
  .use(basePlugins) // 引入基础插件
  .use(dashboardModel) // 引入 Model Plugin
  
  // 获取仪表板统计数据
  .get(
    '/stats',
    async ({ set }) => {
      try {
        const stats = await getDashboardStats();
        return stats;
      } catch (error) {
        console.error('获取统计数据失败:', error);
        set.status = 500;
        return {
          code: 500,
          msg: '获取统计数据失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Dashboard'],
        summary: '获取仪表板统计数据',
        description: '获取平台核心统计指标',
      },
      response: {
        200: 'dashboard.stats',
        500: 'dashboard.error',
      },
    }
  )

  // 获取最近活动
  .get(
    '/activities',
    async ({ set }) => {
      try {
        const activities = await getRecentActivities();
        return activities;
      } catch (error) {
        console.error('获取最近活动失败:', error);
        set.status = 500;
        return {
          code: 500,
          msg: '获取最近活动失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Dashboard'],
        summary: '获取最近活动',
        description: '获取最近创建的活动列表',
      },
      response: {
        200: 'dashboard.recentActivities',
        500: 'dashboard.error',
      },
    }
  )

  // 获取风险用户
  .get(
    '/users',
    async ({ set }) => {
      try {
        const riskUsers = await getRiskUsers();
        return riskUsers;
      } catch (error) {
        console.error('获取风险用户失败:', error);
        set.status = 500;
        return {
          code: 500,
          msg: '获取风险用户失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Dashboard'],
        summary: '获取风险用户',
        description: '获取需要关注的风险用户列表',
      },
      response: {
        200: 'dashboard.riskUsers',
        500: 'dashboard.error',
      },
    }
  );


// 获取用户个人统计
dashboardController.get(
  '/user-stats',
  async ({ set, jwt, headers }) => {
    const { verifyAuth } = await import('../../setup');
    const user = await verifyAuth(jwt, headers);
    if (!user) {
      set.status = 401;
      return { code: 401, msg: '未授权' };
    }

    try {
      const { getUserStats } = await import('./dashboard.service');
      const stats = await getUserStats(user.id);
      return stats;
    } catch (error) {
      set.status = 500;
      return { code: 500, msg: '获取用户统计失败' };
    }
  },
  {
    detail: {
      tags: ['Dashboard'],
      summary: '获取用户个人统计',
      description: '获取当前用户的个人统计数据',
    },
  }
);