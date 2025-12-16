// AI Controller - AI 功能控制器
import { Elysia, t } from 'elysia';
import { basePlugins, verifyAuth } from '../../setup';
import { aiModel, type ErrorResponse } from './ai.model';
import { 
  checkUserAIQuota, 
  consumeAICreateQuota, 
  consumeAISearchQuota,
  parseActivityWithAI,
  parseInputWithAI,
  processSearchWithAI,
  generateUserRiskReport
} from './ai.service';

export const aiController = new Elysia({ prefix: '/ai' })
  .use(basePlugins) // 引入基础插件（包含 JWT）
  .use(aiModel) // 引入 Model Plugin
  
  // 获取用户 AI 额度状态
  .get(
    '/quota',
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

      const quota = await checkUserAIQuota(user.id);
      
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
        tags: ['AI'],
        summary: '获取 AI 额度状态',
        description: '查看用户当前的 AI 创建和对话额度',
      },
      response: {
        200: 'ai.quotaStatus',
        404: 'ai.error',
      },
    }
  )
  
  // AI 创建活动
  .post(
    '/create-activity',
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

      // 检查并消耗额度
      const hasQuota = await consumeAICreateQuota(user.id);
      if (!hasQuota) {
        set.status = 403;
        return {
          code: 403,
          msg: 'AI 创建活动额度不足',
        } satisfies ErrorResponse;
      }
      
      try {
        const result = await parseActivityWithAI(body);
        return result;
      } catch (error) {
        set.status = 500;
        return {
          code: 500,
          msg: 'AI 解析失败，请稍后重试',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['AI'],
        summary: 'AI 创建活动',
        description: '使用自然语言描述创建活动，AI 自动解析并生成活动信息',
      },
      body: 'ai.createActivityRequest',
      response: {
        200: 'ai.createActivityResponse',
        403: 'ai.error',
        500: 'ai.error',
      },
    }
  )
  
  // AI 搜索（地图筛选）
  .post(
    '/search',
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

      // 检查并消耗额度
      const hasQuota = await consumeAISearchQuota(user.id);
      if (!hasQuota) {
        set.status = 403;
        return {
          code: 403,
          msg: 'AI 搜索额度不足',
        } satisfies ErrorResponse;
      }
      
      try {
        const result = await processSearchWithAI(body);
        return result;
      } catch (error) {
        set.status = 500;
        return {
          code: 500,
          msg: 'AI 搜索失败，请稍后重试',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['AI'],
        summary: 'AI 智能搜索',
        description: '使用自然语言搜索活动，返回地图筛选条件',
      },
      body: 'ai.searchRequest',
      response: {
        200: 'ai.searchResponse',
        403: 'ai.error',
        500: 'ai.error',
      },
    }
  )
  
  // AI 解析（魔法输入框）
  .post(
    '/parse',
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

      // 检查并消耗额度
      const hasQuota = await consumeAICreateQuota(user.id);
      if (!hasQuota) {
        set.status = 403;
        return {
          code: 403,
          msg: 'AI 解析额度不足',
        } satisfies ErrorResponse;
      }
      
      try {
        const result = await parseInputWithAI(body);
        return result;
      } catch (error) {
        set.status = 500;
        return {
          code: 500,
          msg: 'AI 解析失败，请稍后重试',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['AI'],
        summary: 'AI 意图解析',
        description: '解析自然语言或粘贴文本，生成活动信息',
      },
      body: 'ai.parseRequest',
      response: {
        200: 'ai.parseResponse',
        403: 'ai.error',
        500: 'ai.error',
      },
    }
  )
  
  // 用户深度风控报告（付费功能）
  .post(
    '/user-report',
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

      // TODO: 检查用户是否有权限使用此功能（Pro会员或付费）
      
      try {
        const result = await generateUserRiskReport(body);
        return result;
      } catch (error) {
        set.status = 500;
        return {
          code: 500,
          msg: 'AI 风控分析失败，请稍后重试',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['AI'],
        summary: '用户深度风控报告',
        description: '生成用户的详细履约分析和风险评估报告（付费功能）',
      },
      body: 'ai.userReportRequest',
      response: {
        200: 'ai.userReportResponse',
        401: 'ai.error',
        500: 'ai.error',
      },
    }
  );