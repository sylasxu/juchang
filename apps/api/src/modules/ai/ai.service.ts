// AI Service - MVP 简化版：只保留 parse 功能
import { db, users, eq } from '@juchang/db';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import type { AIParseRequest, AIParseResponse } from './ai.model';

/**
 * 获取 AI 模型配置
 */
function getAIModel() {
  const provider = process.env.AI_PROVIDER || 'dashscope';
  
  switch (provider) {
    case 'openai':
      const openaiClient = createOpenAI({
        baseURL: process.env.OPENAI_BASE_URL,
        apiKey: process.env.OPENAI_API_KEY || '',
      });
      return openaiClient('gpt-4o-mini');
      
    case 'dashscope':
    default:
      // 通义千问 - 使用 OpenAI 兼容接口
      const dashscopeClient = createOpenAI({
        baseURL: process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        apiKey: process.env.DASHSCOPE_API_KEY || '',
      });
      return dashscopeClient('qwen-turbo');
  }
}

/**
 * 检查用户 AI 额度
 */
export async function checkAIQuota(userId: string): Promise<{ hasQuota: boolean; remaining: number }> {
  const [user] = await db
    .select({
      aiCreateQuotaToday: users.aiCreateQuotaToday,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return { hasQuota: false, remaining: 0 };
  }

  return {
    hasQuota: user.aiCreateQuotaToday > 0,
    remaining: user.aiCreateQuotaToday,
  };
}

/**
 * 消耗 AI 额度
 */
export async function consumeAIQuota(userId: string): Promise<boolean> {
  const [user] = await db
    .select({
      aiCreateQuotaToday: users.aiCreateQuotaToday,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user || user.aiCreateQuotaToday <= 0) {
    return false;
  }

  await db
    .update(users)
    .set({
      aiCreateQuotaToday: user.aiCreateQuotaToday - 1,
    })
    .where(eq(users.id, userId));

  return true;
}

/**
 * AI 解析文本 - 返回 streamText 结果
 */
export async function parseTextStream(request: AIParseRequest) {
  const { text, location } = request;
  
  // 构建位置上下文
  let locationContext = '';
  if (location) {
    locationContext = `用户当前位置：经度${location[0]}，纬度${location[1]}（重庆地区）。`;
  }

  const result = await streamText({
    model: getAIModel(),
    system: `你是聚场 AI 助手，专门帮助用户解析活动信息。
${locationContext}

请解析用户输入，提取活动相关信息。
重庆地形复杂，如果涉及位置，请在 locationHint 中补充楼层、入口等信息。

返回 JSON 格式：
{
  "parsed": {
    "title": "活动标题",
    "description": "活动描述",
    "type": "food/entertainment/sports/boardgame/other",
    "startAt": "ISO时间格式",
    "endAt": "ISO时间格式或null",
    "location": [经度, 纬度] 或 null,
    "locationName": "地点名称",
    "address": "详细地址",
    "locationHint": "位置备注（如：负一楼、从解放碑方向入口）",
    "maxParticipants": 人数,
    "feeType": "free/aa/treat",
    "estimatedCost": 预估费用
  },
  "confidence": 0.8,
  "suggestions": ["建议1", "建议2"]
}

只返回 JSON，不要其他文字。`,
    prompt: text,
    maxTokens: 500,
  });

  return result;
}

/**
 * 解析 AI 返回的 JSON 文本
 */
export function parseAIResponse(text: string): AIParseResponse {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // 处理重庆地理位置
      if (parsed.parsed?.locationName && !parsed.parsed?.location) {
        const locationKeywords: Record<string, [number, number]> = {
          '观音桥': [106.5516, 29.5630],
          '解放碑': [106.5770, 29.5647],
          '南坪': [106.5516, 29.5230],
          '沙坪坝': [106.4550, 29.5410],
          '江北': [106.5740, 29.6060],
          '杨家坪': [106.5100, 29.5030],
          '大坪': [106.5230, 29.5380],
          '北碚': [106.4370, 29.8260],
        };
        
        for (const [keyword, coords] of Object.entries(locationKeywords)) {
          if (parsed.parsed.locationName.includes(keyword)) {
            parsed.parsed.location = coords;
            break;
          }
        }
      }
      
      return {
        parsed: parsed.parsed || {},
        confidence: parsed.confidence || 0.5,
        suggestions: parsed.suggestions || [],
      };
    }
  } catch (error) {
    console.error('AI 响应解析失败:', error);
  }
  
  // 回退响应
  return {
    parsed: {},
    confidence: 0.3,
    suggestions: ['请提供更详细的活动信息'],
  };
}
