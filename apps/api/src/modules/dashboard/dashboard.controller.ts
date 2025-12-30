// Dashboard Controller - MVP 简化版：只保留 Admin 基础统计
import { Elysia } from 'elysia';
import { basePlugins } from '../../setup';
import { dashboardModel, type ErrorResponse } from './dashboard.model';
import { getDashboardStats, getRecentActivities, getUserGrowthTrend, getActivityTypeDistribution, getGeographicDistribution } from './dashboard.service';

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
  )

  // 获取用户增长趋势
  .get(
    '/userGrowth',
    async ({ query, set }) => {
      try {
        const days = query.days ? parseInt(query.days) : 30;
        const data = await getUserGrowthTrend(days);
        return data;
      } catch (error) {
        console.error('获取用户增长趋势失败:', error);
        set.status = 500;
        return { code: 500, msg: '获取用户增长趋势失败' } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Dashboard'],
        summary: '获取用户增长趋势',
        description: '获取过去N天的用户增长数据',
      },
      response: {
        200: 'dashboard.userGrowth',
        500: 'dashboard.error',
      },
    }
  )

  // 获取活动类型分布
  .get(
    '/activityTypes',
    async ({ set }) => {
      try {
        const data = await getActivityTypeDistribution();
        return data;
      } catch (error) {
        console.error('获取活动类型分布失败:', error);
        set.status = 500;
        return { code: 500, msg: '获取活动类型分布失败' } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Dashboard'],
        summary: '获取活动类型分布',
        description: '获取各类型活动的数量分布',
      },
      response: {
        200: 'dashboard.activityTypes',
        500: 'dashboard.error',
      },
    }
  )

  // 获取地理分布
  .get(
    '/geographic',
    async ({ set }) => {
      try {
        const data = await getGeographicDistribution();
        return data;
      } catch (error) {
        console.error('获取地理分布失败:', error);
        set.status = 500;
        return { code: 500, msg: '获取地理分布失败' } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Dashboard'],
        summary: '获取地理分布',
        description: '获取用户和活动的地理分布数据',
      },
      response: {
        200: 'dashboard.geographic',
        500: 'dashboard.error',
      },
    }
  );
