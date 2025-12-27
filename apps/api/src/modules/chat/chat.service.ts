// Chat Service - 群聊消息业务逻辑 (v3.2 使用 groupMessages)
import { db, groupMessages, activities, participants, users, eq, and, gt } from '@juchang/db';
import type { ChatMessageResponse, MessageListQuery, SendMessageRequest } from './chat.model';

// 群聊归档时间：活动开始后 24 小时
const ARCHIVE_HOURS = 24;

/**
 * 检查活动群聊是否已归档
 */
async function checkIsArchived(activityId: string): Promise<boolean> {
  const [activity] = await db
    .select({ startAt: activities.startAt })
    .from(activities)
    .where(eq(activities.id, activityId))
    .limit(1);

  if (!activity) {
    return true; // 活动不存在视为已归档
  }

  const archiveTime = new Date(activity.startAt.getTime() + ARCHIVE_HOURS * 60 * 60 * 1000);
  return new Date() > archiveTime;
}

/**
 * 检查用户是否为活动参与者
 */
async function checkIsParticipant(activityId: string, userId: string): Promise<boolean> {
  const [participant] = await db
    .select()
    .from(participants)
    .where(
      and(
        eq(participants.activityId, activityId),
        eq(participants.userId, userId),
        eq(participants.status, 'joined')
      )
    )
    .limit(1);

  return !!participant;
}

/**
 * 获取消息列表（轮询）
 */
export async function getMessages(
  activityId: string, 
  userId: string,
  query: MessageListQuery
): Promise<{ messages: ChatMessageResponse[]; isArchived: boolean }> {
  // 检查用户是否为参与者
  const isParticipant = await checkIsParticipant(activityId, userId);
  if (!isParticipant) {
    throw new Error('您不是该活动的参与者');
  }

  // 检查是否已归档
  const isArchived = await checkIsArchived(activityId);

  // 构建查询条件
  const conditions = [eq(groupMessages.activityId, activityId)];
  
  // 如果提供了 since，只获取该消息之后的新消息
  if (query.since) {
    // 先获取 since 消息的创建时间
    const [sinceMessage] = await db
      .select({ createdAt: groupMessages.createdAt })
      .from(groupMessages)
      .where(eq(groupMessages.id, query.since))
      .limit(1);

    if (sinceMessage) {
      conditions.push(gt(groupMessages.createdAt, sinceMessage.createdAt));
    }
  }

  const limit = query.limit || 50;

  // 查询消息（包含发送者信息）
  const messageList = await db
    .select({
      id: groupMessages.id,
      activityId: groupMessages.activityId,
      senderId: groupMessages.senderId,
      type: groupMessages.type,
      content: groupMessages.content,
      createdAt: groupMessages.createdAt,
      senderNickname: users.nickname,
      senderAvatarUrl: users.avatarUrl,
    })
    .from(groupMessages)
    .leftJoin(users, eq(groupMessages.senderId, users.id))
    .where(and(...conditions))
    .orderBy(groupMessages.createdAt)
    .limit(limit);

  const messages: ChatMessageResponse[] = messageList.map(m => ({
    id: m.id,
    activityId: m.activityId,
    senderId: m.senderId,
    senderNickname: m.senderNickname,
    senderAvatarUrl: m.senderAvatarUrl,
    type: m.type,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
  }));

  return { messages, isArchived };
}

/**
 * 发送消息
 */
export async function sendMessage(
  activityId: string,
  userId: string,
  data: SendMessageRequest
): Promise<{ id: string }> {
  // 检查用户是否为参与者
  const isParticipant = await checkIsParticipant(activityId, userId);
  if (!isParticipant) {
    throw new Error('您不是该活动的参与者');
  }

  // 检查是否已归档
  const isArchived = await checkIsArchived(activityId);
  if (isArchived) {
    throw new Error('群聊已归档，无法发送消息');
  }

  // 插入消息
  const [message] = await db
    .insert(groupMessages)
    .values({
      activityId,
      senderId: userId,
      type: 'text',
      content: data.content,
    })
    .returning({ id: groupMessages.id });

  return { id: message.id };
}

/**
 * 发送系统消息（内部调用）
 */
export async function sendSystemMessage(
  activityId: string,
  content: string
): Promise<void> {
  await db
    .insert(groupMessages)
    .values({
      activityId,
      senderId: null, // 系统消息无发送者
      type: 'system',
      content,
    });
}
