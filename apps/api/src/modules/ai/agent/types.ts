/**
 * Agent Module Types - Mastra 风格的类型定义
 * 
 * v4.5 Agent 封装层
 */

import type { LanguageModel } from 'ai';
import type { UserProfile, EnhancedUserProfile } from '../memory/types';

// ============ Message Types ============

/** 
 * AI 消息类型 (用于 LLM 交互)
 * 
 * 注意：与 @juchang/db 的 Message (DB 消息) 区分
 * - Message: 用于 LLM 交互的消息格式
 * - DB Message: 数据库存储的消息记录
 */
export interface Message {
  /** 消息 ID (可选) */
  id?: string;
  /** 角色 */
  role: 'system' | 'user' | 'assistant' | 'tool';
  /** 内容 (字符串或结构化内容) */
  content: string | Array<{ type: string; [key: string]: any }>;
  /** Tool 调用 (assistant 消息) */
  toolCalls?: ToolCall[];
  /** Tool 结果 (tool 消息) */
  toolResults?: ToolResult[];
}

/** 兼容别名 */
export type AIMessage = Message;

/** 系统消息类型 (支持多种格式) */
export type SystemMessage = 
  | string 
  | string[];

// ============ Agent Configuration ============

/** Agent 配置 (类似 Mastra 的 Agent 定义) */
export interface AgentConfig {
  /** Agent 唯一标识符 */
  name: string;
  /** Agent 描述 (可选) */
  description?: string;
  /** 系统指令 - 可以是字符串、数组或函数 */
  instructions: SystemMessage | ((ctx: RuntimeContext) => SystemMessage | Promise<SystemMessage>);
  /** 语言模型 - 可以静态提供或动态解析 */
  model: LanguageModel | ((ctx: RuntimeContext) => LanguageModel | Promise<LanguageModel>);
  /** 工具集 - 可以静态提供或动态解析 */
  tools?: ToolsInput | ((ctx: RuntimeContext) => ToolsInput | Promise<ToolsInput>);
  /** 最大步骤数 */
  maxSteps?: number;
  /** 输入处理器 */
  inputProcessors?: Processor[];
  /** 输出处理器 */
  outputProcessors?: Processor[];
}

/** 工具输入类型 */
export type ToolsInput = Record<string, any>;

// ============ Runtime Context ============

/** 运行时上下文 (类似 Mastra 的 RuntimeContext) */
export interface RuntimeContext {
  /** 用户 ID */
  userId: string | null;
  /** 用户位置 */
  location?: { lat: number; lng: number; name?: string };
  /** 会话 ID */
  conversationId?: string;
  /** 用户画像 */
  userProfile?: UserProfile | EnhancedUserProfile | null;
  /** 最近对话历史 */
  recentHistory?: AIMessage[];
  /** 最后一条用户消息 (用于 Output Processors) */
  lastUserMessage?: string;
  /** 自定义数据 */
  [key: string]: any;
}

// ============ Chat Parameters ============

/** 对话参数 */
export interface ChatParams {
  /** 用户 ID */
  userId: string | null;
  /** 用户消息 */
  message: string;
  /** 用户位置 */
  location?: { lat: number; lng: number };
  /** 会话 ID */
  conversationId?: string;
}

// ============ Agent Options ============

/** Agent 生成选项 */
export interface AgentGenerateOptions {
  /** 消息列表 */
  messages?: Message[];
  /** 运行时上下文 */
  runtimeContext?: RuntimeContext;
  /** 步骤完成回调 */
  onStepFinish?: (step: StepResult) => void | Promise<void>;
  /** 最大步骤数 */
  maxSteps?: number;
}

/** Agent 流式选项 */
export interface AgentStreamOptions extends AgentGenerateOptions {
  /** 是否启用流式 */
  stream?: boolean;
}

// ============ Step Result ============

/** 步骤结果 (用于 onStepFinish 回调) */
export interface StepResult {
  /** 生成的文本 */
  text: string;
  /** Tool 调用列表 */
  toolCalls?: ToolCall[];
  /** Tool 结果列表 */
  toolResults?: ToolResult[];
  /** 完成原因 */
  finishReason: string;
  /** Token 使用量 */
  usage: { promptTokens: number; completionTokens: number };
}

/** Tool 调用 */
export interface ToolCall {
  toolCallId: string;
  toolName: string;
  args: Record<string, any>;
}

/** Tool 结果 */
export interface ToolResult {
  toolCallId: string;
  toolName: string;
  result: any;
}

// ============ Processor Interface ============

/** 处理器接口 (Mastra 风格) */
export interface Processor {
  /** 处理器名称 */
  name: string;
  /** 输入处理 - 在消息发送给 LLM 之前 */
  processInput?: (
    messages: Message[], 
    ctx: RuntimeContext
  ) => Message[] | Promise<Message[]>;
  /** 输出结果处理 - 在 LLM 响应返回给用户之前 (非流式) */
  processOutputResult?: (
    result: any, 
    ctx: RuntimeContext
  ) => any | Promise<any>;
  /** 输出流处理 - 在 LLM 响应返回给用户之前 (流式) */
  processOutputStream?: (
    stream: any, 
    ctx: RuntimeContext
  ) => any | Promise<any>;
}

// ============ Agent Instance ============

/** Agent 实例类型 */
export interface Agent {
  /** Agent 名称 */
  name: string;
  /** Agent 描述 */
  description?: string;
  /** 流式生成 */
  stream: (options: AgentStreamOptions) => Promise<any>;
  /** 非流式生成 */
  generate: (options: AgentGenerateOptions) => Promise<any>;
  /** 原始配置 */
  config: AgentConfig;
}

// ============ Intent Types ============

/** 意图类型 */
export type IntentType = 
  | 'EXPLORE'   // 探索附近
  | 'CREATE'    // 创建活动
  | 'PARTNER'   // 找搭子
  | 'MANAGE'    // 管理活动
  | 'CHAT';     // 闲聊

/** Agent 名称类型 */
export type AgentName = 
  | 'explorer'  // 探索 Agent
  | 'creator'   // 创建 Agent
  | 'partner'   // 找搭子 Agent
  | 'manager'   // 管理 Agent
  | 'chat';     // 闲聊 Agent

/** 意图到 Agent 的映射 */
export const INTENT_TO_AGENT: Record<IntentType, AgentName> = {
  EXPLORE: 'explorer',
  CREATE: 'creator',
  PARTNER: 'partner',
  MANAGE: 'manager',
  CHAT: 'chat',
};
