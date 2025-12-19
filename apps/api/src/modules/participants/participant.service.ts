// Participant Service - 参与者业务逻辑
import { db, participants, activities, users, eq, and, sql } from '@juchang/db';
import type { 
  JoinActivityRequest, 
  ApprovalRequest,
  ParticipantDetail,
  FulfillmentRequest,
  DisputeRequest 
} from './participant.model';

/**
 * 用户报名参加活动
 */
export async function joinActivity(userId: string, request: JoinActivityRequest) {
  const { activityId, applicationMsg, useFastPass } = request;
  
  // 检查活动是否存在且可报名
  const [activity] = await db
    .select()
    .from(activities)
    .where(eq(activities.id, activityId))
    .limit(1);
    
  if (!activity) {
    throw new Error('活动不存在');
  }
  
  if (activity.status !== 'published') {
    throw new Error('活动已结束或已取消');
  }
  
  if (activity.currentParticipants >= activity.maxParticipants) {
    throw new Error('活动已满员');
  }
  
  // 检查是否已经报名
  const [existingParticipant] = await db
    .select()
    .from(participants)
    .where(and(
      eq(participants.activityId, activityId),
      eq(participants.userId, userId)
    ))
    .limit(1);
    
  if (existingParticipant) {
    throw new Error('您已经报名了这个活动');
  }
  
  // 创建参与记录
  const [newParticipant] = await db
    .insert(participants)
    .values({
      activityId,
      userId,
      applicationMsg,
      isFastPass: useFastPass || false,
      status: activity.joinMode === 'instant' ? 'approved' : 'pending',
    })
    .returning();
    
  // 如果是即时加入，更新活动参与人数
  if (activity.joinMode === 'instant') {
    await db
      .update(activities)
      .set({
        currentParticipants: activity.currentParticipants + 1,
      })
      .where(eq(activities.id, activityId));
  }
  
  // TODO: 如果使用了优先入场券，需要处理支付逻辑
  
  return newParticipant;
}

/**
 * 发起人审批参与申请
 */
export async function approveParticipant(creatorId: string, request: ApprovalRequest) {
  const { participantId, action, reason: _reason } = request;
  
  // 查询参与记录和活动信息
  const [participant] = await db
    .select({
      participant: participants,
      activity: activities,
    })
    .from(participants)
    .innerJoin(activities, eq(participants.activityId, activities.id))
    .where(eq(participants.id, participantId))
    .limit(1);
    
  if (!participant) {
    throw new Error('参与记录不存在');
  }
  
  // 检查权限：只有活动创建者可以审批
  if (participant.activity.creatorId !== creatorId) {
    throw new Error('无权限操作');
  }
  
  if (participant.participant.status !== 'pending') {
    throw new Error('该申请已经处理过了');
  }
  
  // 更新参与状态
  await db
    .update(participants)
    .set({
      status: action === 'approve' ? 'approved' : 'rejected',
      updatedAt: new Date(),
    })
    .where(eq(participants.id, participantId));
    
  // 如果通过审批，更新活动参与人数
  if (action === 'approve') {
    await db
      .update(activities)
      .set({
        currentParticipants: participant.activity.currentParticipants + 1,
      })
      .where(eq(activities.id, participant.participant.activityId));
  }
  
  // TODO: 发送通知给申请者
  
  return { success: true };
}

/**
 * 获取活动的参与者列表
 */
export async function getActivityParticipants(activityId: string): Promise<ParticipantDetail[]> {
  const participantsList = await db
    .select({
      // 参与者记录字段
      id: participants.id,
      activityId: participants.activityId,
      userId: participants.userId,
      status: participants.status,
      applicationMsg: participants.applicationMsg,
      isFastPass: participants.isFastPass,
      confirmedAt: participants.confirmedAt,
      isDisputed: participants.isDisputed,
      disputedAt: participants.disputedAt,
      disputeExpiresAt: participants.disputeExpiresAt,
      joinedAt: participants.joinedAt,
      updatedAt: participants.updatedAt,
      // 用户信息
      user: {
        id: users.id,
        nickname: users.nickname,
        avatarUrl: users.avatarUrl,
        participationCount: users.participationCount,
        fulfillmentCount: users.fulfillmentCount,
        gender: users.gender,
        interestTags: users.interestTags,
      },
    })
    .from(participants)
    .innerJoin(users, eq(participants.userId, users.id))
    .where(eq(participants.activityId, activityId));
    
  return participantsList;
}

/**
 * 履约确认（发起人操作）
 */
export async function confirmFulfillment(creatorId: string, request: FulfillmentRequest) {
  const { activityId, participants: participantList } = request;
  
  // 检查活动权限
  const [activity] = await db
    .select()
    .from(activities)
    .where(eq(activities.id, activityId))
    .limit(1);
    
  if (!activity) {
    throw new Error('活动不存在');
  }
  
  if (activity.creatorId !== creatorId) {
    throw new Error('无权限操作');
  }
  
  // 批量更新参与者状态
  for (const p of participantList) {
    const newStatus = p.fulfilled ? 'fulfilled' : 'absent';
    
    await db
      .update(participants)
      .set({
        status: newStatus,
        confirmedAt: new Date(),
        // 如果标记为未到场，设置申诉截止时间（24小时后）
        disputeExpiresAt: !p.fulfilled 
          ? sql`NOW() + INTERVAL '24 hours'` 
          : null,
      })
      .where(and(
        eq(participants.activityId, activityId),
        eq(participants.userId, p.userId)
      ));
      
    // 更新用户履约统计
    if (p.fulfilled) {
      await db
        .update(users)
        .set({
          fulfillmentCount: sql`${users.fulfillmentCount} + 1`,
        })
        .where(eq(users.id, p.userId));
    }
  }
  
  // 标记活动已确认
  await db
    .update(activities)
    .set({
      isConfirmed: true,
      confirmedAt: new Date(),
    })
    .where(eq(activities.id, activityId));
    
  // TODO: 发送通知给被标记为"未到场"的用户
  
  return { success: true };
}

/**
 * 用户申诉（被标记为未到场时）
 */
export async function disputeAbsence(userId: string, request: DisputeRequest) {
  const { participantId, reason: _reason } = request;
  
  // 查询参与记录
  const [participant] = await db
    .select()
    .from(participants)
    .where(eq(participants.id, participantId))
    .limit(1);
    
  if (!participant) {
    throw new Error('参与记录不存在');
  }
  
  if (participant.userId !== userId) {
    throw new Error('无权限操作');
  }
  
  if (participant.status !== 'absent') {
    throw new Error('只能对"未到场"状态进行申诉');
  }
  
  if (participant.disputeExpiresAt && new Date() > participant.disputeExpiresAt) {
    throw new Error('申诉时间已过期');
  }
  
  // 更新申诉状态
  await db
    .update(participants)
    .set({
      isDisputed: true,
      disputedAt: new Date(),
      // MVP 阶段：申诉后不扣分，状态保持争议
      status: 'pending', // 或者可以定义一个新的 'disputed' 状态
    })
    .where(eq(participants.id, participantId));
    
  // TODO: 记录申诉日志，用于后续分析
  
  return { success: true };
}