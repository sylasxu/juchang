// Activity Service - 纯业务逻辑，无 HTTP 依赖
import { db, activities, users, participants, eq, sql, and, inArray } from '@juchang/db';
import type { 
  ActivityDetailResponse, 
  MapActivityItem, 
  MapQuery, 
  CreateActivityRequest 
} from './activity.model';

/**
 * 根据地理位置查询附近活动
 */
export async function getActivitiesNearby(query: MapQuery): Promise<MapActivityItem[]> {
  const { lat, lng, radius = 5, type, status } = query;
  
  // 构建查询条件
  const conditions = [
    // PostGIS 距离查询：ST_DWithin 使用地理坐标系
    sql`ST_DWithin(${activities.location}, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, ${radius * 1000})`,
  ];

  // 添加类型筛选
  if (type) {
    conditions.push(eq(activities.type, type as any));
  }

  // 添加状态筛选（默认只显示招募中的活动）
  if (status) {
    conditions.push(eq(activities.status, status as any));
  } else {
    conditions.push(inArray(activities.status, ['published', 'full']));
  }

  // 查询活动列表
  const activityList = await db
    .select({
      // 活动基础信息
      id: activities.id,
      title: activities.title,
      startAt: activities.startAt,
      maxParticipants: activities.maxParticipants,
      currentParticipants: activities.currentParticipants,
      type: activities.type,
      feeType: activities.feeType,
      estimatedCost: activities.estimatedCost,
      status: activities.status,
      isBoosted: activities.isBoosted,
      isPinPlus: activities.isPinPlus,
      isLocationBlurred: activities.isLocationBlurred,
      location: activities.location,
      // 创建者信息
      creatorId: users.id,
      creatorNickname: users.nickname,
      creatorAvatar: users.avatarUrl,
    })
    .from(activities)
    .innerJoin(users, eq(activities.creatorId, users.id))
    .where(and(...conditions))
    .limit(100); // 限制返回数量

  // 转换数据格式
  return activityList.map(item => ({
    id: item.id,
    title: item.title,
    startAt: item.startAt,
    maxParticipants: item.maxParticipants,
    currentParticipants: item.currentParticipants,
    type: item.type,
    feeType: item.feeType,
    estimatedCost: item.estimatedCost,
    status: item.status,
    isBoosted: item.isBoosted,
    isPinPlus: item.isPinPlus,
    isLocationBlurred: item.isLocationBlurred,
    location: item.location 
      ? [item.location.x, item.location.y] as [number, number]
      : [0, 0] as [number, number],
    creator: {
      id: item.creatorId,
      nickname: item.creatorNickname,
      avatarUrl: item.creatorAvatar,
    },
  }));
}

/**
 * 创建活动
 */
export async function createActivity(data: CreateActivityRequest, creatorId: string) {
  const { location, boost, pinPlus, ...activityData } = data;
  
  // 创建活动记录
  const [newActivity] = await db
    .insert(activities)
    .values({
      ...activityData,
      creatorId,
      location: sql`ST_SetSRID(ST_MakePoint(${location[0]}, ${location[1]}), 4326)`,
      currentParticipants: 1, // 创建者自动参与
      // 增值服务
      isBoosted: boost || false,
      boostExpiresAt: boost ? sql`NOW() + INTERVAL '24 hours'` : null,
      isPinPlus: pinPlus || false,
      pinPlusExpiresAt: pinPlus ? sql`NOW() + INTERVAL '24 hours'` : null,
    })
    .returning();

  // TODO: 如果使用了增值服务，需要处理支付逻辑
  // TODO: 自动将创建者加入参与者列表

  return newActivity;
}

/**
 * 根据ID获取活动详情
 */
export async function getActivityById(id: string): Promise<ActivityDetailResponse | null> {
  // 查询活动详情
  const [activity] = await db
    .select()
    .from(activities)
    .where(eq(activities.id, id))
    .limit(1);

  if (!activity) {
    return null;
  }

  // 查询创建者信息
  const [creator] = await db
    .select({
      id: users.id,
      nickname: users.nickname,
      avatarUrl: users.avatarUrl,
      participationCount: users.participationCount,
      fulfillmentCount: users.fulfillmentCount,
      gender: users.gender,
      interestTags: users.interestTags,
    })
    .from(users)
    .where(eq(users.id, activity.creatorId))
    .limit(1);

  // 查询参与者信息
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
      },
    })
    .from(participants)
    .innerJoin(users, eq(participants.userId, users.id))
    .where(eq(participants.activityId, activity.id));

  // 转换 PostGIS geometry 为数组格式
  const location = activity.location 
    ? [activity.location.x, activity.location.y] as [number, number]
    : null;

  return {
    ...activity,
    location,
    creator: creator || null,
    participants: participantsList,
  };
}