/**
 * Agent Context Builder - 运行时上下文构建
 * 
 * v4.5 Agent 封装层
 * 
 * 构建 RuntimeContext，包含：
 * - 用户画像
 * - 最近对话历史
 * - 位置信息
 */

import type { RuntimeContext, Message } from './types';
import { getMessages, getOrCreateThread } from '../memory/store';
import { getEnhancedUserProfile, type EnhancedUserProfile } from '../memory/working';
import { createLogger } from '../observability/logger';

const logger = createLogger('agent-context');

/** 构建上下文的参数 */
export interface BuildContextParams {
  /** 用户 ID */
  userId: string | null;
  /** 用户位置 */
  location?: { lat: number; lng: number; name?: string };
  /** 会话 ID (可选，不传则自动获取/创建) */
  conversationId?: string;
  /** 历史消息数量限制 */
  historyLimit?: number;
}

/** 构建上下文的结果 */
export interface BuildContextResult {
  /** 运行时上下文 */
  context: RuntimeContext;
  /** 会话 ID */
  conversationId: string | undefined;
  /** 是否新建会话 */
  isNewConversation: boolean;
}

/**
 * 构建 RuntimeContext (Mastra 风格)
 * 
 * 并行获取用户画像和对话历史，提高性能
 */
export async function buildContext(params: BuildContextParams): Promise<BuildContextResult> {
  const { 
    userId, 
    location, 
    conversationId: inputConversationId,
    historyLimit = 10,
  } = params;

  let conversationId = inputConversationId;
  let isNewConversation = false;

  // 1. 如果有 userId 但没有 conversationId，获取或创建会话
  if (userId && !conversationId) {
    const thread = await getOrCreateThread(userId);
    conversationId = thread.id;
    isNewConversation = thread.isNew;
    
    logger.debug('Thread resolved', { 
      userId, 
      conversationId, 
      isNew: isNewConversation,
    });
  }

  // 2. 并行获取用户画像和对话历史
  const [userProfile, recentHistory] = await Promise.all([
    userId ? getEnhancedUserProfile(userId) : null,
    conversationId ? getRecentHistory(conversationId, historyLimit) : [],
  ]);

  logger.debug('Context built', { 
    userId,
    hasProfile: !!userProfile,
    historyCount: recentHistory.length,
    hasLocation: !!location,
  });

  const context: RuntimeContext = {
    userId,
    location,
    conversationId,
    userProfile: userProfile as any, // EnhancedUserProfile 兼容 UserProfile
    recentHistory,
  };

  return {
    context,
    conversationId,
    isNewConversation,
  };
}

/**
 * 获取最近对话历史并转换为 Message 格式
 */
async function getRecentHistory(
  conversationId: string, 
  limit: number
): Promise<Message[]> {
  const messages = await getMessages(conversationId, limit);
  
  return messages.map(msg => ({
    id: msg.id,
    role: msg.role as 'user' | 'assistant' | 'system',
    content: typeof msg.content === 'string' 
      ? msg.content 
      : JSON.stringify(msg.content),
  }));
}

/**
 * 简化版构建上下文 (不获取/创建会话)
 * 
 * 用于不需要持久化的场景
 */
export async function buildSimpleContext(params: {
  userId: string | null;
  location?: { lat: number; lng: number; name?: string };
}): Promise<RuntimeContext> {
  const { userId, location } = params;

  const userProfile = userId ? await getEnhancedUserProfile(userId) : null;

  return {
    userId,
    location,
    userProfile: userProfile as any, // EnhancedUserProfile 兼容 UserProfile
    recentHistory: [],
  };
}
