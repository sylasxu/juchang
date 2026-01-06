// AI Service - v3.7 统一 AI Chat (Data Stream Protocol + Execution Trace + Message Enrichment + Conversations)
import { db, users, conversations, conversationMessages, activities, participants, eq, desc, sql } from '@juchang/db';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { 
  streamText, 
  createUIMessageStream, 
  createUIMessageStreamResponse,
  convertToModelMessages,
  stepCountIs,
  hasToolCall,
  type UIMessage,
} from 'ai';
import { randomUUID } from 'crypto';
import type { 
  ConversationsQuery,
  ConversationMessageType,
  WelcomeResponse,
  QuickAction,
  ExploreNearbyContext,
  ContinueDraftContext,
  FindPartnerContext,
} from './ai.model';
import { buildXmlSystemPrompt, type PromptContext, type ActivityDraftForPrompt } from './prompts/xiaoju-v38';
import { getAIToolsV34, getToolsByIntent, classifyIntent } from './tools';
import { recordTokenUsage } from './services/metrics';
import { enrichMessages, injectContextToSystemPrompt, type EnrichmentContext } from './enrichment';

/**
 * DeepSeek Provider 配置
 * 使用官方 @ai-sdk/deepseek provider
 * 
 * 注意：延迟初始化，确保 .env 已加载
 */
let _deepseek: ReturnType<typeof createDeepSeek> | null = null;

function getDeepSeekProvider() {
  if (!_deepseek) {
    _deepseek = createDeepSeek({
      apiKey: process.env.DEEPSEEK_API_KEY || '',
    });
  }
  return _deepseek;
}

/**
 * 获取 AI 模型配置
 * 简化为单一 DeepSeek provider
 */
function getAIModel() {
  return getDeepSeekProvider()('deepseek-chat');
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
 * Chat 请求参数 (v3.7 支持模型参数配置)
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
  /** 执行追踪，返回详细的执行步骤数据 */
  trace?: boolean;
  /** 模型参数（Admin Playground 用） */
  modelParams?: {
    temperature?: number;
    maxTokens?: number;
  };
}

/**
 * 统一 AI Chat - 返回 Data Stream Response (v3.6)
 * 
 * 小程序和 Admin 都使用此函数，返回 Vercel AI SDK 标准格式。
 * 
 * v3.6 新特性：
 * - 消息增强 (Message Enrichment)：自动注入时间、位置、草稿上下文
 * - XML 结构化 Prompt：基于 Claude 4.x Best Practices
 * 
 * v3.5 特性：
 * - trace 参数：返回执行追踪数据（Admin Playground 调试用）
 * 
 * v3.4 特性：
 * - 使用新的 System Prompt（草稿优先模式）
 * - 支持 draftContext 多轮对话
 * - 4 个 Tools：createActivityDraft, refineDraft, exploreNearby, publishActivity
 * - Token 使用量记录
 */
export async function streamChat(request: StreamChatRequest) {
  const { messages, userId, location, source, draftContext, trace, modelParams } = request;
  
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

  // 构建消息增强上下文
  const enrichmentContext: EnrichmentContext = {
    userId,
    location: location ? {
      lat: location[1],
      lng: location[0],
      name: locationName,
    } : undefined,
    draftContext,
    conversationHistory: messages.map(m => ({
      role: m.role,
      content: m.parts?.find((p): p is { type: 'text'; text: string } => p.type === 'text')?.text || '',
    })),
    currentTime: new Date(),
  };

  // 执行消息增强
  const { enrichedMessages, contextXml, enrichmentTrace } = await enrichMessages(
    messages as UIMessage[],
    enrichmentContext
  );

  // 转换消息格式，自动处理 UIMessage 中的 parts（包含 Tool 调用历史）
  const aiMessages = await convertToModelMessages(enrichedMessages);
  
  // 构建 XML 结构化 System Prompt（v3.6），注入增强上下文
  const systemPrompt = buildXmlSystemPrompt(promptContext, contextXml);
  
  // v3.9: 动态加载 Tools，根据意图只加载需要的 Tool，减少 Token 消耗
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  const lastUserText = lastUserMessage?.parts?.find((p): p is { type: 'text'; text: string } => p.type === 'text')?.text 
    || (lastUserMessage as { content?: string })?.content 
    || '';
  const intent = classifyIntent(lastUserText, !!draftContext);
  const tools = getToolsByIntent(userId, intent, !!draftContext);
  
  console.log(`[AI Chat] Intent: ${intent}, Tools: ${Object.keys(tools).join(', ')}`);
  
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
    tools: tools,
    temperature: modelParams?.temperature ?? 0, // 默认 0，更一致的 Tool 调用结果
    maxOutputTokens: modelParams?.maxTokens,
    // 1. 最多 5 步（使用 stepCountIs）
    // 2. 如果调用了 askPreference，立即停止（使用 hasToolCall）
    stopWhen: [stepCountIs(5), hasToolCall('askPreference')],
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
    onFinish: async ({ usage, text, response }) => {
      // 直接使用 DeepSeek provider 标准化的 usage 格式
      // DeepSeek 返回的 usage 可能包含 prompt_cache_hit_tokens 和 prompt_cache_miss_tokens
      const rawUsage = usage as unknown as {
        inputTokens?: number;
        outputTokens?: number;
        totalTokens?: number;
        // DeepSeek 特有的缓存字段（通过 experimental_providerMetadata 或直接在 usage 中）
        promptCacheHitTokens?: number;
        promptCacheMissTokens?: number;
      };
      
      totalUsage = {
        promptTokens: rawUsage.inputTokens ?? 0,
        completionTokens: rawUsage.outputTokens ?? 0,
        totalTokens: rawUsage.totalTokens ?? 0,
      };
      
      // 提取缓存信息（DeepSeek 可能通过不同方式返回）
      const cacheHitTokens = rawUsage.promptCacheHitTokens;
      const cacheMissTokens = rawUsage.promptCacheMissTokens;
      
      console.log(`[AI Chat] Source: ${source}, User: ${userId || 'anonymous'}, Tokens: ${totalUsage.totalTokens}, Tools: ${traceSteps.length}`);
      
      // 始终记录 Token 使用量（userId 为 null 时记录为匿名）
      await recordTokenUsage(
        userId,
        {
          inputTokens: totalUsage.promptTokens,
          outputTokens: totalUsage.completionTokens,
          totalTokens: totalUsage.totalTokens,
          cacheHitTokens,
          cacheMissTokens,
        },
        traceSteps.map(s => ({ toolName: s.toolName }))
      );
      
      // v3.9: 保存对话历史到数据库
      // 有登录用户就保存，没有就不保存
      if (userId) {
        try {
          // 获取或创建会话
          const { id: conversationId } = await getOrCreateCurrentConversation(userId);
          
          // 提取最后一条用户消息
          const lastUserMessage = messages.filter(m => m.role === 'user').pop();
          const lastUserText = lastUserMessage?.parts?.find((p): p is { type: 'text'; text: string } => p.type === 'text')?.text 
            || (lastUserMessage as { content?: string })?.content 
            || '';
          
          // 保存用户消息
          if (lastUserText) {
            await addMessageToConversation({
              conversationId,
              userId,
              role: 'user',
              messageType: 'text',
              content: { text: lastUserText },
            });
          }
          
          // 从 Tool 结果中提取 activityId（如果有）
          let activityId: string | undefined;
          for (const step of traceSteps) {
            const result = step.result as { activityId?: string } | undefined;
            if (result?.activityId) {
              activityId = result.activityId;
              break;
            }
          }
          
          // 确定 AI 响应的消息类型
          let messageType: string = 'text';
          if (traceSteps.length > 0) {
            const lastTool = traceSteps[traceSteps.length - 1];
            const widgetType = getWidgetType(lastTool.toolName);
            if (widgetType) {
              messageType = widgetType;
            }
          }
          
          // 保存 AI 响应
          await addMessageToConversation({
            conversationId,
            userId,
            role: 'assistant',
            messageType: messageType as any,
            content: {
              text: text || '',
              toolCalls: traceSteps.map(s => ({
                toolName: s.toolName,
                args: s.args,
                result: s.result,
              })),
            },
            activityId,
          });
          
          console.log(`[AI Chat] Saved conversation: ${conversationId}, activityId: ${activityId || 'none'}`);
        } catch (error) {
          // 保存失败不影响响应
          console.error('[AI Chat] Failed to save conversation:', error);
        }
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
      // 提取 tool 的 schema 信息
      const toolsInfo = Object.keys(tools).map(name => {
        const t = (tools as any)[name];
        // AI SDK tool 结构可能是:
        // - { inputSchema: { jsonSchema: {...} } } (jsonSchema wrapper)
        // - { inputSchema: {...} } (直接是 schema)
        // - { parameters: {...} } (旧版 API)
        let inputSchema = {};
        if (t.inputSchema) {
          // 检查是否有 jsonSchema 属性
          if (t.inputSchema.jsonSchema) {
            inputSchema = t.inputSchema.jsonSchema;
          } else if (typeof t.inputSchema === 'object') {
            // 直接使用 inputSchema
            inputSchema = t.inputSchema;
          }
        } else if (t.parameters) {
          inputSchema = t.parameters;
        }
        return {
          name,
          description: t.description || '',
          schema: inputSchema,
        };
      });
      
      writer.write({
        type: 'data-trace-start',
        data: { 
          requestId, 
          startedAt,
          systemPrompt,
          tools: toolsInfo,
        },
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
            enrichmentTrace: enrichmentTrace.length > 0 ? enrichmentTrace : undefined,
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
    getDraft: '获取草稿',
    refineDraft: '修改草稿',
    publishActivity: '发布活动',
    exploreNearby: '探索附近',
    getActivityDetail: '查看活动详情',
    joinActivity: '报名活动',
    cancelActivity: '取消活动',
    getMyActivities: '查看我的活动',
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
    getDraft: 'widget_draft',
    refineDraft: 'widget_draft',
    exploreNearby: 'widget_explore',
    getActivityDetail: 'widget_detail',
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




// ==========================================
// 探索场景类型定义
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


// ==========================================
// 按活动 ID 查询关联消息
// ==========================================

/**
 * 按活动 ID 查询关联的对话消息
 * 用于 Admin 查看某个活动是通过哪些 AI 对话创建的
 */
export async function getMessagesByActivityId(activityId: string): Promise<{
  items: Array<{
    id: string;
    conversationId: string;
    userId: string;
    userNickname: string | null;
    role: 'user' | 'assistant';
    messageType: string;
    content: unknown;
    createdAt: string;
  }>;
  total: number;
}> {
  // 查询关联此活动的所有消息
  const msgs = await db
    .select({
      id: conversationMessages.id,
      conversationId: conversationMessages.conversationId,
      userId: conversationMessages.userId,
      userNickname: users.nickname,
      role: conversationMessages.role,
      messageType: conversationMessages.messageType,
      content: conversationMessages.content,
      createdAt: conversationMessages.createdAt,
    })
    .from(conversationMessages)
    .leftJoin(users, eq(conversationMessages.userId, users.id))
    .where(eq(conversationMessages.activityId, activityId))
    .orderBy(conversationMessages.createdAt);

  // 如果找到消息，获取完整的会话上下文
  if (msgs.length > 0) {
    // 获取所有相关的 conversationId
    const conversationIds = [...new Set(msgs.map(m => m.conversationId))];
    
    // 查询这些会话的所有消息（提供完整上下文）
    const allMsgs = await db
      .select({
        id: conversationMessages.id,
        conversationId: conversationMessages.conversationId,
        userId: conversationMessages.userId,
        userNickname: users.nickname,
        role: conversationMessages.role,
        messageType: conversationMessages.messageType,
        content: conversationMessages.content,
        createdAt: conversationMessages.createdAt,
      })
      .from(conversationMessages)
      .leftJoin(users, eq(conversationMessages.userId, users.id))
      .where(sql`${conversationMessages.conversationId} IN (${sql.join(conversationIds.map(id => sql`${id}`), sql`, `)})`)
      .orderBy(conversationMessages.createdAt);

    return {
      items: allMsgs.map(m => ({
        ...m,
        role: m.role as 'user' | 'assistant',
        createdAt: m.createdAt.toISOString(),
      })),
      total: allMsgs.length,
    };
  }

  return { items: [], total: 0 };
}

/**
 * 清空用户对话历史（删除所有会话）
 */
export async function clearConversations(userId: string): Promise<{ deletedCount: number }> {
  // 删除用户的所有会话（消息会级联删除）
  const result = await db
    .delete(conversations)
    .where(eq(conversations.userId, userId))
    .returning({ id: conversations.id });
  
  return { deletedCount: result.length };
}

/**
 * 删除单个会话（Admin 用）
 */
export async function deleteConversation(conversationId: string): Promise<boolean> {
  const result = await db
    .delete(conversations)
    .where(eq(conversations.id, conversationId))
    .returning({ id: conversations.id });
  
  return result.length > 0;
}

/**
 * 批量删除会话（Admin 用）
 */
export async function deleteConversationsBatch(conversationIds: string[]): Promise<{ deletedCount: number }> {
  if (conversationIds.length === 0) {
    return { deletedCount: 0 };
  }
  
  const result = await db
    .delete(conversations)
    .where(sql`${conversations.id} IN (${sql.join(conversationIds.map(id => sql`${id}`), sql`, `)})`)
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


// ==========================================
// 会话管理 v3.8 (两层结构: conversations + conversationMessages)
// ==========================================

/**
 * 会话列表项（Admin 对话审计用）
 */
export interface ConversationListItem {
  id: string;
  userId: string;
  userNickname: string | null;
  title: string | null;
  messageCount: number;
  lastMessageAt: string;
  createdAt: string;
}

/**
 * 获取会话列表（Admin 模式）
 */
export async function listConversations(params: {
  page?: number;
  limit?: number;
  userId?: string;
}): Promise<{ items: ConversationListItem[]; total: number }> {
  const { page = 1, limit = 20, userId } = params;
  const offset = (page - 1) * limit;

  // 构建 WHERE 条件
  let whereConditions = sql`1=1`;
  if (userId) {
    whereConditions = sql`${conversations.userId} = ${userId}`;
  }

  // 查询总数
  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(conversations)
    .where(whereConditions);

  const total = countResult?.count || 0;

  // 查询数据
  const items = await db
    .select({
      id: conversations.id,
      userId: conversations.userId,
      userNickname: users.nickname,
      title: conversations.title,
      messageCount: conversations.messageCount,
      lastMessageAt: conversations.lastMessageAt,
      createdAt: conversations.createdAt,
    })
    .from(conversations)
    .leftJoin(users, eq(conversations.userId, users.id))
    .where(whereConditions)
    .orderBy(desc(conversations.lastMessageAt))
    .limit(limit)
    .offset(offset);

  return {
    items: items.map(item => ({
      ...item,
      lastMessageAt: item.lastMessageAt.toISOString(),
      createdAt: item.createdAt.toISOString(),
    })),
    total,
  };
}

/**
 * 获取会话的消息列表
 */
export async function getConversationMessages(conversationId: string): Promise<{
  conversation: ConversationListItem | null;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    messageType: string;
    content: unknown;
    activityId: string | null;
    createdAt: string;
  }>;
}> {
  // 获取会话信息
  const [conv] = await db
    .select({
      id: conversations.id,
      userId: conversations.userId,
      userNickname: users.nickname,
      title: conversations.title,
      messageCount: conversations.messageCount,
      lastMessageAt: conversations.lastMessageAt,
      createdAt: conversations.createdAt,
    })
    .from(conversations)
    .leftJoin(users, eq(conversations.userId, users.id))
    .where(eq(conversations.id, conversationId))
    .limit(1);

  if (!conv) {
    return { conversation: null, messages: [] };
  }

  // 获取消息列表
  const msgs = await db
    .select({
      id: conversationMessages.id,
      role: conversationMessages.role,
      messageType: conversationMessages.messageType,
      content: conversationMessages.content,
      activityId: conversationMessages.activityId,
      createdAt: conversationMessages.createdAt,
    })
    .from(conversationMessages)
    .where(eq(conversationMessages.conversationId, conversationId))
    .orderBy(conversationMessages.createdAt);

  return {
    conversation: {
      ...conv,
      lastMessageAt: conv.lastMessageAt.toISOString(),
      createdAt: conv.createdAt.toISOString(),
    },
    messages: msgs.map(m => ({
      ...m,
      role: m.role as 'user' | 'assistant',
      createdAt: m.createdAt.toISOString(),
    })),
  };
}

/**
 * 创建新会话
 */
export async function createConversation(userId: string, title?: string): Promise<{ id: string }> {
  const [conv] = await db
    .insert(conversations)
    .values({
      userId,
      title: title || null,
      messageCount: 0,
    })
    .returning({ id: conversations.id });

  return { id: conv.id };
}

/**
 * 添加消息到会话
 */
export async function addMessageToConversation(params: {
  conversationId: string;
  userId: string;
  role: 'user' | 'assistant';
  messageType: string;
  content: unknown;
  activityId?: string;
}): Promise<{ id: string }> {
  const { conversationId, userId, role, messageType, content, activityId } = params;

  // 插入消息
  const [msg] = await db
    .insert(conversationMessages)
    .values({
      conversationId,
      userId,
      role,
      messageType: messageType as any,
      content,
      activityId,
    })
    .returning({ id: conversationMessages.id });

  // 更新会话的 messageCount 和 lastMessageAt
  await db
    .update(conversations)
    .set({
      messageCount: sql`${conversations.messageCount} + 1`,
      lastMessageAt: new Date(),
      // 如果是第一条用户消息且没有标题，自动设置标题
      ...(role === 'user' && !activityId ? {
        title: sql`COALESCE(${conversations.title}, LEFT(${typeof content === 'object' && content && 'text' in content ? (content as { text: string }).text : String(content)}::text, 50))`,
      } : {}),
    })
    .where(eq(conversations.id, conversationId));

  return { id: msg.id };
}

/**
 * 获取或创建用户的当前会话
 * 如果用户没有活跃会话，创建一个新的
 */
export async function getOrCreateCurrentConversation(userId: string): Promise<{ id: string; isNew: boolean }> {
  // 查找最近的会话（24小时内）
  const [recent] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(sql`${conversations.userId} = ${userId} AND ${conversations.lastMessageAt} > NOW() - INTERVAL '24 hours'`)
    .orderBy(desc(conversations.lastMessageAt))
    .limit(1);

  if (recent) {
    return { id: recent.id, isNew: false };
  }

  // 创建新会话
  const { id } = await createConversation(userId);
  return { id, isNew: true };
}
