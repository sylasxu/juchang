// Dashboard Controller - MVP 简化版：只保留 Admin 基础统计
import { Elysia } from 'elysia';
import { basePlugins } from '../../setup';
import { dashboardModel, type ErrorResponse } from './dashboard.model';
import { getDashboardStats, getRecentActivities } from './dashboard.service';

export const dashboardController = new Elysia({ prefix: '/dashboard' })
  .use(basePlugins)
  .use(dashboardModel)
  
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
        return { code: 500, msg: '获取统计数据失败' } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Dashboard'],
        summary: '获取仪表板统计数据',
        description: '获取平台核心统计指标（Admin 用）',
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
        return { code: 500, msg: '获取最近活动失败' } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Dashboard'],
        summary: '获取最近活动',
        description: '获取最近创建的活动列表（Admin 用）',
      },
      response: {
        200: 'dashboard.recentActivities',
        500: 'dashboard.error',
      },
    }
  );
