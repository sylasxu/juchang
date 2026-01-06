// AI Service - v3.7 统一 AI Chat (Data Stream Protocol + Execution Trace + Message Enrichment + Conversations)
import { db, users, conversations, conversationMessages, activities, participants, eq, desc, sql } from '@juchang/db';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { 
  streamText, 
  generateObject,
  jsonSchema,
  createUIMessageStream, 
  createUIMessageStreamResponse,
  convertToModelMessages,
  stepCountIs,
  hasToolCall,
  type UIMessage,
} from 'ai';
import { t } from 'elysia';
import { randomUUID } from 'crypto';
import type { 
  ConversationsQuery,
  ConversationMessageType,
  ContinueDraftContext,
} from './ai.model';
import { buildXmlSystemPrompt, type PromptContext, type ActivityDraftForPrompt } from './prompts/xiaoju-v38';
import { getAIToolsV34, getToolsByIntent, type IntentType } from './tools';
import { recordTokenUsage } from './services/metrics';
import { enrichMessages, injectContextToSystemPrompt, type EnrichmentContext } from './enrichment';
import { shouldEvaluate, runEvaluation, EVALUATION_CONFIG, type EvaluationResult } from './services/evaluation';
import { toJsonSchema } from '@juchang/utils';

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
// 意图分类 (混合模式：正则优先 + LLM 兜底)
// ==========================================

/**
 * 正则快速分类意图（无延迟）
 */
function classifyIntentByRegex(text: string, hasDraftContext: boolean): IntentType {
  const lowerText = text.toLowerCase();
  
  // 空闲/暂停意图（优先级最高）
  if (/改天|下次|先这样|不用了|算了|没事了|好的.*谢|谢谢.*不|拜拜|再见|88|byebye/.test(lowerText)) {
    return 'idle';
  }
  
  // 管理意图
  if (/我的活动|我发布的|我参与的|取消活动|不办了/.test(lowerText)) {
    return 'manage';
  }
  
  // 修改意图（需要草稿上下文）
  if (hasDraftContext && /改|换|加|减|调|发布|没问题|就这样/.test(lowerText)) {
    return 'create';
  }
  
  // 明确创建意图
  if (/帮我组|帮我创建|自己组|我来组|我要组|我想组/.test(lowerText)) {
    return 'create';
  }
  
  // 探索意图
  if (/想找|找人|一起|有什么|附近|推荐|看看|想.*打|想.*吃|想.*玩/.test(lowerText)) {
    return 'explore';
  }
  
  // 兜底探索
  if (/想|约/.test(lowerText)) {
    return 'explore';
  }
  
  return 'unknown';
}

/** 意图分类 Schema */
const IntentClassificationSchema = t.Object({
  intent: t.Union([
    t.Literal('create'),
    t.Literal('explore'),
    t.Literal('manage'),
    t.Literal('idle'),
    t.Literal('unknown'),
  ], { description: '用户意图分类' }),
  confidence: t.Number({ description: '置信度 0-1' }),
});

type IntentClassification = typeof IntentClassificationSchema.static;

/**
 * 使用 LLM 分类用户意图（仅在正则无法识别时调用）
 */
async function classifyIntentWithLLM(
  messages: Array<{ role: string; content: string }>,
  hasDraftContext: boolean
): Promise<IntentType> {
  // 只取最近 3 轮对话，减少 token
  const recentMessages = messages.slice(-6);
  const conversationText = recentMessages
    .map(m => `${m.role === 'user' ? '用户' : 'AI'}: ${m.content}`)
    .join('\n');

  const contextHint = hasDraftContext ? '（当前有活动草稿待确认）' : '';

  try {
    const result = await generateObject({
      model: getAIModel(),
      schema: jsonSchema<IntentClassification>(toJsonSchema(IntentClassificationSchema)),
      prompt: `你是一个意图分类器。根据对话历史，判断用户当前的意图。${contextHint}

意图类型：
- create: 用户想创建/组织/发布活动（如"帮我组一个"、"我要发布"、"创建活动"）
- explore: 用户想找活动/探索附近/询问推荐（如"想找人一起"、"附近有什么"、"推荐一下"）
- manage: 用户想管理自己的活动（如"我的活动"、"取消活动"、"查看报名"）
- idle: 用户暂时没有明确需求，闲聊或暂停（如"改天再说"、"先这样"、"不用了"、"谢谢"）
- unknown: 无法判断

注意：
1. 如果用户在回答 AI 的问题（如选择地点、时间），应继承之前的意图
2. "解放碑"、"明天"这类短回答通常是在回答问题，不是新意图
3. 用户表示暂停、拒绝、告别时，应分类为 idle

对话历史：
${conversationText}

请判断用户当前意图：`,
      temperature: 0,
    });

    console.log(`[Intent LLM] ${result.object.intent} (confidence: ${result.object.confidence})`);
    return result.object.intent as IntentType;
  } catch (error) {
    console.error('[Intent LLM] Error:', error);
    // 降级到 explore（最常见的意图）
    return 'explore';
  }
}

/**
 * 混合意图分类：正则优先，unknown 时调用 LLM
 * 返回意图和分类方法
 */
async function classifyIntent(
  messages: Array<{ role: string; content: string }>,
  hasDraftContext: boolean
): Promise<{ intent: IntentType; method: 'regex' | 'llm' }> {
  // 获取最后一条用户消息
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  const lastUserText = lastUserMessage?.content || '';
  
  // 1. 先用正则快速分类
  const quickResult = classifyIntentByRegex(lastUserText, hasDraftContext);
  if (quickResult !== 'unknown') {
    console.log(`[Intent Regex] ${quickResult}`);
    return { intent: quickResult, method: 'regex' };
  }
  
  // 2. 正则无法识别时，调用 LLM
  console.log('[Intent] Regex unknown, falling back to LLM...');
  const llmResult = await classifyIntentWithLLM(messages, hasDraftContext);
  return { intent: llmResult, method: 'llm' };
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
  
  // v3.12: 混合意图分类（正则优先，unknown 时调用 LLM）
  const conversationHistory = messages.map(m => ({
    role: m.role,
    content: m.parts?.find((p): p is { type: 'text'; text: string } => p.type === 'text')?.text 
      || (m as unknown as { content?: string })?.content 
      || '',
  }));
  const { intent, method: intentMethod } = await classifyIntent(conversationHistory, !!draftContext);
  const tools = getToolsByIntent(userId, intent, !!draftContext);
  
  console.log(`[AI Chat] Intent: ${intent} (${intentMethod}), Tools: ${Object.keys(tools).join(', ')}`);
  
  // Trace 模式的元数据
  const requestId = trace ? randomUUID() : undefined;
  const startedAt = trace ? new Date().toISOString() : undefined;
  let stepIndex = 0;
  
  // trace 模式的数据收集（通过 onStepFinish 实时收集）
  const traceSteps: Array<{ toolName: string; toolCallId: string; args: unknown; result?: unknown }> = [];
  let totalUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  let aiResponseText = ''; // AI 的文字响应
  
  // v3.10: 评估结果收集
  const evaluationResults: EvaluationResult[] = [];
  
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
      // 保存 AI 文字响应
      aiResponseText = text || '';
      
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
      
      // 提取最后一条用户消息（在 try 外定义，供后续评估使用）
      const lastUserMessage = messages.filter(m => m.role === 'user').pop();
      const lastUserText = lastUserMessage?.parts?.find((p): p is { type: 'text'; text: string } => p.type === 'text')?.text 
        || (lastUserMessage as { content?: string })?.content 
        || '';
      
      if (userId) {
        try {
          // 获取或创建会话
          const { id: conversationId } = await getOrCreateCurrentConversation(userId);
          
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
              // v3.10: 附加评估结果
              evaluation: evaluationResults.length > 0 ? evaluationResults : undefined,
            },
            activityId,
          });
          
          console.log(`[AI Chat] Saved conversation: ${conversationId}, activityId: ${activityId || 'none'}`);
        } catch (error) {
          // 保存失败不影响响应
          console.error('[AI Chat] Failed to save conversation:', error);
        }
      }
      
      // v3.10: 执行 Tool 调用评估（异步，不阻塞响应）
      if (EVALUATION_CONFIG.ENABLED && traceSteps.length > 0) {
        // 异步评估，不阻塞主流程
        (async () => {
          for (const step of traceSteps) {
            if (shouldEvaluate(step.toolName) && step.result) {
              try {
                const evalResult = await runEvaluation(
                  lastUserText,
                  step.toolName,
                  step.args,
                  step.result
                );
                evaluationResults.push(evalResult);
                
                const status = evalResult.passed ? '✅' : '⚠️';
                console.log(`[AI Eval] ${status} ${step.toolName}: score=${evalResult.score}, issues=${(evalResult.evaluation as any).issues?.length || 0}`);
              } catch (error) {
                console.error(`[AI Eval] Failed to evaluate ${step.toolName}:`, error);
              }
            }
          }
        })();
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
          intent, // 意图分类
          intentMethod, // 分类方法：regex 或 llm
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
        onFinish: async () => {
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
          
          // v3.10: 对需要评估的 Tool 执行评估
          const toolEvaluations: Map<string, EvaluationResult> = new Map();
          if (EVALUATION_CONFIG.ENABLED) {
            for (const step of traceSteps) {
              if (shouldEvaluate(step.toolName) && step.result) {
                try {
                  const evalResult = await runEvaluation(
                    lastUserText,
                    step.toolName,
                    step.args,
                    step.result
                  );
                  toolEvaluations.set(step.toolCallId, evalResult);
                  const status = evalResult.passed ? '✅' : '⚠️';
                  console.log(`[AI Eval] ${status} ${step.toolName}: score=${evalResult.score}`);
                } catch (error) {
                  console.error(`[AI Eval] Failed: ${step.toolName}`, error);
                }
              }
            }
          }
          
          // 发送 tool 步骤（从 onStepFinish 收集的数据 + 评估结果）
          for (const step of traceSteps) {
            const evaluation = toolEvaluations.get(step.toolCallId);
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
                  // v3.10: 附加评估结果
                  evaluation: evaluation ? {
                    passed: evaluation.passed,
                    score: evaluation.score,
                    intentMatch: evaluation.evaluation.intentMatch,
                    issues: (evaluation.evaluation as any).issues || [],
                    suggestions: (evaluation.evaluation as any).suggestions,
                    fieldCompleteness: (evaluation.evaluation as any).fieldCompleteness,
                  } : undefined,
                },
              },
              transient: true,
            });
          }
          
          // 发送 trace-end（包含输出摘要）
          const completedAt = new Date().toISOString();
          const totalDuration = new Date(completedAt).getTime() - new Date(startedAt!).getTime();
          
          // 构建输出摘要
          const outputSummary = {
            text: aiResponseText || null,
            toolCalls: traceSteps.map(step => ({
              name: step.toolName,
              displayName: getToolDisplayName(step.toolName),
              input: step.args,
              output: step.result,
            })),
          };
          
          writer.write({
            type: 'data-trace-end',
            data: {
              requestId,
              completedAt,
              totalDuration,
              status: 'completed',
              output: outputSummary,
            },
            transient: true,
          });
          
          console.log(`[AI Chat + Trace] Source: ${source}, User: ${userId}, Tokens: ${totalUsage.totalTokens}, Tools: ${traceSteps.length}, Evals: ${toolEvaluations.size}, Duration: ${totalDuration}ms`);
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
 * 构建继续草稿按钮（内部使用）
 */
async function buildContinueDraftAction(
  userId: string
): Promise<{ activityId: string; activityTitle: string } | null> {
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
  
  return {
    activityId: draft[0].id,
    activityTitle: draft[0].title,
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
 * 获取欢迎卡片数据 (v3.10 重构 - 分组结构)
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
  const sections: WelcomeSection[] = [];

  // 1. 生成问候语
  const greeting = userId === null
    ? "Hello ✨"
    : `Hello${nickname ? ` ${nickname}` : ''} ✨`;
  const subGreeting = "想玩点什么？";

  // 2. 继续草稿分组（需要登录）
  if (userId) {
    const draftAction = await buildContinueDraftAction(userId);
    if (draftAction) {
      sections.push({
        id: 'draft',
        icon: '📝',
        title: '继续草稿',
        items: [{
          type: 'draft',
          icon: '🎲',
          label: draftAction.activityTitle,
          prompt: `继续编辑「${draftAction.activityTitle}」`,
          context: { activityId: draftAction.activityId },
        }],
      });
    }
  }

  // 3. 快速组局分组
  const suggestions = await buildSuggestionItems(userId);
  sections.push({
    id: 'suggestions',
    icon: '💡',
    title: '快速组局',
    items: suggestions,
  });

  // 4. 探索附近分组
  const exploreItems = await buildExploreItems(location);
  sections.push({
    id: 'explore',
    icon: '📍',
    title: '探索附近',
    items: exploreItems,
  });

  return {
    greeting,
    subGreeting,
    sections,
  };
}

/**
 * 构建快速组局建议项
 */
async function buildSuggestionItems(userId: string | null): Promise<QuickItem[]> {
  // 基于用户历史偏好生成建议（简化版：固定建议）
  const items: QuickItem[] = [
    {
      type: 'suggestion',
      label: '明晚打麻将，3缺1',
      prompt: '明晚打麻将，3缺1',
    },
    {
      type: 'suggestion',
      label: '周末想吃火锅',
      prompt: '周末想吃火锅',
    },
    {
      type: 'suggestion',
      label: '想找人一起打羽毛球',
      prompt: '想找人一起打羽毛球',
    },
  ];

  // TODO: 后续可以基于用户历史活动类型动态生成
  // if (userId) {
  //   const typeStats = await getUserActivityTypeStats(userId);
  //   // 根据 typeStats 调整建议顺序
  // }

  return items;
}

/**
 * 构建探索附近项
 */
async function buildExploreItems(
  location: { lat: number; lng: number } | null
): Promise<QuickItem[]> {
  if (location) {
    const locationName = await reverseGeocode(location.lat, location.lng);
    const nearbyCount = await countNearbyActivities(location, 5000);
    
    return [{
      type: 'explore',
      label: nearbyCount > 0 
        ? `${locationName}附近有 ${nearbyCount} 个活动`
        : `看看${locationName}附近有什么`,
      prompt: `看看${locationName}附近有什么活动`,
      context: { locationName, lat: location.lat, lng: location.lng, count: nearbyCount },
    }];
  }

  return [{
    type: 'explore',
    label: '看看附近有什么活动',
    prompt: '附近有什么活动',
  }];
}

/** 快捷项类型 */
interface QuickItem {
  type: 'draft' | 'suggestion' | 'explore';
  icon?: string;
  label: string;
  prompt: string;
  context?: Record<string, unknown>;
}

/** 分组类型 */
interface WelcomeSection {
  id: string;
  icon: string;
  title: string;
  items: QuickItem[];
}

/** Welcome 响应类型 (v3.10) */
interface WelcomeResponse {
  greeting: string;
  subGreeting?: string;
  sections: WelcomeSection[];
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
