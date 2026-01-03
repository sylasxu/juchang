// AI Service - v3.5 统一 AI Chat (Data Stream Protocol + Execution Trace)
import { db, users, conversations, activities, participants, eq, desc, sql } from '@juchang/db';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { 
  streamText, 
  createUIMessageStream, 
  createUIMessageStreamResponse,
  convertToModelMessages,
  type UIMessage,
} from 'ai';
import { randomUUID } from 'crypto';
import type { 
  AIParseRequest, 
  AIParseResponse, 
  ConversationsQuery,
  ConversationMessageType,
  WelcomeResponse,
  QuickAction,
  ExploreNearbyContext,
  ContinueDraftContext,
  FindPartnerContext,
} from './ai.model';
import { buildSystemPrompt, type PromptContext, type ActivityDraftForPrompt } from './prompts/xiaoju-v35';
import { getAIToolsV34 } from './tools';
import { recordTokenUsage } from './services/metrics';

// ==========================================
// System Prompt (v3.4 - 从 prompts 模块导入)
// ==========================================

// 测试模式 Prompt（不使用 Tools）
const SYSTEM_PROMPT_TEST = `你是聚场 AI 助手，专门帮助用户组织线下活动。

这是测试模式，请直接用文字回复，模拟你会如何理解用户的意图。
如果用户想创建活动，描述你会提取哪些信息（时间、地点、活动类型等）。
如果用户想探索附近，描述你会搜索什么。

语气要接地气，不要太正式。`;

/**
 * DeepSeek Provider 配置
 * 使用官方 @ai-sdk/deepseek provider
 */
const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY || '',
});

/**
 * 获取 AI 模型配置
 * 简化为单一 DeepSeek provider
 */
function getAIModel() {
  return deepseek('deepseek-chat');
}

// ==========================================
// AI 额度管理
// ==========================================

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


// ==========================================
// 意图分类 (v3.3 已迁移到 Tools)
// ==========================================

/**
 * 意图类型
 * 
 * v3.3 更新：意图分类逻辑已迁移到 Vercel AI SDK Tools
 * AI 会自动选择调用 createActivityDraft 或 exploreNearby
 */
export type IntentType = 'create' | 'explore' | 'unknown';

// ==========================================
// AI Chat (v3.4)
// ==========================================

/**
 * Chat 请求参数 (v3.5 支持 trace + UIMessage 格式)
 */
export interface StreamChatRequest {
  messages: Array<Omit<UIMessage, 'id'>>;
  userId: string | null;
  location?: [number, number];
  source: 'miniprogram' | 'admin';
  /** 草稿上下文，用于多轮对话 */
  draftContext?: {
    activityId: string;
    currentDraft: ActivityDraftForPrompt;
  };
  /** v3.5 新增：执行追踪，返回详细的执行步骤数据 */
  trace?: boolean;
}

/**
 * 统一 AI Chat - 返回 Data Stream Response (v3.5)
 * 
 * 小程序和 Admin 都使用此函数，返回 Vercel AI SDK 标准格式。
 * 
 * v3.5 新特性：
 * - trace 参数：返回执行追踪数据（Admin Playground 调试用）
 * 
 * v3.4 特性：
 * - 使用新的 System Prompt（草稿优先模式）
 * - 支持 draftContext 多轮对话
 * - 4 个 Tools：createActivityDraft, refineDraft, exploreNearby, publishActivity
 * - Token 使用量记录
 */
export async function streamChat(request: StreamChatRequest) {
  const { messages, userId, location, source, draftContext, trace } = request;
  
  // 构建 Prompt 上下文
  const locationName = location ? await reverseGeocode(location[1], location[0]) : undefined;
  const promptContext: PromptContext = {
    currentTime: new Date(),
    userLocation: location ? {
      lat: location[1],
      lng: location[0],
      name: locationName,
    } : undefined,
    userNickname: userId ? await getUserNickname(userId) : undefined,
    draftContext,
  };

  // 使用 AI SDK 内置的 convertToModelMessages 转换消息格式
  // 自动处理 UIMessage 中的 parts（包含 Tool 调用历史）
  const aiMessages = await convertToModelMessages(messages);

  // 测试模式判断：
  // - 小程序无用户：测试模式（不使用 Tools）
  // - Admin 无用户：仍使用 Tools（Tools 内部会处理 userId=null 的情况，不写数据库）
  const isTestMode = !userId && source !== 'admin';
  
  // 构建 System Prompt
  const systemPrompt = isTestMode ? SYSTEM_PROMPT_TEST : buildSystemPrompt(promptContext);
  
  // 获取 Tools
  // - 测试模式：不使用 Tools
  // - Admin 模式：即使无用户也使用 Tools（Tools 内部处理测试模式）
  const tools = isTestMode ? undefined : getAIToolsV34(userId);
  
  // Trace 模式的元数据
  const requestId = trace ? randomUUID() : undefined;
  const startedAt = trace ? new Date().toISOString() : undefined;
  let stepIndex = 0;
  
  // trace 模式的数据收集（通过 onStepFinish 实时收集）
  const traceSteps: Array<{ toolName: string; toolCallId: string; args: unknown; result?: unknown }> = [];
  let totalUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  
  // 执行 AI 推理
  const result = streamText({
    model: getAIModel(),
    system: systemPrompt,
    messages: aiMessages,
    tools: tools as any,
    temperature: 0, // 更一致的 Tool 调用结果
    // 自定义停止条件：
    // 1. 最多 5 步
    // 2. 如果调用了 askPreference，立即停止（等待用户回复）
    stopWhen: (event) => {
      // 检查是否达到最大步骤数
      if (event.steps.length >= 5) return true;
      
      // 检查最后一步是否调用了 askPreference
      const lastStep = event.steps[event.steps.length - 1];
      if (lastStep?.toolCalls) {
        const hasAskPreference = lastStep.toolCalls.some(
          (tc: { toolName: string }) => tc.toolName === 'askPreference'
        );
        if (hasAskPreference) {
          console.log('[AI Chat] askPreference called, stopping to wait for user response');
          return true;
        }
      }
      
      return false;
    },
    // 使用 onStepFinish 实时获取每个步骤的数据
    onStepFinish: (step) => {
      // 收集 tool calls
      for (const tc of step.toolCalls || []) {
        const existingStep = traceSteps.find(s => s.toolCallId === tc.toolCallId);
        if (!existingStep) {
          traceSteps.push({
            toolName: tc.toolName,
            toolCallId: tc.toolCallId,
            args: (tc as unknown as { args: unknown }).args,
          });
        }
      }
      // 收集 tool results
      for (const tr of step.toolResults || []) {
        const existingStep = traceSteps.find(s => s.toolCallId === tr.toolCallId);
        if (existingStep) {
          existingStep.result = (tr as unknown as { result: unknown }).result;
        }
      }
    },
    onFinish: async (event) => {
      // 获取最终 usage
      const eventUsage = (event as any).totalUsage || event.usage;
      totalUsage = {
        promptTokens: eventUsage?.promptTokens ?? eventUsage?.inputTokens ?? 0,
        completionTokens: eventUsage?.completionTokens ?? eventUsage?.outputTokens ?? 0,
        totalTokens: eventUsage?.totalTokens ?? 0,
      };
      
      console.log(`[AI Chat] Source: ${source}, User: ${userId}, Tokens: ${totalUsage.totalTokens}, Tools: ${traceSteps.length}`);
      
      // 记录 Token 使用量
      if (userId && !isTestMode) {
        await recordTokenUsage(
          userId,
          {
            inputTokens: totalUsage.promptTokens,
            outputTokens: totalUsage.completionTokens,
            totalTokens: totalUsage.totalTokens,
          },
          traceSteps.map(s => ({ toolName: s.toolName }))
        );
      }
    },
  });
  
  // 如果不需要 trace，直接返回 UIMessageStreamResponse（包含 Tool Parts）
  if (!trace) {
    return result.toUIMessageStreamResponse();
  }
  
  // trace 模式：使用 createUIMessageStream 发送 transient trace 数据
  const llmStartedAt = new Date().toISOString();
  const llmStepId = `step-${stepIndex++}`;
  
  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      // 1. 发送 trace-start（transient - 不会添加到 message.parts）
      writer.write({
        type: 'data-trace-start',
        data: { requestId, startedAt },
        transient: true,
      });
      
      // 2. 发送 input 步骤
      const lastUserMessage = messages.filter(m => m.role === 'user').pop();
      // 从 UIMessage 中提取文本内容
      const lastUserText = lastUserMessage?.parts?.find(p => p.type === 'text')?.text 
        || (lastUserMessage as { content?: string })?.content 
        || '';
      writer.write({
        type: 'data-trace-step',
        data: {
          id: `${requestId}-input`,
          type: 'input',
          name: '用户输入',
          startedAt,
          completedAt: startedAt,
          status: 'success',
          duration: 0,
          data: { text: lastUserText },
        },
        transient: true,
      });
      
      // 3. 发送 prompt 步骤
      writer.write({
        type: 'data-trace-step',
        data: {
          id: `${requestId}-prompt`,
          type: 'prompt',
          name: 'System Prompt',
          startedAt,
          completedAt: startedAt,
          status: 'success',
          duration: 0,
          data: {
            currentTime: promptContext.currentTime.toISOString(),
            userLocation: promptContext.userLocation,
            draftContext: promptContext.draftContext ? {
              activityId: promptContext.draftContext.activityId,
              title: promptContext.draftContext.currentDraft.title,
            } : undefined,
            fullPrompt: systemPrompt,
          },
        },
        transient: true,
      });
      
      // 4. 发送 llm 步骤开始
      writer.write({
        type: 'data-trace-step',
        data: {
          id: llmStepId,
          type: 'llm',
          name: 'LLM 推理',
          startedAt: llmStartedAt,
          status: 'running',
          data: {
            model: process.env.AI_PROVIDER || 'deepseek',
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
          },
        },
        transient: true,
      });
      
      // 5. 合并 AI 响应流（自动包含 Tool Parts）
      writer.merge(result.toUIMessageStream({
        onFinish: () => {
          const llmCompletedAt = new Date().toISOString();
          const llmDuration = new Date(llmCompletedAt).getTime() - new Date(llmStartedAt).getTime();
          
          // 更新 llm 步骤完成
          writer.write({
            type: 'data-trace-step-update',
            data: {
              stepId: llmStepId,
              completedAt: llmCompletedAt,
              status: 'success',
              duration: llmDuration,
              data: {
                model: process.env.AI_PROVIDER || 'deepseek',
                inputTokens: totalUsage.promptTokens,
                outputTokens: totalUsage.completionTokens,
                totalTokens: totalUsage.totalTokens,
              },
            },
            transient: true,
          });
          
          // 发送 tool 步骤（从 onStepFinish 收集的数据）
          for (const step of traceSteps) {
            writer.write({
              type: 'data-trace-step',
              data: {
                id: `${requestId}-tool-${step.toolCallId}`,
                type: 'tool',
                name: getToolDisplayName(step.toolName),
                startedAt: llmCompletedAt,
                completedAt: llmCompletedAt,
                status: 'success',
                duration: 0,
                data: {
                  toolName: step.toolName,
                  toolDisplayName: getToolDisplayName(step.toolName),
                  input: step.args,
                  output: step.result,
                  widgetType: getWidgetType(step.toolName),
                },
              },
              transient: true,
            });
          }
          
          // 发送 trace-end
          const completedAt = new Date().toISOString();
          const totalDuration = new Date(completedAt).getTime() - new Date(startedAt!).getTime();
          writer.write({
            type: 'data-trace-end',
            data: {
              requestId,
              completedAt,
              totalDuration,
              status: 'completed',
            },
            transient: true,
          });
          
          console.log(`[AI Chat + Trace] Source: ${source}, User: ${userId}, Tokens: ${totalUsage.totalTokens}, Tools: ${traceSteps.length}, Duration: ${totalDuration}ms`);
        },
      }));
    },
  });
  
  return createUIMessageStreamResponse({ stream });
}

/**
 * 获取 Tool 显示名称
 */
function getToolDisplayName(toolName: string): string {
  const displayNames: Record<string, string> = {
    createActivityDraft: '创建活动草稿',
    refineDraft: '修改草稿',
    exploreNearby: '探索附近',
    publishActivity: '发布活动',
    askPreference: '询问偏好',
  };
  return displayNames[toolName] || toolName;
}

/**
 * 获取 Tool 对应的 Widget 类型
 */
function getWidgetType(toolName: string): string | undefined {
  const widgetTypes: Record<string, string> = {
    createActivityDraft: 'widget_draft',
    refineDraft: 'widget_draft',
    exploreNearby: 'widget_explore',
    publishActivity: 'widget_share',
    askPreference: 'widget_ask_preference',
  };
  return widgetTypes[toolName];
}


/**
 * 获取用户昵称
 */
async function getUserNickname(userId: string): Promise<string | undefined> {
  const [user] = await db
    .select({ nickname: users.nickname })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return user?.nickname || undefined;
}

// 保留旧函数用于向后兼容（小程序过渡期）
export async function parseTextStream(request: AIParseRequest): Promise<ReturnType<typeof streamText>> {
  const { text, location } = request;
  
  // 构建位置上下文
  let locationContext = '';
  if (location) {
    locationContext = `用户当前位置：经度${location[0]}，纬度${location[1]}（重庆地区）。`;
  }

  // 使用测试模式 Prompt
  const result = streamText({
    model: getAIModel(),
    system: SYSTEM_PROMPT_TEST + '\n' + locationContext,
    prompt: text,
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


// ==========================================
// 创建 Draft 活动 (v3.2 新增)
// ==========================================

/**
 * 活动草稿数据
 */
export interface ActivityDraft {
  title: string;
  description?: string;
  type: 'food' | 'entertainment' | 'sports' | 'boardgame' | 'other';
  startAt: string;
  location: [number, number]; // [lng, lat]
  locationName: string;
  address?: string;
  locationHint: string;
  maxParticipants: number;
}

/**
 * 从 AI 解析结果创建 draft 状态的活动
 */
export async function createDraftActivity(
  userId: string,
  draft: ActivityDraft
): Promise<{ activityId: string }> {
  const { location, startAt, ...activityData } = draft;
  
  // 创建 draft 状态的活动
  const [newActivity] = await db
    .insert(activities)
    .values({
      ...activityData,
      creatorId: userId,
      location: sql`ST_SetSRID(ST_MakePoint(${location[0]}, ${location[1]}), 4326)`,
      startAt: new Date(startAt),
      currentParticipants: 1,
      status: 'draft', // 草稿状态
    })
    .returning({ id: activities.id });
  
  // 将创建者加入参与者列表
  await db
    .insert(participants)
    .values({
      activityId: newActivity.id,
      userId,
      status: 'joined',
    });
  
  return { activityId: newActivity.id };
}

/**
 * 创建 Widget_Draft 对话记录
 */
export async function createDraftMessage(
  userId: string,
  draft: ActivityDraft,
  activityId: string
): Promise<{ messageId: string }> {
  const [message] = await db
    .insert(conversations)
    .values({
      userId,
      role: 'assistant',
      messageType: 'widget_draft',
      content: {
        ...draft,
        activityId,
      },
      activityId,
    })
    .returning({ id: conversations.id });
  
  return { messageId: message.id };
}


// ==========================================
// 探索场景 (v3.2 新增)
// ==========================================

/**
 * 探索结果项
 */
export interface ExploreResult {
  id: string;
  title: string;
  type: string;
  lat: number;
  lng: number;
  locationName: string;
  distance: number;
  startAt: string;
  currentParticipants: number;
  maxParticipants: number;
}

/**
 * 探索响应
 */
export interface ExploreResponse {
  center: { lat: number; lng: number; name: string };
  results: ExploreResult[];
  title: string;
}

/**
 * 创建 Widget_Explore 对话记录
 */
export async function createExploreMessage(
  userId: string,
  exploreData: ExploreResponse
): Promise<{ messageId: string }> {
  const [message] = await db
    .insert(conversations)
    .values({
      userId,
      role: 'assistant',
      messageType: 'widget_explore',
      content: exploreData,
    })
    .returning({ id: conversations.id });
  
  return { messageId: message.id };
}

/**
 * 创建文本引导消息
 */
export async function createTextMessage(
  userId: string,
  text: string
): Promise<{ messageId: string }> {
  const [message] = await db
    .insert(conversations)
    .values({
      userId,
      role: 'assistant',
      messageType: 'text',
      content: { text },
    })
    .returning({ id: conversations.id });
  
  return { messageId: message.id };
}


// ==========================================
// 对话历史管理 (v3.3 增强版 - 支持显式 scope 参数)
// ==========================================

/**
 * 对话消息响应项（包含用户信息）
 */
interface ConversationMessageWithUser {
  id: string;
  userId: string;
  userNickname: string | null;
  role: 'user' | 'assistant';
  type: ConversationMessageType;
  content: unknown;
  activityId: string | null;
  createdAt: string;
}

/**
 * 对话历史响应
 */
interface ConversationsResponseEnhanced {
  items: ConversationMessageWithUser[];
  total: number;
  hasMore: boolean;
  cursor: string | null;
}

/**
 * 获取当前用户的对话历史（用户模式）
 */
export async function getConversations(
  currentUserId: string,
  query: ConversationsQuery
): Promise<ConversationsResponseEnhanced> {
  const limit = query.limit || 20;
  
  // 构建 WHERE 条件
  let whereConditions = sql`${conversations.userId} = ${currentUserId}`;
  
  // 活动 ID 筛选
  if (query.activityId) {
    whereConditions = sql`${whereConditions} AND ${conversations.activityId} = ${query.activityId}`;
  }
  
  // 消息类型筛选
  if (query.messageType) {
    whereConditions = sql`${whereConditions} AND ${conversations.messageType} = ${query.messageType}`;
  }
  
  // 角色筛选
  if (query.role) {
    whereConditions = sql`${whereConditions} AND ${conversations.role} = ${query.role}`;
  }
  
  // 游标分页
  if (query.cursor) {
    whereConditions = sql`${whereConditions} AND ${conversations.createdAt} < (SELECT created_at FROM conversations WHERE id = ${query.cursor})`;
  }
  
  // 查询总数
  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(conversations)
    .where(whereConditions);
  
  const total = countResult?.count || 0;
  
  // 查询数据（关联用户表获取昵称）
  const messages = await db
    .select({
      id: conversations.id,
      userId: conversations.userId,
      userNickname: users.nickname,
      role: conversations.role,
      messageType: conversations.messageType,
      content: conversations.content,
      activityId: conversations.activityId,
      createdAt: conversations.createdAt,
    })
    .from(conversations)
    .leftJoin(users, eq(conversations.userId, users.id))
    .where(whereConditions)
    .orderBy(desc(conversations.createdAt))
    .limit(limit + 1);
  
  // 判断是否还有更多
  const hasMore = messages.length > limit;
  const items = messages.slice(0, limit);
  
  // 转换为响应格式
  const conversationMessages: ConversationMessageWithUser[] = items.map(m => ({
    id: m.id,
    userId: m.userId,
    userNickname: m.userNickname,
    role: m.role as 'user' | 'assistant',
    type: m.messageType as ConversationMessageType,
    content: m.content,
    activityId: m.activityId,
    createdAt: m.createdAt.toISOString(),
  }));
  
  return {
    items: conversationMessages,
    total,
    hasMore,
    cursor: items.length > 0 ? items[items.length - 1].id : null,
  };
}


/**
 * 获取所有用户的对话历史（Admin 模式）
 */
export async function getAllConversations(
  query: ConversationsQuery
): Promise<ConversationsResponseEnhanced> {
  const limit = query.limit || 20;
  
  // 构建 WHERE 条件（不限制用户）
  let whereConditions = sql`1=1`;
  
  // 活动 ID 筛选
  if (query.activityId) {
    whereConditions = sql`${whereConditions} AND ${conversations.activityId} = ${query.activityId}`;
  }
  
  // 消息类型筛选
  if (query.messageType) {
    whereConditions = sql`${whereConditions} AND ${conversations.messageType} = ${query.messageType}`;
  }
  
  // 角色筛选
  if (query.role) {
    whereConditions = sql`${whereConditions} AND ${conversations.role} = ${query.role}`;
  }
  
  // 游标分页
  if (query.cursor) {
    whereConditions = sql`${whereConditions} AND ${conversations.createdAt} < (SELECT created_at FROM conversations WHERE id = ${query.cursor})`;
  }
  
  // 查询总数
  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(conversations)
    .where(whereConditions);
  
  const total = countResult?.count || 0;
  
  // 查询数据（关联用户表获取昵称）
  const messages = await db
    .select({
      id: conversations.id,
      userId: conversations.userId,
      userNickname: users.nickname,
      role: conversations.role,
      messageType: conversations.messageType,
      content: conversations.content,
      activityId: conversations.activityId,
      createdAt: conversations.createdAt,
    })
    .from(conversations)
    .leftJoin(users, eq(conversations.userId, users.id))
    .where(whereConditions)
    .orderBy(desc(conversations.createdAt))
    .limit(limit + 1);
  
  // 判断是否还有更多
  const hasMore = messages.length > limit;
  const items = messages.slice(0, limit);
  
  // 转换为响应格式
  const conversationMessages: ConversationMessageWithUser[] = items.map(m => ({
    id: m.id,
    userId: m.userId,
    userNickname: m.userNickname,
    role: m.role as 'user' | 'assistant',
    type: m.messageType as ConversationMessageType,
    content: m.content,
    activityId: m.activityId,
    createdAt: m.createdAt.toISOString(),
  }));
  
  return {
    items: conversationMessages,
    total,
    hasMore,
    cursor: items.length > 0 ? items[items.length - 1].id : null,
  };
}


/**
 * 获取指定用户的对话历史（Admin 查指定用户）
 */
export async function getConversationsByUserId(
  targetUserId: string,
  query: ConversationsQuery
): Promise<ConversationsResponseEnhanced> {
  const limit = query.limit || 20;
  
  // 构建 WHERE 条件
  let whereConditions = sql`${conversations.userId} = ${targetUserId}`;
  
  // 活动 ID 筛选
  if (query.activityId) {
    whereConditions = sql`${whereConditions} AND ${conversations.activityId} = ${query.activityId}`;
  }
  
  // 消息类型筛选
  if (query.messageType) {
    whereConditions = sql`${whereConditions} AND ${conversations.messageType} = ${query.messageType}`;
  }
  
  // 角色筛选
  if (query.role) {
    whereConditions = sql`${whereConditions} AND ${conversations.role} = ${query.role}`;
  }
  
  // 游标分页
  if (query.cursor) {
    whereConditions = sql`${whereConditions} AND ${conversations.createdAt} < (SELECT created_at FROM conversations WHERE id = ${query.cursor})`;
  }
  
  // 查询总数
  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(conversations)
    .where(whereConditions);
  
  const total = countResult?.count || 0;
  
  // 查询数据（关联用户表获取昵称）
  const messages = await db
    .select({
      id: conversations.id,
      userId: conversations.userId,
      userNickname: users.nickname,
      role: conversations.role,
      messageType: conversations.messageType,
      content: conversations.content,
      activityId: conversations.activityId,
      createdAt: conversations.createdAt,
    })
    .from(conversations)
    .leftJoin(users, eq(conversations.userId, users.id))
    .where(whereConditions)
    .orderBy(desc(conversations.createdAt))
    .limit(limit + 1);
  
  // 判断是否还有更多
  const hasMore = messages.length > limit;
  const items = messages.slice(0, limit);
  
  // 转换为响应格式
  const conversationMessages: ConversationMessageWithUser[] = items.map(m => ({
    id: m.id,
    userId: m.userId,
    userNickname: m.userNickname,
    role: m.role as 'user' | 'assistant',
    type: m.messageType as ConversationMessageType,
    content: m.content,
    activityId: m.activityId,
    createdAt: m.createdAt.toISOString(),
  }));
  
  return {
    items: conversationMessages,
    total,
    hasMore,
    cursor: items.length > 0 ? items[items.length - 1].id : null,
  };
}

/**
 * 添加用户消息到对话历史
 */
export async function addUserMessage(
  userId: string,
  content: string
): Promise<{ id: string }> {
  const [message] = await db
    .insert(conversations)
    .values({
      userId,
      role: 'user',
      messageType: 'text',
      content: { text: content },
    })
    .returning({ id: conversations.id });
  
  return { id: message.id };
}

/**
 * 添加 AI 消息到对话历史
 */
export async function addAIMessage(
  userId: string,
  type: ConversationMessageType,
  content: Record<string, unknown>,
  activityId?: string
): Promise<{ id: string }> {
  const [message] = await db
    .insert(conversations)
    .values({
      userId,
      role: 'assistant',
      messageType: type,
      content,
      activityId,
    })
    .returning({ id: conversations.id });
  
  return { id: message.id };
}

/**
 * 清空用户对话历史
 */
export async function clearConversations(userId: string): Promise<{ deletedCount: number }> {
  const result = await db
    .delete(conversations)
    .where(eq(conversations.userId, userId))
    .returning({ id: conversations.id });
  
  return { deletedCount: result.length };
}


// ==========================================
// Welcome Card 功能 (v3.4 新增)
// ==========================================

/**
 * 活动类型标签映射
 */
const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  food: '饭',
  entertainment: '玩',
  sports: '运动',
  boardgame: '桌游',
  other: '活动',
};

/**
 * 预填提示语映射
 */
const SUGGESTED_PROMPTS: Record<string, string> = {
  food: '今晚想吃火锅，有人一起吗？',
  entertainment: '周末想去看电影，有人约吗？',
  sports: '想打羽毛球，求组队',
  boardgame: '周末桌游局，三缺一',
  other: '想找人一起玩，有人吗？',
};

/**
 * 生成问候语
 * 根据时间段和用户昵称生成个性化问候
 */
export function generateGreeting(nickname: string | null, currentHour?: number): string {
  const hour = currentHour ?? new Date().getHours();
  const name = nickname || '';
  
  if (hour >= 0 && hour < 6) {
    return "这么晚还没睡？想约宵夜还是找人聊天？";
  } else if (hour >= 6 && hour < 12) {
    return name ? `早上好，${name}！今天想怎么玩？` : "早上好！今天想怎么玩？";
  } else if (hour >= 12 && hour < 18) {
    return name ? `下午好，${name}！有什么安排吗？` : "下午好！有什么安排吗？";
  } else {
    return name ? `晚上好，${name}。今晚想约点什么？` : "晚上好。今晚想约点什么？";
  }
}

/**
 * 逆地理编码（简化实现）
 * TODO: 后续接入腾讯地图 API
 */
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  // 简化实现：根据坐标范围返回重庆主要地点名
  const locationKeywords: Array<{ name: string; lat: number; lng: number; radius: number }> = [
    { name: '观音桥', lat: 29.5630, lng: 106.5516, radius: 0.02 },
    { name: '解放碑', lat: 29.5647, lng: 106.5770, radius: 0.02 },
    { name: '南坪', lat: 29.5230, lng: 106.5516, radius: 0.02 },
    { name: '沙坪坝', lat: 29.5410, lng: 106.4550, radius: 0.02 },
    { name: '江北', lat: 29.6060, lng: 106.5740, radius: 0.02 },
    { name: '杨家坪', lat: 29.5030, lng: 106.5100, radius: 0.02 },
    { name: '大坪', lat: 29.5380, lng: 106.5230, radius: 0.02 },
    { name: '北碚', lat: 29.8260, lng: 106.4370, radius: 0.03 },
  ];
  
  for (const loc of locationKeywords) {
    const distance = Math.sqrt(
      Math.pow(lat - loc.lat, 2) + Math.pow(lng - loc.lng, 2)
    );
    if (distance <= loc.radius) {
      return loc.name;
    }
  }
  
  return '附近';
}


/**
 * 统计附近活动数量
 */
async function countNearbyActivities(
  location: { lat: number; lng: number },
  radiusMeters: number
): Promise<number> {
  const result = await db.execute(sql`
    SELECT COUNT(*)::int as count FROM activities
    WHERE status = 'active'
      AND start_at > NOW()
      AND current_participants < max_participants
      AND ST_DWithin(
        location::geography,
        ST_SetSRID(ST_MakePoint(${location.lng}, ${location.lat}), 4326)::geography,
        ${radiusMeters}
      )
  `) as unknown as Array<{ count: number }>;
  
  return result[0]?.count || 0;
}

/**
 * 构建探索附近按钮
 */
export async function buildExploreNearbyAction(
  location: { lat: number; lng: number }
): Promise<QuickAction | null> {
  // 1. 逆地理编码获取地点名
  const locationName = await reverseGeocode(location.lat, location.lng);
  
  // 2. 查询附近活动数量 (5km 范围)
  const nearbyCount = await countNearbyActivities(location, 5000);
  
  if (nearbyCount === 0) return null;
  
  const context: ExploreNearbyContext = {
    locationName,
    lat: location.lat,
    lng: location.lng,
    activityCount: nearbyCount,
  };
  
  return {
    type: 'explore_nearby',
    label: `看看${locationName}附近的活动？`,
    context,
  };
}

/**
 * 构建继续草稿按钮
 */
export async function buildContinueDraftAction(
  userId: string
): Promise<QuickAction | null> {
  const draft = await db
    .select({
      id: activities.id,
      title: activities.title,
    })
    .from(activities)
    .where(
      sql`${activities.creatorId} = ${userId}
        AND ${activities.status} = 'draft'
        AND ${activities.startAt} > NOW()`
    )
    .orderBy(desc(activities.createdAt))
    .limit(1);
  
  if (draft.length === 0) return null;
  
  const context: ContinueDraftContext = {
    activityId: draft[0].id,
    activityTitle: draft[0].title,
  };
  
  return {
    type: 'continue_draft',
    label: `上次的「${draft[0].title}」还没发，继续？`,
    context,
  };
}


/**
 * 获取用户活动类型统计
 */
export async function getUserActivityTypeStats(
  userId: string
): Promise<Array<{ type: string; count: number }>> {
  const result = await db.execute(sql`
    SELECT type, COUNT(*)::int as count FROM (
      -- 用户创建的活动
      SELECT type FROM activities WHERE creator_id = ${userId}
      UNION ALL
      -- 用户参与的活动
      SELECT a.type FROM activities a
      JOIN participants p ON a.id = p.activity_id
      WHERE p.user_id = ${userId} AND p.status = 'joined'
    ) AS combined
    GROUP BY type
    ORDER BY count DESC
    LIMIT 1
  `) as unknown as Array<{ type: string; count: number }>;
  
  return result;
}

/**
 * 构建找搭子按钮
 */
export async function buildFindPartnerAction(
  userId: string | null
): Promise<QuickAction> {
  let preferredType = 'food'; // 默认
  
  if (userId) {
    // 统计用户历史活动类型
    const typeStats = await getUserActivityTypeStats(userId);
    if (typeStats.length > 0) {
      preferredType = typeStats[0].type;
    }
  }
  
  const typeLabel = ACTIVITY_TYPE_LABELS[preferredType] || '活动';
  const suggestedPrompt = SUGGESTED_PROMPTS[preferredType] || SUGGESTED_PROMPTS.other;
  
  const context: FindPartnerContext = {
    activityType: preferredType,
    activityTypeLabel: typeLabel,
    suggestedPrompt,
  };
  
  return {
    type: 'find_partner',
    label: `找${typeLabel}搭子？`,
    context,
  };
}

/**
 * 获取欢迎卡片数据
 * 
 * @param userId - 用户 ID，null 表示未登录
 * @param nickname - 用户昵称，null 表示未设置或未登录
 * @param location - 用户位置，null 表示未提供
 * @param currentHour - 当前小时（用于测试注入）
 */
export async function getWelcomeCard(
  userId: string | null,
  nickname: string | null,
  location: { lat: number; lng: number } | null,
  currentHour?: number
): Promise<WelcomeResponse> {
  const quickActions: QuickAction[] = [];

  // 1. 生成问候语
  // 未登录用户使用固定问候语
  const greeting = userId === null
    ? "Hi，我是小聚，你的 AI 活动助理。"
    : generateGreeting(nickname, currentHour);

  // 2. 尝试生成 explore_nearby 按钮（有位置即可，不需要登录）
  if (location) {
    const exploreAction = await buildExploreNearbyAction(location);
    if (exploreAction) quickActions.push(exploreAction);
  }

  // 3. 尝试生成 continue_draft 按钮（需要登录）
  if (userId) {
    const draftAction = await buildContinueDraftAction(userId);
    if (draftAction) quickActions.push(draftAction);
  }

  // 4. 生成 find_partner 按钮
  const partnerAction = await buildFindPartnerAction(userId);
  quickActions.push(partnerAction);

  // 5. 限制最多 3 个按钮
  const limitedActions = quickActions.slice(0, 3);

  return {
    greeting,
    quickActions: limitedActions,
    fallbackPrompt: '或者还有什么想法，今天想玩点什么，告诉我！～',
  };
}
