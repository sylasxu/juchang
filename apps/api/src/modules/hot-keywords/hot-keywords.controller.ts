// Hot Keywords Controller - 热词相关接口 (v4.8 Digital Ascension)
import { Elysia } from 'elysia';
import { basePlugins, verifyAuth } from '../../setup';
import { hotKeywordsModel, type ErrorResponse } from './hot-keywords.model';
import {
  getActiveHotKeywords,
  createKeyword,
  updateKeyword,
  deleteKeyword,
  listKeywords,
  getKeywordAnalytics,
} from './hot-keywords.service';

export const hotKeywordsController = new Elysia({ prefix: '/hot-keywords' })
  .use(basePlugins)
  .use(hotKeywordsModel)

  // ==========================================
  // 获取热词列表（小程序使用）
  // ==========================================
  .get(
    '/',
    async ({ query, set }) => {
      try {
        const keywords = await getActiveHotKeywords(query);
        return { data: keywords };
      } catch (error: any) {
        set.status = 500;
        return {
          code: 500,
          msg: error.message || '获取热词列表失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Hot Keywords'],
        summary: '获取热词列表',
        description: '获取活跃的热词列表，用于小程序 Hot Chips 显示',
      },
      query: 'hotKeywords.query',
      response: {
        200: 'hotKeywords.listResponse',
        500: 'hotKeywords.error',
      },
    }
  )

  // ==========================================
  // Admin API：获取所有热词
  // ==========================================
  .get(
    '/admin',
    async ({ query, set, jwt, headers }) => {
      const user = await verifyAuth(jwt, headers);
      if (!user) {
        set.status = 401;
        return {
          code: 401,
          msg: '未授权',
        } satisfies ErrorResponse;
      }

      try {
        const keywords = await listKeywords(query);
        return { data: keywords };
      } catch (error: any) {
        set.status = 500;
        return {
          code: 500,
          msg: error.message || '获取热词列表失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Hot Keywords - Admin'],
        summary: 'Admin 获取所有热词',
        description: '获取所有热词列表，支持筛选（需要认证）',
      },
      query: 'hotKeywords.adminQuery',
      response: {
        200: 'hotKeywords.adminListResponse',
        401: 'hotKeywords.error',
        500: 'hotKeywords.error',
      },
    }
  )

  // ==========================================
  // Admin API：创建热词
  // ==========================================
  .post(
    '/admin',
    async ({ body, set, jwt, headers }) => {
      const user = await verifyAuth(jwt, headers);
      if (!user) {
        set.status = 401;
        return {
          code: 401,
          msg: '未授权',
        } satisfies ErrorResponse;
      }

      try {
        const keyword = await createKeyword(body, user.id);
        return { data: keyword };
      } catch (error: any) {
        set.status = 400;
        return {
          code: 400,
          msg: error.message || '创建热词失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Hot Keywords - Admin'],
        summary: 'Admin 创建热词',
        description: '创建新的热词（需要认证）',
      },
      body: 'hotKeywords.createRequest',
      response: {
        200: 'hotKeywords.createResponse',
        400: 'hotKeywords.error',
        401: 'hotKeywords.error',
      },
    }
  )

  // ==========================================
  // Admin API：更新热词
  // ==========================================
  .patch(
    '/admin/:id',
    async ({ params, body, set, jwt, headers }) => {
      const user = await verifyAuth(jwt, headers);
      if (!user) {
        set.status = 401;
        return {
          code: 401,
          msg: '未授权',
        } satisfies ErrorResponse;
      }

      try {
        const keyword = await updateKeyword(params.id, body);
        return { data: keyword };
      } catch (error: any) {
        set.status = 400;
        return {
          code: 400,
          msg: error.message || '更新热词失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Hot Keywords - Admin'],
        summary: 'Admin 更新热词',
        description: '更新热词信息（需要认证）',
      },
      params: 'hotKeywords.idParams',
      body: 'hotKeywords.updateRequest',
      response: {
        200: 'hotKeywords.updateResponse',
        400: 'hotKeywords.error',
        401: 'hotKeywords.error',
      },
    }
  )

  // ==========================================
  // Admin API：删除热词
  // ==========================================
  .delete(
    '/admin/:id',
    async ({ params, set, jwt, headers }) => {
      const user = await verifyAuth(jwt, headers);
      if (!user) {
        set.status = 401;
        return {
          code: 401,
          msg: '未授权',
        } satisfies ErrorResponse;
      }

      try {
        await deleteKeyword(params.id);
        return { success: true };
      } catch (error: any) {
        set.status = 400;
        return {
          code: 400,
          msg: error.message || '删除热词失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Hot Keywords - Admin'],
        summary: 'Admin 删除热词',
        description: '删除热词（软删除，需要认证）',
      },
      params: 'hotKeywords.idParams',
      response: {
        200: 'hotKeywords.deleteResponse',
        400: 'hotKeywords.error',
        401: 'hotKeywords.error',
      },
    }
  )

  // ==========================================
  // Admin API：获取热词分析
  // ==========================================
  .get(
    '/admin/analytics',
    async ({ query, set, jwt, headers }) => {
      const user = await verifyAuth(jwt, headers);
      if (!user) {
        set.status = 401;
        return {
          code: 401,
          msg: '未授权',
        } satisfies ErrorResponse;
      }

      try {
        const analytics = await getKeywordAnalytics(query.period);
        return { data: analytics };
      } catch (error: any) {
        set.status = 500;
        return {
          code: 500,
          msg: error.message || '获取分析数据失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Hot Keywords - Admin'],
        summary: 'Admin 获取热词分析',
        description: '获取热词分析数据（需要认证）',
      },
      query: 'hotKeywords.analyticsQuery',
      response: {
        200: 'hotKeywords.analyticsResponse',
        401: 'hotKeywords.error',
        500: 'hotKeywords.error',
      },
    }
  );
