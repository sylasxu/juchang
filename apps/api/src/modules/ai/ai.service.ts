/**
 * AI Service - v4.0 模块化架构
 * 
 * 精简的服务层，编排各模块完成 AI Chat
 * 
 * 模块依赖：
 * - orchestrator - 编排层
 * - agent/ - Agent 核心
 * - intent/ - 意图识别
 * - memory/ - 会话存储
 * - tools/ - 工具系统
 * - models/ - 模型路由
 */

import { db, users, conversations, conversationMessages, eq, desc, sql, inArray } from '@juchang/db';
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

// 新架构模块
import { classifyIntent, type ClassifyResult } from './intent';
import { getOrCreateThread, saveMessage, clearUserThreads, deleteThread } from './memory';
import { getToolsByIntent, getToolWidgetType, getToolDisplayName } from './tools';
import { buildXmlSystemPrompt, type PromptContext, type ActivityDraftForPrompt } from './prompts/xiaoju-v39';
import { getModel } from './models/router';
import { recordTokenUsage } from './services/metrics';
// Guardrails
import { checkInput, sanitizeInput } from './guardrails/input-guard';
import { checkRateLimit } from './guardrails/rate-limiter';
// Observability
import { createLogger } from './observability/logger';
import { countAIRequest, recordAILatency, recordTokenUsage as recordMetricsTokenUsage } from './observability/metrics';
// WorkingMemory (Enhanced)
import { 
  getEnhancedUserProfile,
  updateEnhancedUserProfile,
  buildProfilePrompt,
} from './memory/working';
import { extractPreferences } from './memory/extractor';
// AI Pipeline
import { processAIContext } from './processors/ai-pipeline';
// Broker Mode
import { 
  shouldEnterBrokerMode, 
  recoverBrokerState, 
  createBrokerState,
  updateBrokerState,
  getNextQuestion,
  parseUserAnswer,
  persistBrokerState,
  type BrokerState,
} from './workflow/broker';
// Evals
import { evaluateResponseQuality } from './evals/runner';

const logger = createLogger('ai.service');

// ==========================================
// Types
// ==========================================

export interface ChatRequest {
  messages: Array<Omit<UIMessage, 'id'>>;
  userId: string | null;
  location?: [number, number];
  source: 'miniprogram' | 'admin';
  draftContext?: { activityId: string; currentDraft: ActivityDraftForPrompt };
  trace?: boolean;
  modelParams?: { temperature?: number; maxTokens?: number };
}

export interface TraceStep {
  toolName: string;
  toolCallId: string;
  args: unknown;
  result?: unknown;
}

// ==========================================
// AI 额度管理
// ==========================================

export async function checkAIQuota(userId: string): Promise<{ hasQuota: boolean; remaining: number }> {
  const [user] = await db
    .select({ aiCreateQuotaToday: users.aiCreateQuotaToday })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return { hasQuota: false, remaining: 0 };
  return { hasQuota: user.aiCreateQuotaToday > 0, remaining: user.aiCreateQuotaToday };
}

export async function consumeAIQuota(userId: string): Promise<boolean> {
  const [user] = await db
    .select({ aiCreateQuotaToday: users.aiCreateQuotaToday })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user || user.aiCreateQuotaToday <= 0) return false;

  await db.update(users)
    .set({ aiCreateQuotaToday: user.aiCreateQuotaToday - 1 })
    .where(eq(users.id, userId));
  return true;
}

// ==========================================
// AI Chat 核心
// ==========================================

export async function streamChat(request: ChatRequest): Promise<Response> {
  const { messages, userId, location, source, draftContext, trace, modelParams } = request;
  const startTime = Date.now();
  
  // 0. 提取最后一条用户消息（用于护栏检查）
  const conversationHistory = messages.map(m => ({
    role: m.role,
    content: (m.parts?.find((p): p is { type: 'text'; text: string } => p.type === 'text')?.text)
      || (m as unknown as { content?: string })?.content 
      || '',
  }));
  const lastUserMessage = conversationHistory.filter(m => m.role === 'user').pop()?.content || '';

  // 1. 频率限制检查
  const rateLimitResult = checkRateLimit(userId, { maxRequests: 30, windowSeconds: 60 });
  if (!rateLimitResult.allowed) {
    logger.warn('Rate limit exceeded', { userId, retryAfter: rateLimitResult.retryAfter });
    return createQuickResponse('请求太频繁了，休息一下再来吧～', trace);
  }

  // 2. 输入护栏检查
  const sanitizedMessage = sanitizeInput(lastUserMessage);
  const guardResult = checkInput(sanitizedMessage);
  if (guardResult.blocked) {
    logger.warn('Input blocked', { userId, reason: guardResult.reason, rules: guardResult.triggeredRules });
    return createQuickResponse(guardResult.suggestedResponse || '这个话题我帮不了你 😅', trace);
  }
  
  // 3. 构建上下文
  const locationName = location ? await reverseGeocode(location[1], location[0]) : undefined;
  const userNickname = userId ? await getUserNickname(userId) : undefined;
  
  // 4. 获取用户工作记忆（增强版用户画像）
  const userProfile = userId ? await getEnhancedUserProfile(userId) : null;
  
  const promptContext: PromptContext = {
    currentTime: new Date(),
    userLocation: location ? { lat: location[1], lng: location[0], name: locationName } : undefined,
    userNickname,
    draftContext,
    workingMemory: userProfile ? buildProfilePrompt(userProfile) : null,
  };

  // 5. 意图分类
  const intentResult = await classifyIntent(sanitizedMessage, {
    hasDraftContext: !!draftContext,
    conversationHistory,
    userId: userId || undefined,
  });
  logger.info('Intent classified', { intent: intentResult.intent, method: intentResult.method });

  // 5.5 Broker Mode 检查（找搭子追问流程）
  if (intentResult.intent === 'partner' && userId) {
    const thread = await getOrCreateThread(userId);
    const brokerState = await recoverBrokerState(thread.id);
    
    if (shouldEnterBrokerMode('partner', brokerState)) {
      return handleBrokerFlow(request, brokerState, thread.id, sanitizedMessage, intentResult);
    }
  }

  // 6. 特殊意图快速响应
  if (intentResult.intent === 'chitchat') {
    return handleChitchat(trace, intentResult);
  }

  // 7. 获取工具集
  const userLocation = location ? { lat: location[1], lng: location[0] } : null;
  const tools = getToolsByIntent(userId, intentResult.intent, !!draftContext, userLocation);
  logger.debug('Tools selected', { tools: Object.keys(tools) });

  // 8. 构建 System Prompt（使用 Pipeline 处理）
  const uiMessages: UIMessage[] = messages.map((m, i) => ({
    id: `msg-${i}`,
    role: m.role,
    content: (m as any).content || '',
    parts: (m as any).parts || [{ type: 'text', text: (m as any).content || '' }],
  }));
  const aiMessages = await convertToModelMessages(uiMessages);
  
  // 构建基础 System Prompt
  let systemPrompt = buildXmlSystemPrompt(promptContext);
  
  // 使用 Pipeline 处理上下文（注入用户画像、召回历史等）
  systemPrompt = await processAIContext({
    userId,
    message: sanitizedMessage,
    systemPrompt,
    history: conversationHistory,
  });

  // 9. 执行 LLM 推理
  const traceSteps: TraceStep[] = [];
  let totalUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  let aiResponseText = '';

  const result = streamText({
    model: getModel('deepseek-chat'),
    system: systemPrompt,
    messages: aiMessages,
    tools,
    temperature: modelParams?.temperature ?? 0,
    maxOutputTokens: modelParams?.maxTokens,
    stopWhen: [stepCountIs(5), hasToolCall('askPreference')],
    onStepFinish: (step) => {
      // 记录每一步的详细信息
      const stepNumber = traceSteps.length + 1;
      const stepType = (step as any).stepType; // 'initial' | 'continue' | 'tool-result'
      
      logger.debug('AI step finished', {
        stepNumber,
        stepType,
        toolCallsCount: step.toolCalls?.length || 0,
        toolResultsCount: step.toolResults?.length || 0,
        hasText: !!step.text,
        finishReason: step.finishReason,
      });
      
      // 收集 Tool Calls
      for (const tc of step.toolCalls || []) {
        if (!traceSteps.find(s => s.toolCallId === tc.toolCallId)) {
          traceSteps.push({ 
            toolName: tc.toolName, 
            toolCallId: tc.toolCallId, 
            args: (tc as any).args,
          });
          
          // 记录 Tool 调用日志
          logger.info('Tool called', {
            stepNumber,
            toolName: tc.toolName,
            toolCallId: tc.toolCallId,
          });
        }
      }
      
      // 收集 Tool Results
      for (const tr of step.toolResults || []) {
        const existing = traceSteps.find(s => s.toolCallId === tr.toolCallId);
        if (existing) {
          existing.result = (tr as any).result;
          
          // 记录 Tool 结果日志
          logger.info('Tool result received', {
            stepNumber,
            toolName: existing.toolName,
            toolCallId: tr.toolCallId,
            hasResult: !!(tr as any).result,
          });
        }
      }
      
      // 如果达到最大步数，记录警告
      if (stepNumber >= 5) {
        logger.warn('Max steps reached', {
          stepNumber,
          toolCalls: traceSteps.map(s => s.toolName),
        });
      }
    },
    onFinish: async ({ usage, text }) => {
      aiResponseText = text || '';
      const rawUsage = usage as any;
      totalUsage = {
        promptTokens: rawUsage.inputTokens ?? 0,
        completionTokens: rawUsage.outputTokens ?? 0,
        totalTokens: rawUsage.totalTokens ?? 0,
      };
      
      const duration = Date.now() - startTime;
      logger.info('AI request completed', { 
        source, userId: userId || 'anon', 
        tokens: totalUsage.totalTokens, 
        duration,
        intent: intentResult.intent,
      });
      
      // 记录指标
      countAIRequest('deepseek-chat', 'success');
      recordAILatency('deepseek-chat', duration);
      recordMetricsTokenUsage('deepseek-chat', totalUsage.promptTokens, totalUsage.completionTokens);
      
      // 记录 Token 使用量（日志）
      recordTokenUsage(userId, {
        inputTokens: totalUsage.promptTokens,
        outputTokens: totalUsage.completionTokens,
        totalTokens: totalUsage.totalTokens,
        cacheHitTokens: rawUsage.promptCacheHitTokens,
        cacheMissTokens: rawUsage.promptCacheMissTokens,
      }, traceSteps.map(s => ({ toolName: s.toolName })), {
        model: 'deepseek-chat',
        source,
        intent: intentResult.intent,
      });

      // 保存对话历史
      if (userId) {
        await persistConversation(userId, lastUserMessage, text || '', traceSteps);
        
        // 异步使用 LLM 提取用户偏好并更新画像
        extractPreferences(conversationHistory, { useLLM: true })
          .then(extraction => {
            if (extraction.preferences.length > 0 || extraction.frequentLocations.length > 0) {
              return updateEnhancedUserProfile(userId, extraction);
            }
          })
          .catch(err => 
            logger.warn('Failed to update user profile', { error: err.message })
          );
      }
      
      // 异步评估响应质量（不阻塞响应）
      evaluateResponseQuality({
        input: lastUserMessage,
        output: text || '',
        expectedIntent: intentResult.intent,
        actualToolCalls: traceSteps.map(s => s.toolName),
      }).then(evalResult => {
        if (evalResult.score < 0.6) {
          logger.warn('Low quality response detected', { 
            score: evalResult.score,
            details: evalResult.details,
            input: lastUserMessage.slice(0, 50),
          });
        }
      }).catch(() => {});
    },
  });

  // 10. 返回响应
  if (!trace) {
    return result.toUIMessageStreamResponse();
  }

  return wrapWithTrace(result, {
    requestId: randomUUID(),
    startedAt: new Date().toISOString(),
    intent: intentResult,
    systemPrompt,
    tools,
    traceSteps,
    totalUsage,
    aiResponseText,
    lastUserMessage,
  });
}

// ==========================================
// 辅助函数
// ==========================================

function createQuickResponse(text: string, trace?: boolean): Response {
  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      writer.write({ type: 'text-delta', delta: text, id: randomUUID() });
      if (trace) {
        const now = new Date().toISOString();
        writer.write({ type: 'data-trace-start' as any, data: { requestId: randomUUID(), startedAt: now, intent: 'blocked', intentMethod: 'guardrail' }, transient: true });
        writer.write({ type: 'data-trace-end' as any, data: { completedAt: now, status: 'blocked', output: { text, toolCalls: [] } }, transient: true });
      }
    },
  });
  return createUIMessageStreamResponse({ stream });
}

function handleChitchat(trace: boolean | undefined, _intent: ClassifyResult): Response {
  const responses = [
    '哈哈，我只会帮你组局约人，闲聊就不太行了～想约点什么？',
    '聊天我不太擅长，但组局我很在行！想找人一起玩点什么？',
    '我是组局小助手，帮你约人才是我的强项～有什么想玩的吗？',
  ];
  const text = responses[Math.floor(Math.random() * responses.length)];

  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      writer.write({ type: 'text-delta', delta: text, id: randomUUID() });
      if (trace) {
        const now = new Date().toISOString();
        writer.write({ type: 'data-trace-start' as any, data: { requestId: randomUUID(), startedAt: now, intent: _intent.intent, intentMethod: _intent.method }, transient: true });
        writer.write({ type: 'data-trace-end' as any, data: { completedAt: now, status: 'completed', output: { text, toolCalls: [] } }, transient: true });
      }
    },
  });
  return createUIMessageStreamResponse({ stream });
}

/**
 * 处理 Broker Mode 流程（找搭子追问）
 */
async function handleBrokerFlow(
  request: ChatRequest,
  existingState: BrokerState | null,
  threadId: string,
  userMessage: string,
  _intentResult: ClassifyResult
): Promise<Response> {
  const { userId, trace } = request;
  
  // 创建或恢复状态
  let state = existingState || createBrokerState();
  
  // 如果有现有状态，尝试解析用户回答
  if (existingState) {
    const currentQuestion = getNextQuestion(existingState);
    const answer = parseUserAnswer(userMessage, currentQuestion);
    
    if (answer) {
      state = updateBrokerState(state, answer.field, answer.value);
      logger.debug('Broker state updated', { field: answer.field, value: answer.value });
    }
  }
  
  // 获取下一个问题
  const nextQuestion = getNextQuestion(state);
  
  // 如果没有更多问题，信息收集完成
  if (!nextQuestion) {
    // 持久化完成状态
    if (userId) {
      await persistBrokerState(threadId, userId, { ...state, status: 'completed' });
    }
    
    // 返回确认消息，让 LLM 调用 createPartnerIntent
    const confirmText = `📋 需求确认：
- 🎯 活动类型：${state.collectedPreferences.activityType || '待定'}
- ⏰ 时间：${state.collectedPreferences.timeRange || '待定'}
${state.collectedPreferences.location ? `- 📍 地点：${state.collectedPreferences.location}` : ''}

正在帮你寻找匹配的搭子... 有消息第一时间叫你 🔔`;
    
    const stream = createUIMessageStream({
      execute: ({ writer }) => {
        writer.write({ type: 'text-delta', delta: confirmText, id: randomUUID() });
        // 返回 Widget 数据让前端显示
        writer.write({ 
          type: 'data' as any, 
          data: { 
            type: 'widget_ask_preference',
            payload: {
              status: 'completed',
              preferences: state.collectedPreferences,
            },
          },
        });
        if (trace) {
          const now = new Date().toISOString();
          writer.write({ type: 'data-trace-start' as any, data: { requestId: randomUUID(), startedAt: now, intent: 'partner', intentMethod: 'broker' }, transient: true });
          writer.write({ type: 'data-trace-end' as any, data: { completedAt: now, status: 'completed', output: { text: confirmText, toolCalls: [] } }, transient: true });
        }
      },
    });
    return createUIMessageStreamResponse({ stream });
  }
  
  // 持久化当前状态
  if (userId) {
    await persistBrokerState(threadId, userId, state);
  }
  
  // 返回追问
  const questionText = nextQuestion.question;
  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      writer.write({ type: 'text-delta', delta: questionText, id: randomUUID() });
      // 返回 Widget 数据让前端渲染选项按钮
      writer.write({ 
        type: 'data' as any, 
        data: { 
          type: 'widget_ask_preference',
          payload: {
            questionType: nextQuestion.field,
            question: nextQuestion.question,
            options: nextQuestion.options,
            brokerState: {
              workflowId: state.workflowId,
              round: state.round,
              collected: state.collectedPreferences,
            },
          },
        },
      });
      if (trace) {
        const now = new Date().toISOString();
        writer.write({ type: 'data-trace-start' as any, data: { requestId: randomUUID(), startedAt: now, intent: 'partner', intentMethod: 'broker' }, transient: true });
        writer.write({ type: 'data-trace-end' as any, data: { completedAt: now, status: 'collecting', output: { text: questionText, toolCalls: [] } }, transient: true });
      }
    },
  });
  return createUIMessageStreamResponse({ stream });
}

async function persistConversation(
  userId: string,
  userMessage: string,
  assistantResponse: string,
  toolCalls: TraceStep[]
) {
  try {
    const { id: threadId } = await getOrCreateThread(userId);
    
    if (userMessage) {
      await saveMessage({ conversationId: threadId, userId, role: 'user', messageType: 'text', content: { text: userMessage } });
    }

    const activityId = toolCalls.find(tc => (tc.result as any)?.activityId)?.result as { activityId?: string } | undefined;
    let messageType = 'text';
    if (toolCalls.length > 0) {
      const widgetType = getToolWidgetType(toolCalls[toolCalls.length - 1].toolName);
      if (widgetType) messageType = widgetType;
    }

    await saveMessage({
      conversationId: threadId,
      userId,
      role: 'assistant',
      messageType,
      content: { text: assistantResponse, toolCalls: toolCalls.map(tc => ({ toolName: tc.toolName, args: tc.args, result: tc.result })) },
      activityId: activityId?.activityId,
    });
  } catch (error) {
    console.error('[AI] Failed to save conversation:', error);
  }
}

function wrapWithTrace(result: ReturnType<typeof streamText>, ctx: {
  requestId: string;
  startedAt: string;
  intent: ClassifyResult;
  systemPrompt: string;
  tools: Record<string, unknown>;
  traceSteps: TraceStep[];
  totalUsage: { promptTokens: number; completionTokens: number; totalTokens: number };
  aiResponseText: string;
  lastUserMessage: string;
}): Response {
  const llmStartedAt = new Date().toISOString();
  const llmStepId = `step-llm`;

  const toolsInfo = Object.keys(ctx.tools).map(name => {
    const t = (ctx.tools as any)[name];
    let inputSchema = {};
    if (t.inputSchema?.jsonSchema) inputSchema = t.inputSchema.jsonSchema;
    else if (t.inputSchema) inputSchema = t.inputSchema;
    else if (t.parameters) inputSchema = t.parameters;
    return { name, description: t.description || '', schema: inputSchema };
  });

  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      writer.write({
        type: 'data-trace-start',
        data: { requestId: ctx.requestId, startedAt: ctx.startedAt, systemPrompt: ctx.systemPrompt, tools: toolsInfo, intent: ctx.intent.intent, intentMethod: ctx.intent.method },
        transient: true,
      });

      writer.write({
        type: 'data-trace-step',
        data: { id: `${ctx.requestId}-input`, type: 'input', name: '用户输入', startedAt: ctx.startedAt, completedAt: ctx.startedAt, status: 'success', duration: 0, data: { text: ctx.lastUserMessage } },
        transient: true,
      });

      writer.write({
        type: 'data-trace-step',
        data: { id: llmStepId, type: 'llm', name: 'LLM 推理', startedAt: llmStartedAt, status: 'running', data: { model: 'deepseek', inputTokens: 0, outputTokens: 0, totalTokens: 0 } },
        transient: true,
      });

      writer.merge(result.toUIMessageStream({
        onFinish: async () => {
          const llmCompletedAt = new Date().toISOString();
          const llmDuration = new Date(llmCompletedAt).getTime() - new Date(llmStartedAt).getTime();

          writer.write({
            type: 'data-trace-step-update',
            data: { stepId: llmStepId, completedAt: llmCompletedAt, status: 'success', duration: llmDuration, data: { model: 'deepseek', inputTokens: ctx.totalUsage.promptTokens, outputTokens: ctx.totalUsage.completionTokens, totalTokens: ctx.totalUsage.totalTokens } },
            transient: true,
          });

          for (const step of ctx.traceSteps) {
            writer.write({
              type: 'data-trace-step',
              data: { id: `${ctx.requestId}-tool-${step.toolCallId}`, type: 'tool', name: getToolDisplayName(step.toolName), startedAt: llmCompletedAt, completedAt: llmCompletedAt, status: 'success', duration: 0, data: { toolName: step.toolName, input: step.args, output: step.result, widgetType: getToolWidgetType(step.toolName) } },
              transient: true,
            });
          }

          const completedAt = new Date().toISOString();
          const totalDuration = new Date(completedAt).getTime() - new Date(ctx.startedAt).getTime();
          writer.write({
            type: 'data-trace-end',
            data: { requestId: ctx.requestId, completedAt, totalDuration, status: 'completed', output: { text: ctx.aiResponseText || null, toolCalls: ctx.traceSteps.map(s => ({ name: s.toolName, input: s.args, output: s.result })) } },
            transient: true,
          });
        },
      }));
    },
  });

  return createUIMessageStreamResponse({ stream });
}

async function getUserNickname(userId: string): Promise<string | undefined> {
  const [user] = await db.select({ nickname: users.nickname }).from(users).where(eq(users.id, userId)).limit(1);
  return user?.nickname || undefined;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const locations = [
    { name: '观音桥', lat: 29.5630, lng: 106.5516, radius: 0.02 },
    { name: '解放碑', lat: 29.5647, lng: 106.5770, radius: 0.02 },
    { name: '南坪', lat: 29.5230, lng: 106.5516, radius: 0.02 },
    { name: '沙坪坝', lat: 29.5410, lng: 106.4550, radius: 0.02 },
  ];
  for (const loc of locations) {
    if (Math.sqrt(Math.pow(lat - loc.lat, 2) + Math.pow(lng - loc.lng, 2)) <= loc.radius) return loc.name;
  }
  return '附近';
}

// ==========================================
// 会话管理 API
// ==========================================

export async function listConversations(params: { userId?: string; page?: number; limit?: number }) {
  const { userId, page = 1, limit = 20 } = params;
  const offset = (page - 1) * limit;

  const whereClause = userId ? eq(conversations.userId, userId) : undefined;

  const [items, countResult] = await Promise.all([
    db
      .select({
        id: conversations.id,
        userId: conversations.userId,
        title: conversations.title,
        messageCount: conversations.messageCount,
        lastMessageAt: conversations.lastMessageAt,
        createdAt: conversations.createdAt,
      })
      .from(conversations)
      .where(whereClause)
      .orderBy(desc(conversations.lastMessageAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(conversations)
      .where(whereClause),
  ]);

  // 获取用户昵称
  const userIds = [...new Set(items.map(i => i.userId))];
  const userNicknames = userIds.length > 0
    ? await db.select({ id: users.id, nickname: users.nickname }).from(users).where(inArray(users.id, userIds))
    : [];
  const nicknameMap = new Map(userNicknames.map(u => [u.id, u.nickname]));

  return {
    items: items.map(i => ({
      ...i,
      userNickname: nicknameMap.get(i.userId) || null,
      lastMessageAt: i.lastMessageAt?.toISOString() || new Date().toISOString(),
      createdAt: i.createdAt.toISOString(),
    })),
    total: Number(countResult[0]?.count || 0),
  };
}

export async function getConversationMessages(conversationId: string) {
  const [conv] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);

  if (!conv) return { conversation: null, messages: [] };

  const [user] = await db.select({ nickname: users.nickname }).from(users).where(eq(users.id, conv.userId)).limit(1);

  const msgs = await db
    .select()
    .from(conversationMessages)
    .where(eq(conversationMessages.conversationId, conversationId))
    .orderBy(conversationMessages.createdAt);

  return {
    conversation: {
      id: conv.id,
      userId: conv.userId,
      userNickname: user?.nickname || null,
      title: conv.title,
      messageCount: conv.messageCount,
      lastMessageAt: conv.lastMessageAt?.toISOString() || new Date().toISOString(),
      createdAt: conv.createdAt.toISOString(),
    },
    messages: msgs.map(m => ({
      id: m.id,
      role: m.role,
      messageType: m.messageType,
      content: m.content,
      activityId: m.activityId,
      createdAt: m.createdAt.toISOString(),
    })),
  };
}

export async function deleteConversation(conversationId: string): Promise<boolean> {
  return deleteThread(conversationId);
}

export async function deleteConversationsBatch(ids: string[]): Promise<{ deletedCount: number }> {
  if (ids.length === 0) return { deletedCount: 0 };
  
  const result = await db
    .delete(conversations)
    .where(inArray(conversations.id, ids))
    .returning({ id: conversations.id });

  return { deletedCount: result.length };
}

export async function clearConversations(userId: string): Promise<{ deletedCount: number }> {
  return clearUserThreads(userId);
}

export async function getOrCreateCurrentConversation(userId: string) {
  return getOrCreateThread(userId);
}

export async function addMessageToConversation(params: {
  conversationId: string;
  userId: string;
  role: 'user' | 'assistant';
  messageType: string;
  content: unknown;
}) {
  return saveMessage({
    conversationId: params.conversationId,
    userId: params.userId,
    role: params.role,
    messageType: params.messageType,
    content: params.content,
  });
}

export async function getMessagesByActivityId(activityId: string) {
  const msgs = await db
    .select({
      id: conversationMessages.id,
      userId: conversationMessages.userId,
      role: conversationMessages.role,
      messageType: conversationMessages.messageType,
      content: conversationMessages.content,
      createdAt: conversationMessages.createdAt,
    })
    .from(conversationMessages)
    .where(eq(conversationMessages.activityId, activityId))
    .orderBy(conversationMessages.createdAt);

  const userIds = [...new Set(msgs.map(m => m.userId))];
  const userNicknames = userIds.length > 0
    ? await db.select({ id: users.id, nickname: users.nickname }).from(users).where(inArray(users.id, userIds))
    : [];
  const nicknameMap = new Map(userNicknames.map(u => [u.id, u.nickname]));

  return {
    items: msgs.map(m => ({
      ...m,
      userNickname: nicknameMap.get(m.userId) || null,
      createdAt: m.createdAt.toISOString(),
    })),
    total: msgs.length,
  };
}

// ==========================================
// Welcome Card
// ==========================================

export interface WelcomeSection {
  id: string;
  icon: string;
  title: string;
  items: Array<{
    type: 'draft' | 'suggestion' | 'explore';
    icon?: string;
    label: string;
    prompt: string;
    context?: unknown;
  }>;
}

export interface WelcomeResponse {
  greeting: string;
  subGreeting?: string;
  sections: WelcomeSection[];
}

export function generateGreeting(nickname: string | null): string {
  const hour = new Date().getHours();
  const name = nickname || '朋友';
  
  if (hour < 6) return `夜深了，${name}～`;
  if (hour < 9) return `早上好，${name}！`;
  if (hour < 12) return `上午好，${name}！`;
  if (hour < 14) return `中午好，${name}！`;
  if (hour < 18) return `下午好，${name}！`;
  if (hour < 22) return `晚上好，${name}！`;
  return `夜深了，${name}～`;
}

export async function getWelcomeCard(
  _userId: string | null,
  nickname: string | null,
  location: { lat: number; lng: number } | null
): Promise<WelcomeResponse> {
  const greeting = generateGreeting(nickname);
  const sections: WelcomeSection[] = [];

  // 快速组局建议
  const suggestions: WelcomeSection = {
    id: 'suggestions',
    icon: '💡',
    title: '快速组局',
    items: [
      { type: 'suggestion', icon: '🍜', label: '约饭局', prompt: '帮我组一个吃饭的局' },
      { type: 'suggestion', icon: '🎮', label: '打游戏', prompt: '想找人一起打游戏' },
      { type: 'suggestion', icon: '🏃', label: '运动', prompt: '想找人一起运动' },
      { type: 'suggestion', icon: '☕', label: '喝咖啡', prompt: '想约人喝咖啡聊天' },
    ],
  };
  sections.push(suggestions);

  // 探索附近（有位置时显示）
  if (location) {
    const locationName = await reverseGeocode(location.lat, location.lng);
    const explore: WelcomeSection = {
      id: 'explore',
      icon: '📍',
      title: '探索附近',
      items: [
        { 
          type: 'explore', 
          icon: '🔍', 
          label: `看看${locationName}有什么局`, 
          prompt: `看看${locationName}附近有什么活动`,
          context: { locationName, lat: location.lat, lng: location.lng },
        },
      ],
    };
    sections.push(explore);
  }

  return {
    greeting,
    subGreeting: '想约点什么？',
    sections,
  };
}
