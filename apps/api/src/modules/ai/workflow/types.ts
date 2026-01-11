/**
 * Workflow Module Types - 工作流类型定义
 * 
 * HITL (Human-in-the-Loop) 工作流状态机
 */

/**
 * 工作流状态
 */
export type WorkflowStatus = 
  | 'pending'      // 等待用户输入
  | 'processing'   // 处理中
  | 'completed'    // 已完成
  | 'cancelled'    // 已取消
  | 'expired';     // 已过期

/**
 * 工作流类型
 */
export type WorkflowType = 
  | 'draft'        // 草稿确认流程
  | 'match'        // 匹配确认流程
  | 'preference';  // 追问流程

/**
 * 工作流状态
 */
export interface WorkflowState<TData = unknown> {
  /** 工作流 ID */
  id: string;
  /** 工作流类型 */
  type: WorkflowType;
  /** 当前状态 */
  status: WorkflowStatus;
  /** 当前步骤索引 */
  currentStep: number;
  /** 工作流数据 */
  data: TData;
  /** 用户 ID */
  userId: string;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
  /** 过期时间 */
  expiresAt?: Date;
}

/**
 * 工作流步骤
 * 
 * 注意：execute 和 validate 使用 any 类型以支持泛型工作流定义
 * 具体类型在各个 flow 文件中通过类型断言保证
 */
export interface WorkflowStep<TInput = unknown, TOutput = unknown> {
  /** 步骤名称 */
  name: string;
  /** 步骤描述 */
  description?: string;
  /** 是否需要用户输入 */
  requiresInput: boolean;
  /** 执行函数 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute: (input: any, state: WorkflowState<any>) => Promise<WorkflowStepResult<TOutput>>;
  /** 验证函数 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validate?: (input: any) => boolean;
}

/**
 * 步骤执行结果
 */
export interface WorkflowStepResult<TOutput = unknown> {
  /** 是否成功 */
  success: boolean;
  /** 输出数据 */
  output?: TOutput;
  /** 错误信息 */
  error?: string;
  /** 是否需要等待用户输入 */
  waitForInput?: boolean;
  /** 下一步索引（跳转） */
  nextStep?: number;
}

/**
 * 工作流定义
 */
export interface WorkflowDefinition<TData = unknown> {
  /** 工作流类型 */
  type: WorkflowType;
  /** 步骤列表 */
  steps: WorkflowStep[];
  /** 初始数据 */
  initialData: TData;
  /** 过期时间（毫秒） */
  expiresIn?: number;
}

/**
 * 工作流事件
 */
export type WorkflowEvent = 
  | { type: 'start'; workflowId: string }
  | { type: 'step_complete'; workflowId: string; stepIndex: number }
  | { type: 'user_input'; workflowId: string; input: unknown }
  | { type: 'complete'; workflowId: string }
  | { type: 'cancel'; workflowId: string }
  | { type: 'expire'; workflowId: string };
