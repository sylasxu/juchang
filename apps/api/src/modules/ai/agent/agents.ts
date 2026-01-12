/**
 * Agent Factory & Predefined Agents - Mastra 风格
 * 
 * v4.5 Agent 封装层
 * 
 * 提供：
 * - createAgent() 工厂函数
 * - 5 个预定义 Agent: explorer, creator, partner, manager, chat
 * - getAgent() 获取 Agent 实例
 */

import { streamText, generateText } from 'ai';
import type { 
  AgentConfig, 
  RuntimeContext, 
  AgentStreamOptions, 
  AgentGenerateOptions,
  Agent,
  Message,
  StepResult,
} from './types';
import { 
  defaultInputProcessors, 
  defaultOutputProcessors,
  runInputProcessors,
  runOutputProcessors,
} from './processors';
import { getChatModel } from '../models/router';
import { buildXmlSystemPrompt } from '../prompts/xiaoju-v39';
import { exploreNearbyTool } from '../tools/explore-nearby';
import {
  createActivityDraftTool,
  getDraftTool,
  refineDraftTool,
  publishActivityTool,
} from '../tools/activity-tools';
import {
  cancelActivityTool,
  getMyActivitiesTool,
  getActivityDetailTool,
  askPreferenceTool,
} from '../tools/query-tools';
import {
  createPartnerIntentTool,
  getMyIntentsTool,
  cancelIntentTool,
  confirmMatchTool,
} from '../tools/partner-tools';
import { createLogger } from '../observability/logger';

const logger = createLogger('agent');

// ============ Agent Factory ============

/**
 * 创建 Agent 实例 (Mastra 风格)
 */
export function createAgent(config: AgentConfig): Agent {
  const { 
    name, 
    description, 
    instructions, 
    model, 
    tools = {}, 
    maxSteps = 5,
    inputProcessors = defaultInputProcessors,
    outputProcessors = defaultOutputProcessors,
  } = config;

  /** 解析 instructions */
  async function resolveInstructions(ctx: RuntimeContext): Promise<string> {
    const resolved = typeof instructions === 'function' 
      ? await instructions(ctx) 
      : instructions;
    
    if (typeof resolved === 'string') return resolved;
    if (Array.isArray(resolved)) return resolved.join('\n');
    return String(resolved);
  }

  /** 解析 model */
  async function resolveModel(ctx: RuntimeContext) {
    return typeof model === 'function' ? await model(ctx) : model;
  }

  /** 解析 tools */
  async function resolveTools(ctx: RuntimeContext) {
    return typeof tools === 'function' ? await tools(ctx) : tools;
  }

  /** 转换 Message 为 AI SDK 格式 */
  function convertMessages(messages: Message[]) {
    return messages.map(m => ({
      role: m.role as 'system' | 'user' | 'assistant',
      content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
    }));
  }

  /** 流式生成 */
  async function stream(options: AgentStreamOptions) {
    const { 
      messages = [], 
      runtimeContext = {} as RuntimeContext, 
      onStepFinish, 
      maxSteps: optMaxSteps,
    } = options;
    
    const ctx = runtimeContext;

    logger.debug('Agent stream started', { 
      agent: name, 
      userId: ctx.userId,
      messageCount: messages.length,
    });

    // 1. 执行 Input Processors
    const processedMessages = await runInputProcessors(inputProcessors, messages, ctx);

    // 2. 解析配置
    const [systemPrompt, resolvedModel, resolvedTools] = await Promise.all([
      resolveInstructions(ctx),
      resolveModel(ctx),
      resolveTools(ctx),
    ]);

    // 3. 调用 streamText
    const result = await streamText({
      model: resolvedModel,
      system: systemPrompt,
      messages: convertMessages(processedMessages),
      tools: resolvedTools,
      maxSteps: optMaxSteps ?? maxSteps,
      onStepFinish: onStepFinish ? async (step: any) => {
        const stepResult: StepResult = {
          text: step.text,
          toolCalls: step.toolCalls?.map((tc: any) => ({
            toolCallId: tc.toolCallId,
            toolName: tc.toolName,
            args: tc.args as Record<string, any>,
          })),
          toolResults: step.toolResults?.map((tr: any) => ({
            toolCallId: tr.toolCallId,
            toolName: tr.toolName,
            result: tr.result,
          })),
          finishReason: step.finishReason,
          usage: {
            promptTokens: step.usage.promptTokens,
            completionTokens: step.usage.completionTokens,
          },
        };
        await onStepFinish(stepResult);
      } : undefined,
    } as any); // 使用 any 绕过 maxSteps 类型检查（AI SDK 版本差异）

    // 4. 执行 Output Processors (流式模式下在 onFinish 中执行)
    // 注意：流式模式下，outputProcessors 需要在流结束后执行
    // 这里返回原始 result，让调用方处理

    logger.debug('Agent stream completed', { agent: name });

    return result;
  }

  /** 非流式生成 */
  async function generate(options: AgentGenerateOptions) {
    const { 
      messages = [], 
      runtimeContext = {} as RuntimeContext, 
      maxSteps: optMaxSteps,
    } = options;
    
    const ctx = runtimeContext;

    logger.debug('Agent generate started', { 
      agent: name, 
      userId: ctx.userId,
    });

    // 1. 执行 Input Processors
    const processedMessages = await runInputProcessors(inputProcessors, messages, ctx);

    // 2. 解析配置
    const [systemPrompt, resolvedModel, resolvedTools] = await Promise.all([
      resolveInstructions(ctx),
      resolveModel(ctx),
      resolveTools(ctx),
    ]);

    // 3. 调用 generateText
    const result = await generateText({
      model: resolvedModel,
      system: systemPrompt,
      messages: convertMessages(processedMessages),
      tools: resolvedTools,
      maxSteps: optMaxSteps ?? maxSteps,
    } as any); // 使用 any 绕过 maxSteps 类型检查（AI SDK 版本差异）

    // 4. 执行 Output Processors
    const processedResult = await runOutputProcessors(outputProcessors, result, ctx);

    logger.debug('Agent generate completed', { agent: name });

    return processedResult;
  }

  return { 
    name, 
    description, 
    stream, 
    generate, 
    config,
  };
}


// ============ Predefined Agents ============

/** 
 * 探索 Agent - 导游模式 
 * 熟悉重庆的本地导游，根据用户的模糊描述推荐活动
 */
const explorerAgent = createAgent({
  name: 'explorer',
  description: '熟悉重庆的本地导游，根据用户的模糊描述推荐活动',
  instructions: (ctx) => buildXmlSystemPrompt({
    currentTime: new Date(),
    userLocation: ctx.location,
    workingMemory: null,
  }),
  model: () => getChatModel(),
  tools: (ctx) => ({
    exploreNearby: exploreNearbyTool(ctx.userId),
    askPreference: askPreferenceTool(ctx.userId),
    getActivityDetail: getActivityDetailTool(ctx.userId),
  }),
  maxSteps: 5,
});

/** 
 * 创建 Agent - 秘书模式 
 * 高效的活动秘书，帮用户把模糊的想法转化为结构化的活动草稿
 */
const creatorAgent = createAgent({
  name: 'creator',
  description: '高效的活动秘书，帮用户把模糊的想法转化为结构化的活动草稿',
  instructions: (ctx) => buildXmlSystemPrompt({
    currentTime: new Date(),
    userLocation: ctx.location,
    workingMemory: null,
  }),
  model: () => getChatModel(),
  tools: (ctx) => ({
    createActivityDraft: createActivityDraftTool(ctx.userId),
    refineDraft: refineDraftTool(ctx.userId),
    getDraft: getDraftTool(ctx.userId),
    publishActivity: publishActivityTool(ctx.userId),
    askPreference: askPreferenceTool(ctx.userId),
  }),
  maxSteps: 5,
});

/** 
 * 找搭子 Agent - 中介模式 
 * 热心的社交中介，帮用户找到志同道合的搭子
 */
const partnerAgent = createAgent({
  name: 'partner',
  description: '热心的社交中介，帮用户找到志同道合的搭子',
  instructions: (ctx) => buildXmlSystemPrompt({
    currentTime: new Date(),
    userLocation: ctx.location,
    workingMemory: null,
  }),
  model: () => getChatModel(),
  tools: (ctx) => ({
    createPartnerIntent: createPartnerIntentTool(ctx.userId, ctx.location || null),
    askPreference: askPreferenceTool(ctx.userId),
    getMyIntents: getMyIntentsTool(ctx.userId),
    cancelIntent: cancelIntentTool(ctx.userId),
    confirmMatch: confirmMatchTool(ctx.userId),
  }),
  maxSteps: 5,
});

/** 
 * 管理 Agent - 管家模式 
 * 用户的活动管家，帮用户查看和管理他们的活动
 */
const managerAgent = createAgent({
  name: 'manager',
  description: '用户的活动管家，帮用户查看和管理他们的活动',
  instructions: (ctx) => buildXmlSystemPrompt({
    currentTime: new Date(),
    userLocation: ctx.location,
    workingMemory: null,
  }),
  model: () => getChatModel(),
  tools: (ctx) => ({
    getMyActivities: getMyActivitiesTool(ctx.userId),
    cancelActivity: cancelActivityTool(ctx.userId),
    getActivityDetail: getActivityDetailTool(ctx.userId),
  }),
  maxSteps: 3,
});

/** 
 * 闲聊 Agent - 朋友模式 
 * 用户的朋友，可以闲聊，但要适时引导用户使用聚场的功能
 */
const chatAgent = createAgent({
  name: 'chat',
  description: '用户的朋友，可以闲聊，但要适时引导用户使用聚场的功能',
  instructions: `你是小聚，用户的朋友。可以闲聊，但要适时引导用户使用聚场的功能。
语气要轻松友好，像朋友聊天一样。
如果用户聊到活动相关话题，可以引导他们探索附近活动或组局。`,
  model: () => getChatModel(),
  tools: {}, // 不给工具，纯聊天，省钱
  maxSteps: 1,
});

// ============ Agent Registry ============

/** Agent 注册表 */
export const agents = {
  explorer: explorerAgent,
  creator: creatorAgent,
  partner: partnerAgent,
  manager: managerAgent,
  chat: chatAgent,
} as const;

export type AgentName = keyof typeof agents;

/** 
 * 获取 Agent 实例 
 */
export function getAgent(name: AgentName): Agent {
  return agents[name];
}

/** 
 * 获取所有 Agent 名称 
 */
export function getAgentNames(): AgentName[] {
  return Object.keys(agents) as AgentName[];
}
