/**
 * Agent Chat - 对话入口函数
 * 
 * v4.5 Agent 封装层
 * 
 * 提供：
 * - streamChat() - 流式对话入口
 * - generateChat() - 非流式对话入口
 */

import type { ChatParams, Message, RuntimeContext } from './types';
import { getAgent, type AgentName } from './agents';
import { classifyIntent } from './router';
import { buildContext } from './context';
import { 
  defaultOutputProcessors, 
  runOutputProcessors,
} from './processors';
import { createLogger } from '../observability/logger';

const logger = createLogger('agent-chat');

/** 意图到 Agent 的映射 */
const intentToAgent: Record<string, AgentName> = {
  EXPLORE: 'explorer',
  CREATE: 'creator',
  PARTNER: 'partner',
  MANAGE: 'manager',
  CHAT: 'chat',
};

/** 流式对话结果 */
export interface StreamChatResult {
  /** 流式响应 (可调用 toDataStreamResponse()) */
  stream: any;
  /** 会话 ID */
  conversationId: string | undefined;
  /** 选择的 Agent 名称 */
  agentName: AgentName;
  /** 意图类型 */
  intent: string;
}

/** 非流式对话结果 */
export interface GenerateChatResult {
  /** 生成的文本 */
  text: string;
  /** Tool 调用列表 */
  toolCalls?: any[];
  /** Tool 结果列表 */
  toolResults?: any[];
  /** 会话 ID */
  conversationId: string | undefined;
  /** 选择的 Agent 名称 */
  agentName: AgentName;
  /** 意图类型 */
  intent: string;
  /** Token 使用量 */
  usage?: { promptTokens: number; completionTokens: number };
}

/**
 * 流式对话入口 (纯函数)
 * 
 * 流程：
 * 1. 构建 RuntimeContext
 * 2. 意图分类 → 选择 Agent
 * 3. 调用 agent.stream()
 * 4. 返回流式响应
 */
export async function streamChat(params: ChatParams): Promise<StreamChatResult> {
  const { userId, message, location, conversationId: inputConversationId } = params;

  logger.info('Stream chat started', { 
    userId, 
    messageLength: message.length,
    hasLocation: !!location,
  });

  // 1. 构建 RuntimeContext
  const { context, conversationId } = await buildContext({
    userId,
    location,
    conversationId: inputConversationId,
  });

  // 保存最后一条用户消息到上下文 (用于 Output Processors)
  context.lastUserMessage = message;

  // 2. 意图分类 → 选择 Agent
  const routeResult = await classifyIntent(
    message, 
    context.recentHistory,
    false // TODO: 检查是否有草稿上下文
  );
  
  const agentName = routeResult.agentName;
  const agent = getAgent(agentName);

  logger.debug('Agent selected', { 
    agentName, 
    intent: routeResult.intent,
    confidence: routeResult.confidence,
  });

  // 3. 构建消息列表
  const messages: Message[] = [
    ...(context.recentHistory || []),
    { role: 'user', content: message },
  ];

  // 4. 调用 agent.stream()
  const stream = await agent.stream({
    messages,
    runtimeContext: context,
    onStepFinish: async (step) => {
      // 流式模式下，在每个步骤完成时执行 Output Processors
      // 注意：这里只处理最终步骤，避免重复处理
      if (step.finishReason === 'stop' || step.finishReason === 'end-turn') {
        await runOutputProcessors(defaultOutputProcessors, step, context);
      }
    },
  });

  logger.info('Stream chat completed', { 
    agentName, 
    conversationId,
  });

  return {
    stream,
    conversationId,
    agentName,
    intent: routeResult.intent,
  };
}

/**
 * 非流式对话入口 (纯函数)
 * 
 * 用于内部调用或测试
 */
export async function generateChat(params: ChatParams): Promise<GenerateChatResult> {
  const { userId, message, location, conversationId: inputConversationId } = params;

  logger.info('Generate chat started', { 
    userId, 
    messageLength: message.length,
  });

  // 1. 构建 RuntimeContext
  const { context, conversationId } = await buildContext({
    userId,
    location,
    conversationId: inputConversationId,
  });

  // 保存最后一条用户消息到上下文
  context.lastUserMessage = message;

  // 2. 意图分类 → 选择 Agent
  const routeResult = await classifyIntent(
    message, 
    context.recentHistory,
    false
  );
  
  const agentName = routeResult.agentName;
  const agent = getAgent(agentName);

  // 3. 构建消息列表
  const messages: Message[] = [
    ...(context.recentHistory || []),
    { role: 'user', content: message },
  ];

  // 4. 调用 agent.generate() (Output Processors 已在 agent 内部执行)
  const result = await agent.generate({
    messages,
    runtimeContext: context,
  });

  logger.info('Generate chat completed', { 
    agentName, 
    conversationId,
    textLength: result.text?.length || 0,
  });

  return {
    text: result.text,
    toolCalls: result.toolCalls,
    toolResults: result.toolResults,
    conversationId,
    agentName,
    intent: routeResult.intent,
    usage: result.usage ? {
      promptTokens: result.usage.promptTokens,
      completionTokens: result.usage.completionTokens,
    } : undefined,
  };
}

/**
 * 获取流式响应的 DataStream Response
 * 
 * 便捷方法，用于 Controller 层
 */
export function toDataStreamResponse(streamResult: StreamChatResult) {
  return streamResult.stream.toDataStreamResponse();
}
