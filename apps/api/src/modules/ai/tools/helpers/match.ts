/**
 * Match Service - 匹配逻辑 (v4.0 Smart Broker - 3表精简版)
 * 
 * 精准匹配，tag 冲突直接不匹配
 * 偏好优先级原则：当前意向的 tags > 历史偏好
 */

import { 
  db, 
  partnerIntents, 
  intentMatches, 
  matchMessages,
  activities,
  participants,
  users,
  eq, 
  and, 
  not,
  sql,
  type PartnerIntent,
  type IntentMatch,
} from '@juchang/db';

// 冲突标签定义
const CONFLICTING_TAGS: [string, string][] = [
  ['NoAlcohol', 'Drinking'],
  ['Quiet', 'Party'],
  ['GirlOnly', 'BoyOnly'],
  ['AA', 'Treat'],
];

/**
 * 检测意向匹配
 */
export async function detectMatchesForIntent(intentId: string): Promise<IntentMatch | null> {
  const [intent] = await db
    .select()
    .from(partnerIntents)
    .where(eq(partnerIntents.id, intentId))
    .limit(1);
  
  if (!intent || intent.status !== 'active') return null;
  
  // 1. 查找候选意向 (同类型、3km内、活跃状态)
  const candidates = await db
    .select()
    .from(partnerIntents)
    .where(and(
      eq(partnerIntents.activityType, intent.activityType),
      eq(partnerIntents.status, 'active'),
      not(eq(partnerIntents.id, intentId)),
      not(eq(partnerIntents.userId, intent.userId)), // 不能匹配自己
      sql`ST_DWithin(
        ${partnerIntents.location}::geography,
        (SELECT location::geography FROM partner_intents WHERE id = ${intentId}),
        3000
      )`
    ));
  
  if (candidates.length === 0) return null;
  
  // 2. 检查 tag 冲突
  const intentTags = intent.metaData?.tags || [];
  const compatibleCandidates = candidates.filter(c => {
    const candidateTags = c.metaData?.tags || [];
    return !hasTagConflict(intentTags, candidateTags);
  });
  
  if (compatibleCandidates.length === 0) return null;
  
  // 3. 计算匹配分数
  const allIntents = [intent, ...compatibleCandidates];
  const matchScore = calculateMatchScore(allIntents);
  
  // 4. 检查阈值 (> 80%)
  if (matchScore < 80) return null;
  
  // 5. 创建匹配
  return createMatch(allIntents, matchScore);
}

/**
 * 检查 tag 冲突
 */
function hasTagConflict(tagsA: string[], tagsB: string[]): boolean {
  for (const [tag1, tag2] of CONFLICTING_TAGS) {
    if (
      (tagsA.includes(tag1) && tagsB.includes(tag2)) ||
      (tagsA.includes(tag2) && tagsB.includes(tag1))
    ) {
      return true;
    }
  }
  return false;
}

/**
 * 计算匹配分数
 */
function calculateMatchScore(intents: PartnerIntent[]): number {
  const allTags = intents.flatMap(i => i.metaData?.tags || []);
  
  if (allTags.length === 0) {
    // 没有 tags 时，基于活动类型匹配给 100 分
    return 100;
  }
  
  const tagCounts = allTags.reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const commonTags = Object.entries(tagCounts)
    .filter(([_, count]) => count >= 2)
    .map(([tag]) => tag);
  
  const avgTagCount = allTags.length / intents.length;
  return Math.round((commonTags.length / Math.max(avgTagCount, 1)) * 100);
}

/**
 * 获取共同标签
 */
function getCommonTags(intents: PartnerIntent[]): string[] {
  const allTags = intents.flatMap(i => i.metaData?.tags || []);
  const tagCounts = allTags.reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(tagCounts)
    .filter(([_, count]) => count >= 2)
    .map(([tag]) => tag);
}

/**
 * 计算确认截止时间 (6h 或当天 23:59，取较早者)
 */
function calculateConfirmDeadline(): Date {
  const now = new Date();
  const sixHoursLater = new Date(now.getTime() + 6 * 60 * 60 * 1000);
  
  // 当天 23:59
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  
  return sixHoursLater < endOfDay ? sixHoursLater : endOfDay;
}

/**
 * 创建匹配记录 (3表精简版)
 */
async function createMatch(intents: PartnerIntent[], matchScore: number): Promise<IntentMatch> {
  // 选择最早的意向创建者作为 Temp_Organizer
  const tempOrganizer = intents.reduce((a, b) => 
    new Date(a.createdAt) < new Date(b.createdAt) ? a : b
  );
  
  // 计算确认截止时间
  const confirmDeadline = calculateConfirmDeadline();
  
  // 获取共同标签
  const commonTags = getCommonTags(intents);
  
  // 使用第一个意向的位置作为中心位置
  const firstIntent = intents[0];
  
  // 提取 intentIds 和 userIds 数组
  const intentIds = intents.map(i => i.id);
  const userIds = intents.map(i => i.userId);
  
  // 创建匹配记录 (Match 本身就是群组)
  const [match] = await db.insert(intentMatches).values({
    activityType: intents[0].activityType,
    matchScore,
    commonTags,
    centerLocation: firstIntent.location,
    centerLocationHint: firstIntent.locationHint,
    tempOrganizerId: tempOrganizer.userId,
    intentIds,
    userIds,
    confirmDeadline,
    outcome: 'pending',
  }).returning();
  
  // 发送 Icebreaker 消息
  await sendIcebreaker(match, intents);
  
  return match;
}

/**
 * 发送 Icebreaker 消息 (直接关联 matchId)
 */
async function sendIcebreaker(
  match: IntentMatch, 
  intents: PartnerIntent[]
): Promise<void> {
  // 获取用户昵称
  const userIds = intents.map(i => i.userId);
  const userList = await db
    .select({ id: users.id, nickname: users.nickname })
    .from(users)
    .where(sql`${users.id} = ANY(${userIds})`);
  
  const userMap = new Map(userList.map(u => [u.id, u.nickname || '匿名用户']));
  
  // 获取临时召集人昵称
  const organizerNickname = userMap.get(match.tempOrganizerId) || '匿名用户';
  
  // 活动类型名称
  const typeNames: Record<string, string> = {
    food: '吃饭',
    entertainment: '娱乐',
    sports: '运动',
    boardgame: '桌游',
    other: '活动',
  };
  
  const activityTypeName = typeNames[match.activityType] || '活动';
  const commonTagsStr = match.commonTags.length > 0 
    ? `都${match.commonTags.join('、')}` 
    : '需求很一致';
  
  const icebreakerContent = `🎉 终于匹配上了！
大家都想${activityTypeName}，而且${commonTagsStr}。
既然需求这么一致，我帮你们把方案拟好了。
@${organizerNickname} 要不你点个头，我们这局就成了？`;
  
  // 直接插入到 match_messages (Match = Group)
  await db.insert(matchMessages).values({
    matchId: match.id,
    senderId: null, // 系统消息
    messageType: 'icebreaker',
    content: icebreakerContent,
  });
}

/**
 * 确认匹配 → 转为活动 (3表精简版)
 */
export async function confirmMatch(matchId: string, userId: string): Promise<{
  success: boolean;
  activityId?: string;
  error?: string;
}> {
  // 1. 获取匹配信息
  const [match] = await db
    .select()
    .from(intentMatches)
    .where(eq(intentMatches.id, matchId))
    .limit(1);
  
  if (!match) {
    return { success: false, error: '找不到这个匹配' };
  }
  
  if (match.tempOrganizerId !== userId) {
    return { success: false, error: '只有临时召集人才能确认发布' };
  }
  
  if (match.outcome !== 'pending') {
    return { success: false, error: '这个匹配已经处理过了' };
  }
  
  if (new Date() > match.confirmDeadline) {
    return { success: false, error: '匹配已过期，请重新发布意向' };
  }
  
  // 2. 直接从 match 获取 intentIds 和 userIds (无需查中间表)
  const intentIds = match.intentIds;
  const userIds = match.userIds;
  
  // 3. 获取意向详情
  const intentList = await db
    .select()
    .from(partnerIntents)
    .where(sql`${partnerIntents.id} = ANY(${intentIds})`);
  
  if (intentList.length === 0) {
    return { success: false, error: '找不到相关意向' };
  }
  
  const firstIntent = intentList[0];
  
  // 活动类型名称
  const typeNames: Record<string, string> = {
    food: '美食',
    entertainment: '娱乐',
    sports: '运动',
    boardgame: '桌游',
    other: '其他',
  };
  
  // 4. 创建活动
  const [activity] = await db.insert(activities).values({
    creatorId: userId,
    title: `🤝 ${typeNames[firstIntent.activityType]}搭子局`,
    description: `由搭子匹配自动创建。共同偏好：${match.commonTags.join('、') || '无'}`,
    location: match.centerLocation,
    locationName: match.centerLocationHint,
    locationHint: match.centerLocationHint,
    startAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 默认 2 小时后
    type: firstIntent.activityType,
    maxParticipants: userIds.length + 2, // 预留 2 个位置
    currentParticipants: userIds.length,
    status: 'active',
  }).returning();
  
  // 5. 添加参与者
  await db.insert(participants).values(
    userIds.map(uid => ({
      activityId: activity.id,
      userId: uid,
      status: 'joined' as const,
    }))
  );
  
  // 6. 更新匹配状态
  await db.update(intentMatches)
    .set({ 
      outcome: 'confirmed', 
      activityId: activity.id,
      confirmedAt: new Date(),
    })
    .where(eq(intentMatches.id, matchId));
  
  // 7. 更新所有相关意向状态
  await db.update(partnerIntents)
    .set({ status: 'matched', updatedAt: new Date() })
    .where(sql`${partnerIntents.id} = ANY(${intentIds})`);
  
  return { success: true, activityId: activity.id };
}

/**
 * 获取用户待确认的匹配 (3表精简版 - 直接查数组)
 */
export async function getPendingMatchesForUser(userId: string) {
  // 直接查询 userIds 数组包含该用户的匹配
  const matches = await db
    .select()
    .from(intentMatches)
    .where(and(
      sql`${userId} = ANY(${intentMatches.userIds})`,
      eq(intentMatches.outcome, 'pending')
    ));
  
  return matches;
}
