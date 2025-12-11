// AI Controller - AI 功能控制器
import { Elysia, t } from 'elysia';
import { basePlugins, verifyAuth } from '../../setup';
import { aiModel, type ErrorResponse } from './ai.model';
import { 
  checkUserAIQuota, 
  consumeAICreateQuota, 
  consumeAIChatQuota,
  parseActivityWithAI,
  processChatWithAI,
  processChatStreamWithAI 
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
  
  // AI 对话（普通响应）
  .post(
    '/chat',
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
      const hasQuota = await consumeAIChatQuota(user.id);
      if (!hasQuota) {
        set.status = 403;
        return {
          code: 403,
          msg: 'AI 对话额度不足',
        } satisfies ErrorResponse;
      }
      
      try {
        const result = await processChatWithAI(body);
        return result;
      } catch (error) {
        set.status = 500;
        return {
          code: 500,
          msg: 'AI 对话失败，请稍后重试',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['AI'],
        summary: 'AI 对话',
        description: 'AI 助手对话，支持活动推荐、信息查询等功能',
      },
      body: 'ai.chatRequest',
      response: {
        200: 'ai.chatResponse',
        403: 'ai.error',
        500: 'ai.error',
      },
    }
  )
  
  // AI 流式对话（根据 Elysia AI SDK 文档）
  .post(
    '/chat/stream',
    async ({ body, set, jwt, headers }) => {
      // JWT 认证
      const user = await verifyAuth(jwt, headers);
      if (!user) {
        set.status = 403;
        return {
          code: 401,
          msg: '未授权',
        } satisfies ErrorResponse;
      }

      // 检查并消耗额度
      const hasQuota = await consumeAIChatQuota(user.id);
      if (!hasQuota) {
        set.status = 403;
        return {
          code: 403,
          msg: 'AI 对话额度不足',
        } satisfies ErrorResponse;
      }
      
      try {
        const stream = await processChatStreamWithAI(body);
        // 根据 Elysia 文档，直接返回 textStream
        return stream.textStream;
      } catch (error) {
        set.status = 500;
        return {
          code: 500,
          msg: 'AI 流式对话失败，请稍后重试',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['AI'],
        summary: 'AI 流式对话',
        description: 'AI 助手流式对话，实时返回响应内容',
      },
      body: 'ai.chatRequest',
      response: {
        200: t.Any({ description: '流式文本响应' }),
        403: 'ai.error',
        500: 'ai.error',
      },
    }
  );