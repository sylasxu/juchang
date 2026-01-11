/**
 * Memory Module Types - 记忆系统类型定义
 * 
 * 基于 @juchang/db 的 conversations 和 conversationMessages 表
 */

import type { Conversation, Message } from '@juchang/db';

/**
 * Thread（会话）- 对应 conversations 表
 * 直接复用 DB 类型
 */
export type Thread = Conversation;

/**
 * ThreadMessage（消息）- 对应 conversationMessages 表
 * 直接复用 DB 类型
 */
export type ThreadMessage = Message;

/**
 * 简化的消息格式（用于 AI 上下文）
 */
export interface SimpleMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * 用户画像（WorkingMemory 解析结果）
 * 存储为 Markdown 格式，解析为结构化数据
 */
export interface UserProfile {
  /** 喜好：喜欢火锅、偏好周末活动 */
  preferences: string[];
  /** 不喜欢：不吃辣、不喜欢太早 */
  dislikes: string[];
  /** 常去地点：朝阳区、望京 */
  frequentLocations: string[];
  /** 行为模式：经常组局、喜欢小规模 */
  behaviorPatterns: string[];
}

/**
 * 保存消息的参数
 */
export interface SaveMessageParams {
  conversationId: string;
  userId: string;
  role: 'user' | 'assistant';
  messageType: string;
  content: unknown;
  activityId?: string;
}

/**
 * 会话窗口配置
 */
export interface SessionWindowConfig {
  /** 会话窗口时长（毫秒），默认 24 小时 */
  windowMs: number;
}

export const DEFAULT_SESSION_WINDOW: SessionWindowConfig = {
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
};
