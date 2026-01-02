/**
 * Execution Trace Types
 * 
 * 定义 AI 请求执行追踪的数据结构，用于前后端数据契约。
 * 参考 Requirements R8, R13
 */

/** 执行追踪状态 */
export type TraceStatus = 'running' | 'completed' | 'error'

/** 步骤状态 */
export type StepStatus = 'pending' | 'running' | 'success' | 'error'

/** 步骤类型 */
export type StepType = 'input' | 'prompt' | 'llm' | 'tool' | 'output'

/** 执行追踪 */
export interface ExecutionTrace {
  /** 请求唯一标识 */
  requestId: string
  /** 开始时间 (ISO timestamp) */
  startedAt: string
  /** 完成时间 (ISO timestamp) */
  completedAt?: string
  /** 追踪状态 */
  status: TraceStatus
  /** 执行步骤列表 */
  steps: TraceStep[]
  /** 总成本 (USD) */
  totalCost?: number
}

/** 执行步骤 */
export interface TraceStep {
  /** 步骤唯一标识 */
  id: string
  /** 步骤类型 */
  type: StepType
  /** 步骤名称 (显示用) */
  name: string
  /** 开始时间 (ISO timestamp) */
  startedAt: string
  /** 完成时间 (ISO timestamp) */
  completedAt?: string
  /** 步骤状态 */
  status: StepStatus
  /** 耗时 (毫秒) */
  duration?: number
  /** 步骤数据 */
  data: TraceStepData
  /** 错误信息 */
  error?: string
}

/** 步骤数据联合类型 */
export type TraceStepData =
  | InputStepData
  | PromptStepData
  | LLMStepData
  | ToolStepData
  | OutputStepData

/** 用户输入步骤数据 */
export interface InputStepData {
  /** 原始输入文本 */
  text: string
}

/** System Prompt 注入步骤数据 */
export interface PromptStepData {
  /** 当前时间 (格式化后) */
  currentTime: string
  /** 用户位置 */
  userLocation?: {
    lat: number
    lng: number
    name?: string
  }
  /** 草稿上下文 */
  draftContext?: {
    activityId: string
    title: string
  }
  /** 完整 Prompt (可选，点击查看时加载) */
  fullPrompt?: string
}

/** LLM 推理步骤数据 */
export interface LLMStepData {
  /** 模型名称 */
  model: string
  /** 输入 Token 数 */
  inputTokens: number
  /** 输出 Token 数 */
  outputTokens: number
  /** 总 Token 数 */
  totalTokens: number
  /** 首 Token 延迟 (毫秒) */
  timeToFirstToken?: number
  /** 生成速度 (tokens/s) */
  tokensPerSecond?: number
  /** 成本 (USD) */
  cost?: number
}

/** Tool 调用步骤数据 */
export interface ToolStepData {
  /** 工具名称 (英文) */
  toolName: string
  /** 工具显示名称 (中文) */
  toolDisplayName: string
  /** 输入参数 */
  input: Record<string, unknown>
  /** 输出结果 */
  output?: Record<string, unknown>
  /** Widget 类型 (如果返回 Widget) */
  widgetType?: 'widget_draft' | 'widget_explore' | 'widget_share'
}

/** 最终输出步骤数据 */
export interface OutputStepData {
  /** AI 回复文本 */
  text: string
}

// ============ Type Guards ============

/** 检查是否为用户输入步骤数据 */
export function isInputStepData(data: TraceStepData): data is InputStepData {
  return 'text' in data && !('model' in data) && !('toolName' in data)
}

/** 检查是否为 Prompt 步骤数据 */
export function isPromptStepData(data: TraceStepData): data is PromptStepData {
  return 'currentTime' in data
}

/** 检查是否为 LLM 步骤数据 */
export function isLLMStepData(data: TraceStepData): data is LLMStepData {
  return 'model' in data && 'inputTokens' in data
}

/** 检查是否为 Tool 步骤数据 */
export function isToolStepData(data: TraceStepData): data is ToolStepData {
  return 'toolName' in data
}

/** 检查是否为输出步骤数据 */
export function isOutputStepData(data: TraceStepData): data is OutputStepData {
  return 'text' in data && !('currentTime' in data) && !('model' in data)
}

// ============ Step Icons & Labels ============

/** 步骤图标映射 */
export const STEP_ICONS: Record<StepType, string> = {
  input: '💬',
  prompt: '📝',
  llm: '🤖',
  tool: '🔧',
  output: '✨',
}

/** 步骤名称映射 */
export const STEP_LABELS: Record<StepType, string> = {
  input: '用户输入',
  prompt: 'System Prompt',
  llm: 'LLM 推理',
  tool: 'Tool 调用',
  output: '最终响应',
}

/** Tool 名称映射 */
export const TOOL_DISPLAY_NAMES: Record<string, string> = {
  createActivityDraft: '创建活动草稿',
  refineDraft: '修改草稿',
  publishActivity: '发布活动',
  exploreNearby: '探索附近',
}

/** 获取 Tool 显示名称 */
export function getToolDisplayName(toolName: string): string {
  return TOOL_DISPLAY_NAMES[toolName] || toolName
}

// ============ SSE Event Types ============

/** SSE 追踪开始事件 */
export interface TraceStartEvent {
  type: 'trace-start'
  data: {
    requestId: string
    startedAt: string
  }
}

/** SSE 追踪步骤事件 */
export interface TraceStepEvent {
  type: 'trace-step'
  data: TraceStep
}

/** SSE 追踪结束事件 */
export interface TraceEndEvent {
  type: 'trace-end'
  data: {
    completedAt: string
    status: TraceStatus
    totalCost?: number
  }
}

/** SSE 追踪事件联合类型 */
export type TraceEvent = TraceStartEvent | TraceStepEvent | TraceEndEvent
