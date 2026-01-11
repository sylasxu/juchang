/**
 * Intent Classifier - 意图分类器
 * 
 * 混合分类：规则优先，LLM 兜底
 */

import { generateText } from 'ai';
import { getModel } from '../models/router';
import type { IntentType, ClassifyResult, ClassifyContext } from './types';
import { intentPatterns, intentPriority, draftModifyPatterns } from './definitions';

/**
 * 混合意图分类（纯函数）
 * 
 * 1. 规则匹配（快速，无延迟）
 * 2. 草稿上下文检查
 * 3. LLM 兜底（仅在 unknown 时）
 * 
 * @param message - 用户消息
 * @param context - 分类上下文
 * @returns 分类结果
 */
export async function classifyIntent(
  message: string,
  context: ClassifyContext
): Promise<ClassifyResult> {
  // 1. 规则匹配
  const regexResult = classifyByRegex(message);
  if (regexResult.intent !== 'unknown') {
    console.log(`[Intent Regex] ${regexResult.intent}`);
    return regexResult;
  }

  // 2. 草稿上下文检查
  if (context.hasDraftContext) {
    const draftResult = classifyDraftContext(message);
    if (draftResult) {
      console.log(`[Intent Draft] ${draftResult.intent}`);
      return draftResult;
    }
  }

  // 3. LLM 兜底
  console.log('[Intent] Regex unknown, falling back to LLM...');
  return await classifyByLLM(message, context);
}

/**
 * 正则快速分类（纯函数）
 */
export function classifyByRegex(message: string): ClassifyResult {
  const lowerText = message.toLowerCase();

  // 按优先级顺序检查
  for (const intent of intentPriority) {
    const patterns = intentPatterns[intent];
    for (const pattern of patterns) {
      if (pattern.test(lowerText)) {
        return {
          intent,
          confidence: 0.9,
          method: 'regex',
          matchedPattern: pattern.source,
        };
      }
    }
  }

  return {
    intent: 'unknown',
    confidence: 0,
    method: 'regex',
  };
}

/**
 * 草稿上下文分类（纯函数）
 */
export function classifyDraftContext(message: string): ClassifyResult | null {
  const lowerText = message.toLowerCase();

  for (const pattern of draftModifyPatterns) {
    if (pattern.test(lowerText)) {
      return {
        intent: 'create',
        confidence: 0.85,
        method: 'regex',
      };
    }
  }

  return null;
}

/**
 * LLM 意图分类（异步）
 * 使用 generateText + JSON 解析替代废弃的 generateObject
 */
async function classifyByLLM(
  message: string,
  context: ClassifyContext
): Promise<ClassifyResult> {
  // 构建对话历史文本
  const conversationText = context.conversationHistory
    ?.slice(-6) // 只取最近 3 轮
    .map(m => `${m.role === 'user' ? '用户' : 'AI'}: ${m.content}`)
    .join('\n') || `用户: ${message}`;

  const contextHint = context.hasDraftContext ? '（当前有活动草稿待确认）' : '';

  try {
    const result = await generateText({
      model: getModel('deepseek-chat'),
      prompt: `你是一个意图分类器。根据对话历史，判断用户当前的意图。${contextHint}

意图类型：
- create: 用户想创建/组织/发布活动（如"帮我组一个"、"我要发布"、"创建活动"）
- explore: 用户想找活动/探索附近/询问推荐（如"想找人一起"、"附近有什么"、"推荐一下"）
- manage: 用户想管理自己的活动（如"我的活动"、"取消活动"、"查看报名"）
- partner: 用户想找搭子/等人约（如"找搭子"、"谁组我就去"、"等人约"）
- idle: 用户暂时没有明确需求，闲聊或暂停（如"改天再说"、"先这样"、"不用了"、"谢谢"）
- chitchat: 用户在闲聊（如"你是谁"、"讲个笑话"）
- unknown: 无法判断

注意：
1. 如果用户在回答 AI 的问题（如选择地点、时间），应继承之前的意图
2. "解放碑"、"明天"这类短回答通常是在回答问题，不是新意图
3. 用户表示暂停、拒绝、告别时，应分类为 idle

对话历史：
${conversationText}

请以 JSON 格式返回，只返回 JSON，不要其他内容：
{"intent": "意图类型", "confidence": 0.0-1.0}`,
      temperature: 0,
    });

    // 解析 JSON 响应
    const text = result.text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const intent = parsed.intent as IntentType;
      const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.7;
      
      console.log(`[Intent LLM] ${intent} (confidence: ${confidence})`);
      
      // 验证意图类型
      const validIntents: IntentType[] = ['create', 'explore', 'manage', 'partner', 'chitchat', 'idle', 'unknown'];
      if (validIntents.includes(intent)) {
        return { intent, confidence, method: 'llm' };
      }
    }
    
    // 解析失败，降级到 explore
    console.warn('[Intent LLM] Failed to parse response:', text);
    return { intent: 'explore', confidence: 0.5, method: 'llm' };
  } catch (error) {
    console.error('[Intent LLM] Error:', error);
    // 降级到 explore（最常见的意图）
    return {
      intent: 'explore',
      confidence: 0.5,
      method: 'llm',
    };
  }
}

/**
 * 快速同步分类（仅正则，不调用 LLM）
 */
export function classifyIntentSync(
  message: string,
  hasDraftContext: boolean
): ClassifyResult {
  const regexResult = classifyByRegex(message);
  
  if (regexResult.intent !== 'unknown') {
    return regexResult;
  }

  if (hasDraftContext) {
    const draftResult = classifyDraftContext(message);
    if (draftResult) {
      return draftResult;
    }
  }

  return regexResult;
}
