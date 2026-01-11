/**
 * Intent Types - 意图识别类型定义
 */

/**
 * 意图类型
 */
export type IntentType =
  | 'create'    // 创建活动
  | 'explore'   // 探索附近
  | 'manage'    // 管理活动
  | 'partner'   // 找搭子
  | 'chitchat'  // 闲聊
  | 'idle'      // 空闲/暂停
  | 'unknown';  // 未知

/**
 * 分类方法
 */
export type ClassifyMethod = 'regex' | 'llm';

/**
 * 分类结果
 */
export interface ClassifyResult {
  /** 识别的意图 */
  intent: IntentType;
  /** 置信度 0-1 */
  confidence: number;
  /** 分类方法 */
  method: ClassifyMethod;
  /** 匹配的正则模式（regex 方法时） */
  matchedPattern?: string;
}

/**
 * 分类上下文
 */
export interface ClassifyContext {
  /** 是否有草稿上下文 */
  hasDraftContext: boolean;
  /** 对话历史 */
  conversationHistory?: Array<{ role: string; content: string }>;
  /** 用户 ID（用于 metrics 记录） */
  userId?: string;
}
