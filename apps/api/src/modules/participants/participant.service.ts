// Participant Service - 参与者辅助功能 (MVP 简化版)
// 主要逻辑已移到 activities 模块
import { db, participants, users, eq } from '@juchang/db';
import type { ParticipantInfo } from './participant.model';

/**
 * 获取活动的参与者列表
 */
export async function getActivityParticipants(activityId: string): Promise<ParticipantInfo[]> {
  const participantsList = await db
    .select({
      id: participants.id,
      userId: participants.userId,
      status: participants.status,
      joinedAt: participants.joinedAt,
      user: {
        id: users.id,
        nickname: users.nickname,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(participants)
    .innerJoin(users, eq(participants.userId, users.id))
    .where(eq(participants.activityId, activityId));

  return participantsList.map(p => ({
    id: p.id,
    userId: p.userId,
    status: p.status,
    joinedAt: p.joinedAt?.toISOString() || null,
    user: p.user || null,
  }));
}
