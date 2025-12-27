// AI Controller - v3.2 Chat-First: AI 解析 + 对话历史管理
import { Elysia } from 'elysia';
import { basePlugins, verifyAuth } from '../../setup';
import { aiModel, type ErrorResponse } from './ai.model';
import { 
  checkAIQuota, 
  consumeAIQuota, 
  parseTextStream, 
  parseAIResponse,
  getConversations,
  addUserMessage,
  clearConversations,
} from './ai.service';

export const aiController = new Elysia({ prefix: '/ai' })
  .use(basePlugins)
  .use(aiModel)
  
  // ==========================================
  // AI 解析 - SSE 流式响应
  // ==========================================
  .post(
    '/parse',
    async function* ({ body, set, jwt, headers }) {
      // JWT 认证
      const user = await verifyAuth(jwt, headers);
      if (!user) {
        set.status = 401;
        yield JSON.stringify({ code: 401, msg: '未授权' });
        return;
      }

      // 检查额度
      const quota = await checkAIQuota(user.id);
      if (!quota.hasQuota) {
        set.status = 403;
        yield JSON.stringify({ 
          code: 403, 
          msg: 'AI 额度不足，今日已用完',
          remaining: 0,
        });
        return;
      }

      // 消耗额度
      const consumed = await consumeAIQuota(user.id);
      if (!consumed) {
        set.status = 403;
        yield JSON.stringify({ code: 403, msg: 'AI 额度扣减失败' });
        return;
      }

      try {
        // 获取流式响应
        const stream = await parseTextStream(body);
        let fullText = '';
        
        // 流式输出
        for await (const chunk of stream.textStream) {
          fullText += chunk;
          yield `data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`;
        }
        
        // 解析最终结果
        const result = parseAIResponse(fullText);
        yield `data: ${JSON.stringify({ type: 'done', result, remaining: quota.remaining - 1 })}\n\n`;
        
      } catch (error) {
        console.error('AI 解析失败:', error);
        yield `data: ${JSON.stringify({ type: 'error', msg: 'AI 解析失败，请稍后重试' })}\n\n`;
      }
    },
    {
      detail: {
        tags: ['AI'],
        summary: 'AI 意图解析（SSE）',
        description: '解析自然语言文本，生成活动信息。使用 SSE 流式返回结果。',
      },
      body: 'ai.parseRequest',
    }
  )
  
  // ==========================================
  // 对话历史管理 (v3.2 新增)
  // ==========================================
  
  // 获取对话历史（分页）
  .get(
    '/conversations',
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
        const result = await getConversations(user.id, query);
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
        description: '获取当前用户与 AI 的对话历史，支持分页。按时间倒序返回。',
      },
      query: 'ai.conversationsQuery',
      response: {
        200: 'ai.conversationsResponse',
        401: 'ai.error',
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
