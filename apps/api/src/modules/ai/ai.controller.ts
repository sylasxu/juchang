// AI Controller - MVP 简化版：只保留 parse 功能（SSE）
import { Elysia } from 'elysia';
import { basePlugins, verifyAuth } from '../../setup';
import { aiModel } from './ai.model';
import { checkAIQuota, consumeAIQuota, parseTextStream, parseAIResponse } from './ai.service';

export const aiController = new Elysia({ prefix: '/ai' })
  .use(basePlugins)
  .use(aiModel)
  
  // AI 解析 - SSE 流式响应
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
  );
