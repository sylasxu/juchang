// Chat Service - 群聊消息业务逻辑
import { db, chatMessages, activities, participants, eq, and, desc, lt } from '@juchang/db';
import type { SendMessageRequest, MessageListQuery } from './chat.model';

/**
 * 发送消息
 */
export async function sendMessage(data: SendMessageRequest, senderId: string) {
  // 1. 验证用户是否为活动参与者
  const [participant] = await db
    .select()
    .from(participants)
    .where(
      and(
        eq(participants.activityId, data.activityId),
        eq(participants.userId, senderId),
        eq(participants.status, 'approved')
      )
    )
    .limit(1);

  if (!participant) {
    throw new Error('您不是该活动的参与者，无法发送消息');
  }

  // 2. 检查群聊状态
  const [activity] = await db
    .select({ chatStatus: activities.chatStatus })
    .from(activities)
    .where(eq(activities.id, data.activityId))
    .limit(1);

  if (!activity || activity.chatStatus === 'archived') {
    throw new Error('群聊已归档，无法发送消息');
  }

  // 3. 插入消息
  const [message] = await db
    .insert(chatMessages)
    .values({
      activityId: data.activityId,
      senderId,
      type: data.type,
      content: data.content,
      metadata: data.metadata,
    })
    .returning();

  return message;
}

/**
 * 获取消息列表
 */
export async function getMessageList(query: MessageListQuery, userId: string) {
  // 1. 验证用户权限
  const [participant] = await db
    .select()
    .from(participants)
    .where(
      and(
        eq(participants.activityId, query.activityId),
        eq(participants.userId, userId),
        eq(participants.status, 'approved')
      )
    )
    .limit(1);

  if (!participant) {
    throw new Error('您不是该活动的参与者，无法查看消息');
  }

  // 2. 构建查询条件
  const conditions = [eq(chatMessages.activityId, query.activityId)];
  
  if (query.before) {
    conditions.push(lt(chatMessages.createdAt, new Date(query.before)));
  }
  
  const whereCondition = conditions.length > 1 ? and(...conditions) : conditions[0];

  // 3. 查询消息
  const limit = query.limit || 20;
  const messages = await db
    .select()
    .from(chatMessages)
    .where(whereCondition)
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit + 1); // 多查一条用于判断是否还有更多

  // 4. 处理分页
  const hasMore = messages.length > limit;
  const data = hasMore ? messages.slice(0, limit) : messages;
  const nextCursor = hasMore ? data[data.length - 1].createdAt.toISOString() : undefined;

  return {
    data: data.reverse(), // 反转顺序，最新消息在后
    hasMore,
    nextCursor,
  };
}

/**
 * 撤回消息
 */
export async function revokeMessage(messageId: string, userId: string) {
  // 1. 查询消息
  const [message] = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.id, messageId))
    .limit(1);

  if (!message) {
    throw new Error('消息不存在');
  }

  if (message.senderId !== userId) {
    throw new Error('只能撤回自己的消息');
  }

  if (message.isRevoked) {
    throw new Error('消息已撤回');
  }

  // 2. 检查撤回时间限制（2分钟内）
  const now = new Date();
  const messageTime = new Date(message.createdAt);
  const diffMinutes = (now.getTime() - messageTime.getTime()) / (1000 * 60);

  if (diffMinutes > 2) {
    throw new Error('超过撤回时间限制（2分钟）');
  }

  // 3. 撤回消息
  await db
    .update(chatMessages)
    .set({ isRevoked: now })
    .where(eq(chatMessages.id, messageId));

  return { success: true };
}


/**
 * 获取我的群聊列表
 */
export async function getMyChats(userId: string, query: any) {
  // 查询用户参与的所有活动
  const myParticipations = await db
    .select({
      activityId: participants.activityId,
      joinedAt: participants.joinedAt,
    })
    .from(participants)
    .where(
      and(
        eq(participants.userId, userId),
        eq(participants.status, 'approved')
      )
    );

  if (myParticipations.length === 0) {
    return { data: [], total: 0 };
  }

  // 获取活动详情
  const activityIds = myParticipations.map(p => p.activityId);
  const activityList = await db
    .select({
      id: activities.id,
      title: activities.title,
      chatStatus: activities.chatStatus,
      currentParticipants: activities.currentParticipants,
      startAt: activities.startAt,
    })
    .from(activities)
    .where(eq(activities.chatStatus, 'active'));

  // 过滤出用户参与的活动
  const myChats = activityList.filter(a => activityIds.includes(a.id));

  return {
    data: myChats.map(chat => ({
      activityId: chat.id,
      title: chat.title,
      chatStatus: chat.chatStatus,
      participantCount: chat.currentParticipants,
      startAt: chat.startAt,
      lastMessage: null, // TODO: 查询最后一条消息
    })),
    total: myChats.length,
  };
}

/**
 * 归档群聊
 */
export async function archiveChat(activityId: string, userId: string) {
  // 验证用户是否为活动创建者
  const [activity] = await db
    .select()
    .from(activities)
    .where(eq(activities.id, activityId))
    .limit(1);

  if (!activity) {
    throw new Error('活动不存在');
  }

  if (activity.creatorId !== userId) {
    throw new Error('只有活动创建者可以归档群聊');
  }

  // 更新群聊状态
  await db
    .update(activities)
    .set({
      chatStatus: 'archived',
      chatArchivedAt: new Date(),
    })
    .where(eq(activities.id, activityId));

  return true;
}