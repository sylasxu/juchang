// AI Service - AI 功能业务逻辑
import { db, users, eq } from '@juchang/db';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';
import type { 
  AICreateActivityRequest, 
  AICreateActivityResponse,
  AIChatRequest,
  AIChatResponse,
  AIQuotaStatus,
  AIParseRequest,
  AIParseResponse
} from './ai.model';

/**
 * 获取 AI 模型配置
 * 根据环境变量选择不同的 AI 服务商
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
      // 通义千问 - 使用 OpenAI 兼容接口
      const dashscopeClient = createOpenAI({
        baseURL: process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        apiKey: process.env.DASHSCOPE_API_KEY || '',
      });
      return dashscopeClient('qwen-turbo');
      
    case 'zhipu':
      // 智谱 AI - 使用 OpenAI 兼容接口
      const zhipuClient = createOpenAI({
        baseURL: process.env.ZHIPU_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4',
        apiKey: process.env.ZHIPU_API_KEY || '',
      });
      return zhipuClient('glm-4-flash');
      
    default:
      // 默认使用通义千问
      const defaultClient = createOpenAI({
        baseURL: process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        apiKey: process.env.DASHSCOPE_API_KEY || '',
      });
      return defaultClient('qwen-turbo');
  }
}

/**
 * 检查用户 AI 额度
 */
export async function checkUserAIQuota(userId: string): Promise<AIQuotaStatus | null> {
  const [user] = await db
    .select({
      aiCreateQuotaToday: users.aiCreateQuotaToday,
      aiSearchQuotaToday: users.aiSearchQuotaToday,
      aiQuotaResetAt: users.aiQuotaResetAt,
      membershipType: users.membershipType,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user || null;
}

/**
 * 消耗 AI 创建活动额度
 */
export async function consumeAICreateQuota(userId: string): Promise<boolean> {
  const [user] = await db
    .select({
      aiCreateQuotaToday: users.aiCreateQuotaToday,
      membershipType: users.membershipType,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return false;

  // Pro 会员无限额度
  if (user.membershipType === 'pro') {
    return true;
  }

  // 检查免费用户额度
  if (user.aiCreateQuotaToday <= 0) {
    return false;
  }

  // 扣除额度
  await db
    .update(users)
    .set({
      aiCreateQuotaToday: user.aiCreateQuotaToday - 1,
    })
    .where(eq(users.id, userId));

  return true;
}

// 注意：consumeAIChatQuota 已被移除，因为V9.2砍掉了独立AI对话功能
// 使用 consumeAISearchQuota 替代

/**
 * AI 解析活动创建请求
 * 使用 AI SDK 集成 OpenAI
 */
export async function parseActivityWithAI(request: AICreateActivityRequest): Promise<AICreateActivityResponse> {
  const { prompt } = request;
  
  try {
    // 使用 generateText 来解析活动信息
    const result = await generateText({
      model: getAIModel(),
      prompt: `
        请解析以下活动描述，提取关键信息并以JSON格式返回：
        "${prompt}"
        
        请根据描述智能推断并返回以下JSON格式：
        {
          "title": "活动标题",
          "description": "活动描述",
          "type": "活动类型(food/entertainment/sports/study/other)",
          "maxParticipants": 参与人数(数字，如果没有明确说明，默认4),
          "feeType": "费用类型(free/aa/treat)",
          "estimatedCost": 预估费用(数字，人民币，如果是免费则为0),
          "locationName": "地点名称",
          "address": "详细地址",
          "startTime": "开始时间ISO格式(如果没有明确时间，设为明天晚上7点)",
          "confidence": 解析置信度(0-1的数字),
          "suggestions": ["优化建议数组"]
        }
        
        只返回JSON，不要其他文字。
      `,
      maxTokens: 500,
    });

    // 解析 AI 返回的 JSON
    let parsedResult: any;
    try {
      // 提取 JSON 部分
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      throw new Error('Failed to parse AI response as JSON');
    }

    // 处理地理位置（这里简化处理，实际应该调用地理编码API）
    const locationKeywords: Record<string, [number, number]> = {
      '观音桥': [106.5516, 29.5630],
      '解放碑': [106.5770, 29.5647],
      '南坪': [106.5516, 29.5230],
      '沙坪坝': [106.4550, 29.5410],
      '江北': [106.5740, 29.6060],
    };
    
    let location: [number, number] = [106.5516, 29.5630]; // 默认重庆市中心
    for (const [keyword, coords] of Object.entries(locationKeywords)) {
      if (parsedResult.locationName?.includes(keyword) || parsedResult.address?.includes(keyword)) {
        location = coords;
        break;
      }
    }

    return {
      title: parsedResult.title || '活动局',
      description: parsedResult.description || `根据您的描述："${prompt}"，为您生成的活动。`,
      startAt: parsedResult.startTime ? new Date(parsedResult.startTime) : new Date(Date.now() + 24 * 60 * 60 * 1000),
      endAt: null,
      type: parsedResult.type || 'other',
      maxParticipants: parsedResult.maxParticipants || 4,
      feeType: parsedResult.feeType || 'aa',
      estimatedCost: parsedResult.estimatedCost || 50,
      locationName: parsedResult.locationName || '待定',
      address: parsedResult.address || '待定',
      location,
      confidence: parsedResult.confidence || 0.7,
      suggestions: parsedResult.suggestions || [],
    };
  } catch (error) {
    // 如果 AI 调用失败，回退到简单解析
    console.error('AI 解析失败，使用简单解析:', error);
    
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    return {
      title: '活动局',
      description: `根据您的描述："${prompt}"，为您生成的活动。`,
      startAt: tomorrow,
      endAt: null,
      type: 'other',
      maxParticipants: 4,
      feeType: 'aa',
      estimatedCost: 50,
      locationName: '待定',
      address: '待定',
      location: [106.5516, 29.5630],
      confidence: 0.5,
      suggestions: ['请提供更详细的活动信息'],
    };
  }
}

/**
 * AI 对话处理
 * 使用 AI SDK 集成智能对话
 */
export async function processChatWithAI(request: AIChatRequest): Promise<AIChatResponse> {
  const { message, context } = request;
  
  try {
    // 构建上下文信息
    let contextPrompt = '';
    if (context?.location) {
      contextPrompt += `用户当前位置：经度${context.location[0]}，纬度${context.location[1]}。`;
    }
    if (context?.activityId) {
      contextPrompt += `用户正在查看活动ID：${context.activityId}。`;
    }

    const result = await generateText({
      model: getAIModel(),
      prompt: `
        你是聚场 AI 助手，专门帮助用户：
        1. 创建和管理活动
        2. 查找附近的活动
        3. 分析用户和活动信息
        4. 提供社交建议
        
        ${contextPrompt}
        
        用户消息：${message}
        
        请提供有用、友好的回复。如果用户想创建活动，引导他们提供详细信息。
        如果用户想查找活动，询问他们的偏好。
        回复要简洁明了，不超过100字。
      `,
      maxTokens: 200,
    });

    // 根据回复内容判断类型
    let responseType: 'text' | 'activity_suggestion' | 'location_recommendation' = 'text';
    let data: any = undefined;

    if (result.text.includes('创建') || result.text.includes('活动')) {
      responseType = 'activity_suggestion';
      data = {
        suggestedActions: ['创建活动', '查看附近活动'],
      };
    } else if (result.text.includes('附近') || result.text.includes('位置')) {
      responseType = 'location_recommendation';
      data = {
        needLocation: !context?.location,
      };
    }

    return {
      message: result.text,
      type: responseType,
      data,
    };
  } catch (error) {
    console.error('AI 对话失败，使用简单回复:', error);
    
    // 回退到简单回复
    if (message.includes('活动') || message.includes('局')) {
      return {
        message: '我可以帮您创建活动！请告诉我您想要什么类型的活动，什么时间，在哪里，需要多少人参与。',
        type: 'activity_suggestion',
        data: {
          suggestedActions: ['创建活动', '查看附近活动'],
        },
      };
    }
    
    return {
      message: '我是聚场 AI 助手，可以帮您创建活动、查找附近的局、分析用户信息等。有什么可以帮您的吗？',
      type: 'text',
    };
  }
}

/**
 * AI 流式对话处理
 * 根据 Elysia AI SDK 文档实现流式响应
 */
export async function processChatStreamWithAI(request: AIChatRequest) {
  const { message, context } = request;
  
  // 构建上下文信息
  let contextPrompt = '';
  if (context?.location) {
    contextPrompt += `用户当前位置：经度${context.location[0]}，纬度${context.location[1]}。`;
  }
  if (context?.activityId) {
    contextPrompt += `用户正在查看活动ID：${context.activityId}。`;
  }

  const stream = streamText({
    model: getAIModel(),
    system: `
      你是聚场 AI 助手，专门帮助用户：
      1. 创建和管理活动
      2. 查找附近的活动
      3. 分析用户和活动信息
      4. 提供社交建议
      
      ${contextPrompt}
      
      请提供有用、友好的回复。如果用户想创建活动，引导他们提供详细信息。
      如果用户想查找活动，询问他们的偏好。
      回复要简洁明了，不超过100字。
    `,
    prompt: message,
    maxTokens: 200,
  });

  return stream;
}


/**
 * AI 解析输入（魔法输入框）
 */
export async function parseInputWithAI(request: AIParseRequest): Promise<AIParseResponse> {
  const { input, inputType } = request;
  
  try {
    const result = await generateText({
      model: getAIModel(),
      prompt: `
        请解析以下用户输入，提取活动相关信息并以JSON格式返回：
        输入类型：${inputType || 'text'}
        用户输入：${input}
        
        请返回以下JSON格式：
        {
          "parsed": {
            "title": "活动标题或null",
            "description": "活动描述或null",
            "type": "活动类型(food/entertainment/sports/study/other)或null",
            "startAt": "开始时间ISO格式或null",
            "endAt": "结束时间ISO格式或null",
            "location": [经度, 纬度] 或 null,
            "locationName": "地点名称或null",
            "address": "详细地址或null",
            "maxParticipants": 参与人数或null,
            "feeType": "费用类型(free/aa/treat)或null",
            "estimatedCost": 预估费用或null
          },
          "confidence": 解析置信度(0-1的数字),
          "suggestions": ["优化建议数组"]
        }
        
        只返回JSON，不要其他文字。
      `,
      maxTokens: 500,
    });

    // 解析 AI 返回的 JSON
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsedResult = JSON.parse(jsonMatch[0]);
      
      // 处理地理位置
      if (parsedResult.parsed.locationName && !parsedResult.parsed.location) {
        const locationKeywords: Record<string, [number, number]> = {
          '观音桥': [106.5516, 29.5630],
          '解放碑': [106.5770, 29.5647],
          '南坪': [106.5516, 29.5230],
          '沙坪坝': [106.4550, 29.5410],
          '江北': [106.5740, 29.6060],
        };
        
        for (const [keyword, coords] of Object.entries(locationKeywords)) {
          if (parsedResult.parsed.locationName.includes(keyword)) {
            parsedResult.parsed.location = coords;
            break;
          }
        }
      }
      
      return parsedResult;
    }
    
    throw new Error('No JSON found');
  } catch (error) {
    console.error('AI 解析失败:', error);
    
    // 回退到简单解析
    return {
      parsed: {
        title: undefined,
        description: input.length > 20 ? input.substring(0, 50) + '...' : input,
        type: undefined,
        startAt: undefined,
        endAt: undefined,
        location: undefined,
        locationName: undefined,
        address: undefined,
        maxParticipants: undefined,
        feeType: undefined,
        estimatedCost: undefined,
      },
      confidence: 0.3,
      suggestions: ['请提供更详细的活动信息'],
    };
  }
}

/**
 * 消耗 AI 搜索额度
 */
export async function consumeAISearchQuota(userId: string): Promise<boolean> {
  const [user] = await db
    .select({
      aiSearchQuotaToday: users.aiSearchQuotaToday,
      membershipType: users.membershipType,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return false;

  // Pro 会员无限额度
  if (user.membershipType === 'pro') {
    return true;
  }

  // 检查免费用户额度
  if (user.aiSearchQuotaToday <= 0) {
    return false;
  }

  // 扣除额度
  await db
    .update(users)
    .set({
      aiSearchQuotaToday: user.aiSearchQuotaToday - 1,
    })
    .where(eq(users.id, userId));

  return true;
}

/**
 * AI 搜索处理
 */
export async function processSearchWithAI(request: any) {
  const { query, location, radius } = request;
  
  try {
    const result = await generateText({
      model: getAIModel(),
      prompt: `
        请解析以下搜索词，提取筛选条件并以JSON格式返回：
        "${query}"
        
        返回以下JSON格式：
        {
          "filters": {
            "type": "活动类型(food/entertainment/sports/study/other)或null",
            "keywords": ["关键词数组"],
            "priceRange": {"min": 0, "max": 100} 或 null,
            "timeRange": {"start": "ISO时间", "end": "ISO时间"} 或 null
          },
          "suggestions": ["搜索建议数组"],
          "confidence": 0.8
        }
        
        只返回JSON，不要其他文字。
      `,
      maxTokens: 300,
    });

    // 解析 AI 返回的 JSON
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('No JSON found');
  } catch (error) {
    console.error('AI 搜索解析失败:', error);
    
    // 回退到简单解析
    return {
      filters: {
        type: null,
        keywords: query.split(/\s+/),
        priceRange: null,
        timeRange: null,
      },
      suggestions: ['尝试更具体的搜索词'],
      confidence: 0.5,
    };
  }
}

/**
 * 生成用户深度风控报告
 */
export async function generateUserRiskReport(request: any) {
  const { targetUserId } = request;
  
  // 获取用户信息
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, targetUserId))
    .limit(1);

  if (!user) {
    throw new Error('用户不存在');
  }

  // 计算靠谱度
  const reliabilityRate = user.participationCount > 0
    ? Math.round((user.fulfillmentCount / user.participationCount) * 100)
    : 100;

  // 计算风险等级
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  let riskScore = 20;
  const factors: string[] = [];

  if (reliabilityRate < 60) {
    riskLevel = 'high';
    riskScore = 80;
    factors.push('靠谱度低于60%');
  } else if (reliabilityRate < 80) {
    riskLevel = 'medium';
    riskScore = 50;
    factors.push('靠谱度低于80%');
  }

  if (user.disputeCount > 3) {
    riskLevel = 'high';
    riskScore = Math.max(riskScore, 70);
    factors.push('争议次数较多');
  } else if (user.disputeCount > 0) {
    factors.push('有争议记录');
  }

  if (user.feedbackReceivedCount > 2) {
    factors.push('收到多次负面反馈');
  }

  // 生成建议
  let recommendation = '可以通过申请';
  if (riskLevel === 'high') {
    recommendation = '建议谨慎考虑，可要求对方提供更多信息';
  } else if (riskLevel === 'medium') {
    recommendation = '建议了解更多情况后再决定';
  }

  return {
    userId: user.id,
    nickname: user.nickname || '未知用户',
    avatarUrl: user.avatarUrl || undefined,
    basicStats: {
      reliabilityRate,
      participationCount: user.participationCount,
      fulfillmentCount: user.fulfillmentCount,
      disputeCount: user.disputeCount,
      feedbackReceivedCount: user.feedbackReceivedCount,
    },
    timeline: [], // TODO: 查询用户活动历史
    feedbackDetails: [], // TODO: 查询反馈详情
    riskAssessment: {
      level: riskLevel,
      score: riskScore,
      factors,
      recommendation,
    },
  };
}