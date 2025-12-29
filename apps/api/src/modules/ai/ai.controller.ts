// AI Controller - v3.4 统一 AI Chat 接口 (Data Stream Protocol)
import { Elysia, t } from 'elysia';
import { basePlugins, verifyAuth } from '../../setup';
import { aiModel, type ErrorResponse } from './ai.model';
import { 
  checkAIQuota, 
  consumeAIQuota, 
  streamChat,
  getConversations,
  addUserMessage,
  clearConversations,
} from './ai.service';

export const aiController = new Elysia({ prefix: '/ai' })
  .use(basePlugins)
  .use(aiModel)
  
  // ==========================================
  // DeepSeek 余额查询 (Admin Playground 用)
  // ==========================================
  .get(
    '/balance',
    async ({ set }) => {
      const apiKey = process.env.DEEPSEEK_API_KEY;
      
      if (!apiKey) {
        set.status = 500;
        return { code: 500, msg: 'DeepSeek API Key 未配置' };
      }

      try {
        const response = await fetch('https://api.deepseek.com/user/balance', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
        });

        if (!response.ok) {
          set.status = response.status;
          return { code: response.status, msg: '余额查询失败' };
        }

        const data = await response.json();
        return data;
      } catch (error: any) {
        set.status = 500;
        return { code: 500, msg: error.message || '余额查询失败' };
      }
    },
    {
      detail: {
        tags: ['AI'],
        summary: '查询 DeepSeek 余额',
        description: '查询 DeepSeek API 账户余额（Admin Playground 用）',
      },
      response: {
        200: t.Object({
          is_available: t.Boolean(),
          balance_infos: t.Array(t.Object({
            currency: t.String(),
            total_balance: t.String(),
            granted_balance: t.String(),
            topped_up_balance: t.String(),
          })),
        }),
        500: 'ai.error',
      },
    }
  )
  
  // ==========================================
  // 统一 AI Chat 接口 - Data Stream Protocol
  // 小程序和 Admin 都用这个接口
  // ==========================================
  .post(
    '/chat',
    async ({ body, set, jwt, headers }) => {
      // 解析请求参数
      const { messages, source = 'miniprogram', mockUserId, mockLocation } = body;
      
      // 获取用户身份
      const user = await verifyAuth(jwt, headers);
      
      // Admin 可以 mock 用户（用于测试）
      const effectiveUserId = (source === 'admin' && mockUserId) ? mockUserId : user?.id || null;
      const effectiveLocation = mockLocation || body.location;
      
      // 有真实用户时检查额度（Admin mock 不消耗额度）
      if (user && source !== 'admin') {
        const quota = await checkAIQuota(user.id);
        if (!quota.hasQuota) {
          set.status = 403;
          return { error: 'AI 额度不足，今日已用完' };
        }

        const consumed = await consumeAIQuota(user.id);
        if (!consumed) {
          set.status = 403;
          return { error: 'AI 额度扣减失败' };
        }
      }

      try {
        // 获取 Data Stream Response
        const response = await streamChat({
          messages,
          userId: effectiveUserId,
          location: effectiveLocation,
          source,
        });
        
        return response;
      } catch (error: any) {
        console.error('AI Chat 失败:', error);
        set.status = 500;
        return { error: error.message || 'AI 服务暂时不可用' };
      }
    },
    {
      detail: {
        tags: ['AI'],
        summary: 'AI 对话（Data Stream）',
        description: `统一的 AI 对话接口，返回 Vercel AI SDK Data Stream 格式。
        
小程序和 Admin 都使用此接口：
- 小程序：传 JWT Token，正常消耗额度
- Admin：传 source='admin'，可 mock 用户测试，不消耗额度

Data Stream 格式：
- 0:"text" - 文本增量
- 9:{...} - Tool Call
- a:{...} - Tool Result  
- d:{...} - 完成信息（含 usage）`,
      },
      body: t.Object({
        messages: t.Array(t.Object({
          role: t.Union([t.Literal('user'), t.Literal('assistant')]),
          content: t.String(),
        })),
        location: t.Optional(t.Tuple([t.Number(), t.Number()])),
        source: t.Optional(t.Union([t.Literal('miniprogram'), t.Literal('admin')])),
        mockUserId: t.Optional(t.String()),
        mockLocation: t.Optional(t.Tuple([t.Number(), t.Number()])),
      }),
    }
  )
  
  // ==========================================
  // 对话历史管理 (v3.2 新增)
  // ==========================================
  
  // 获取对话历史（分页）
  // 支持两种模式：
  // 1. 有 JWT：查询当前用户的对话
  // 2. 无 JWT：Admin 模式，可查询所有用户的对话
  .get(
    '/conversations',
    async ({ query, set, jwt, headers }) => {
      const user = await verifyAuth(jwt, headers);
      
      // Admin 模式：无 JWT 时查询所有用户
      const userId = user?.id || 'admin';

      try {
        const result = await getConversations(userId, query);
        return result;
      } catch (error: any) {
        set.status = 500;
        return {
          code: 500,
          msg: error.message || '获取对话历史失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['AI'],
        summary: '获取 AI 对话历史',
        description: '获取对话历史，支持分页。有 JWT 时查当前用户，无 JWT 时查所有用户（Admin 模式）。',
      },
      query: 'ai.conversationsQuery',
      response: {
        200: 'ai.conversationsResponse',
        500: 'ai.error',
      },
    }
  )
  
  // 添加用户消息
  .post(
    '/conversations',
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
        const result = await addUserMessage(user.id, body.content);
        return {
          id: result.id,
          msg: '消息已添加',
        };
      } catch (error: any) {
        set.status = 400;
        return {
          code: 400,
          msg: error.message || '添加消息失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['AI'],
        summary: '添加用户消息到对话',
        description: '将用户发送的文本消息添加到对话历史中。',
      },
      body: 'ai.addMessageRequest',
      response: {
        200: 'ai.addMessageResponse',
        400: 'ai.error',
        401: 'ai.error',
      },
    }
  )
  
  // 清空对话历史（开始新对话）
  .delete(
    '/conversations',
    async ({ set, jwt, headers }) => {
      const user = await verifyAuth(jwt, headers);
      if (!user) {
        set.status = 401;
        return {
          code: 401,
          msg: '未授权',
        } satisfies ErrorResponse;
      }

      try {
        const result = await clearConversations(user.id);
        return {
          success: true,
          msg: '对话已清空',
          deletedCount: result.deletedCount,
        };
      } catch (error: any) {
        set.status = 500;
        return {
          code: 500,
          msg: error.message || '清空对话失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['AI'],
        summary: '清空对话历史',
        description: '清空当前用户的所有对话历史，开始新对话。',
      },
      response: {
        200: 'ai.clearConversationsResponse',
        401: 'ai.error',
        500: 'ai.error',
      },
    }
  );
