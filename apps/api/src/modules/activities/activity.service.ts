// Activity Service - 纯业务逻辑，无 HTTP 依赖
import { db, activities, users, participants, eq, sql, and, inArray } from '@juchang/db';
import type { 
  ActivityDetailResponse, 
  MapActivityItem, 
  NearbyResponse,
  NearbyMapItem,
  MapQuery, 
  CreateActivityRequest 
} from './activity.model';

/**
 * 🔥 根据地理位置查询附近活动（支持聚合）
 */
export async function getActivitiesNearbyWithClustering(query: MapQuery): Promise<NearbyResponse> {
  const { lat, lng, radius = 5, zoom_level = 12, type, status, include_ghosts = true } = query;
  
  // 根据缩放级别计算聚合距离（米）
  const clusterDistance = Math.max(100, 2000 / Math.pow(2, zoom_level - 10));
  
  // 构建查询条件
  const conditions = [
    sql`ST_DWithin(${activities.location}, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, ${radius * 1000})`,
  ];

  // 添加类型筛选
  if (type) {
    conditions.push(eq(activities.type, type as any));
  }

  // 添加状态筛选
  if (status) {
    conditions.push(eq(activities.status, status as any));
  } else {
    conditions.push(inArray(activities.status, ['published', 'full']));
  }

  // 如果不包含幽灵锚点，排除它们
  if (!include_ghosts) {
    conditions.push(eq(activities.isGhost, false));
  }

  // 使用 PostGIS ST_ClusterDBSCAN 进行聚合查询
  const clusteredResults = await db
    .select({
      id: activities.id,
      title: activities.title,
      type: activities.type,
      status: activities.status,
      isBoosted: activities.isBoosted,
      isPinPlus: activities.isPinPlus,
      isGhost: activities.isGhost,
      ghostAnchorType: activities.ghostAnchorType,
      ghostSuggestedType: activities.ghostSuggestedType,
      locationHint: activities.locationHint,
      location: activities.location,
      // 聚合信息
      clusterId: sql<number>`ST_ClusterDBSCAN(${activities.location}, ${clusterDistance}, 1) OVER ()`,
      lat: sql<number>`ST_Y(${activities.location})`,
      lng: sql<number>`ST_X(${activities.location})`,
    })
    .from(activities)
    .where(and(...conditions))
    .limit(200);

  // 处理聚合结果
  const clusterMap = new Map<number, NearbyMapItem[]>();
  const singleItems: NearbyMapItem[] = [];

  for (const item of clusteredResults) {
    const mapItem: NearbyMapItem = {
      type: item.isGhost ? 'ghost' : 'activity',
      id: item.id,
      lat: item.lat,
      lng: item.lng,
      title: item.title,
      isBoosted: item.isBoosted || false,
      isPinPlus: item.isPinPlus || false,
      locationHint: item.locationHint || undefined,
      ghostType: item.ghostSuggestedType || undefined,
    };

    if (item.clusterId !== null) {
      if (!clusterMap.has(item.clusterId)) {
        clusterMap.set(item.clusterId, []);
      }
      clusterMap.get(item.clusterId)!.push(mapItem);
    } else {
      singleItems.push(mapItem);
    }
  }

  // 生成最终结果
  const items: NearbyMapItem[] = [...singleItems];

  // 处理聚合点
  for (const [clusterId, clusterItems] of clusterMap) {
    if (clusterItems.length > 1) {
      // 计算聚合点的中心位置
      const centerLat = clusterItems.reduce((sum, item) => sum + item.lat, 0) / clusterItems.length;
      const centerLng = clusterItems.reduce((sum, item) => sum + item.lng, 0) / clusterItems.length;
      
      items.push({
        type: 'cluster',
        id: `cluster_${clusterId}`,
        lat: centerLat,
        lng: centerLng,
        count: clusterItems.length,
      });
    } else {
      // 单个项目不聚合
      items.push(...clusterItems);
    }
  }

  return {
    items,
    total: clusteredResults.length,
    hasMore: clusteredResults.length >= 200,
  };
}

/**
 * 根据地理位置查询附近活动（传统方式，用于高缩放级别）
 */
export async function getActivitiesNearby(query: MapQuery): Promise<MapActivityItem[]> {
  const { lat, lng, radius = 5, type, status, include_ghosts = true } = query;
  
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

  // 如果不包含幽灵锚点，排除它们
  if (!include_ghosts) {
    conditions.push(eq(activities.isGhost, false));
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
      isGhost: activities.isGhost,
      ghostAnchorType: activities.ghostAnchorType,
      ghostSuggestedType: activities.ghostSuggestedType,
      locationHint: activities.locationHint,
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
    isGhost: item.isGhost,
    ghostAnchorType: item.ghostAnchorType,
    ghostSuggestedType: item.ghostSuggestedType,
    locationHint: item.locationHint || undefined,
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

/**
 * 获取活动列表（支持筛选）
 */
export async function getActivitiesList(query: any) {
  const { page = 1, limit = 20, type, status, creator_id, lat, lng, radius = 10 } = query;
  const offset = (page - 1) * limit;

  // 构建查询条件
  const conditions = [];

  if (type) {
    conditions.push(eq(activities.type, type as any));
  }

  if (status) {
    conditions.push(eq(activities.status, status as any));
  } else {
    conditions.push(inArray(activities.status, ['published', 'full']));
  }

  if (creator_id) {
    conditions.push(eq(activities.creatorId, creator_id));
  }

  // 地理位置筛选
  if (lat && lng) {
    conditions.push(
      sql`ST_DWithin(${activities.location}, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, ${radius * 1000})`
    );
  }

  // 排除幽灵锚点
  conditions.push(eq(activities.isGhost, false));

  // 查询活动列表
  const activityList = await db
    .select({
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
      isGhost: activities.isGhost,
      ghostAnchorType: activities.ghostAnchorType,
      ghostSuggestedType: activities.ghostSuggestedType,
      locationHint: activities.locationHint,
      location: activities.location,
      creatorId: users.id,
      creatorNickname: users.nickname,
      creatorAvatar: users.avatarUrl,
    })
    .from(activities)
    .innerJoin(users, eq(activities.creatorId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(sql`${activities.isBoosted} DESC, ${activities.isPinPlus} DESC, ${activities.createdAt} DESC`)
    .limit(limit)
    .offset(offset);

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
    isGhost: item.isGhost,
    ghostAnchorType: item.ghostAnchorType,
    ghostSuggestedType: item.ghostSuggestedType,
    locationHint: item.locationHint || undefined,
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
 * 更新活动信息
 */
export async function updateActivity(activityId: string, data: any, userId: string) {
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
    throw new Error('只有活动发起人可以修改活动');
  }

  // 处理位置更新
  const updateData: any = { ...data, updatedAt: new Date() };
  if (data.location) {
    updateData.location = sql`ST_SetSRID(ST_MakePoint(${data.location[0]}, ${data.location[1]}), 4326)`;
  }

  // 更新活动信息
  const [updated] = await db
    .update(activities)
    .set(updateData)
    .where(eq(activities.id, activityId))
    .returning();

  return updated;
}

/**
 * 删除活动
 */
export async function deleteActivity(activityId: string, userId: string) {
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
    throw new Error('只有活动发起人可以删除活动');
  }

  // 检查活动状态
  if (activity.status === 'finished') {
    throw new Error('已完成的活动不能删除');
  }

  // 删除参与者记录
  await db
    .delete(participants)
    .where(eq(participants.activityId, activityId));

  // 删除活动
  await db
    .delete(activities)
    .where(eq(activities.id, activityId));

  return { success: true };
}

/**
 * 报名参加活动
 */
export async function joinActivity(activityId: string, userId: string, data: any) {
  // 检查活动是否存在
  const [activity] = await db
    .select()
    .from(activities)
    .where(eq(activities.id, activityId))
    .limit(1);

  if (!activity) {
    throw new Error('活动不存在');
  }

  if (activity.status !== 'published') {
    throw new Error('活动不在招募中');
  }

  if (activity.currentParticipants >= activity.maxParticipants) {
    throw new Error('活动人数已满');
  }

  // 检查是否已报名
  const [existing] = await db
    .select()
    .from(participants)
    .where(and(
      eq(participants.activityId, activityId),
      eq(participants.userId, userId)
    ))
    .limit(1);

  if (existing) {
    throw new Error('您已报名此活动');
  }

  // 创建参与记录
  const [participant] = await db
    .insert(participants)
    .values({
      activityId,
      userId,
      status: activity.joinMode === 'instant' ? 'approved' : 'pending',
      applicationMsg: data?.applicationMsg || null,
      isFastPass: data?.isFastPass || false,
    })
    .returning();

  // 更新活动参与人数
  if (activity.joinMode === 'instant') {
    await db
      .update(activities)
      .set({
        currentParticipants: activity.currentParticipants + 1,
        status: activity.currentParticipants + 1 >= activity.maxParticipants ? 'full' : 'published',
      })
      .where(eq(activities.id, activityId));
  }

  return participant;
}

/**
 * 取消报名
 */
export async function cancelJoin(activityId: string, userId: string) {
  // 检查参与记录
  const [participant] = await db
    .select()
    .from(participants)
    .where(and(
      eq(participants.activityId, activityId),
      eq(participants.userId, userId)
    ))
    .limit(1);

  if (!participant) {
    throw new Error('您未报名此活动');
  }

  // 删除参与记录
  await db
    .delete(participants)
    .where(eq(participants.id, participant.id));

  // 更新活动参与人数
  const [activity] = await db
    .select()
    .from(activities)
    .where(eq(activities.id, activityId))
    .limit(1);

  if (activity && participant.status === 'approved') {
    await db
      .update(activities)
      .set({
        currentParticipants: Math.max(0, activity.currentParticipants - 1),
        status: activity.status === 'full' ? 'published' : activity.status,
      })
      .where(eq(activities.id, activityId));
  }

  return { success: true };
}

/**
 * 确认活动完成
 */
export async function confirmActivity(activityId: string, userId: string, data: any) {
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
    throw new Error('只有活动发起人可以确认活动');
  }

  // 更新活动状态
  await db
    .update(activities)
    .set({
      status: 'finished',
      isConfirmed: true,
      confirmedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(activities.id, activityId));

  // 更新参与者履约状态
  if (data?.participantStatuses) {
    for (const status of data.participantStatuses) {
      await db
        .update(participants)
        .set({
          status: status.fulfilled ? 'fulfilled' : 'absent',
          confirmedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(participants.id, status.participantId));

      // 更新用户靠谱度统计
      const [participant] = await db
        .select()
        .from(participants)
        .where(eq(participants.id, status.participantId))
        .limit(1);

      if (participant) {
        if (status.fulfilled) {
          await db
            .update(users)
            .set({
              participationCount: sql`${users.participationCount} + 1`,
              fulfillmentCount: sql`${users.fulfillmentCount} + 1`,
            })
            .where(eq(users.id, participant.userId));
        } else {
          await db
            .update(users)
            .set({
              participationCount: sql`${users.participationCount} + 1`,
            })
            .where(eq(users.id, participant.userId));
        }
      }
    }
  }

  return { success: true };
}

/**
 * 获取活动参与者列表
 */
export async function getActivityParticipants(activityId: string) {
  const participantsList = await db
    .select({
      id: participants.id,
      activityId: participants.activityId,
      userId: participants.userId,
      status: participants.status,
      applicationMsg: participants.applicationMsg,
      isFastPass: participants.isFastPass,
      confirmedAt: participants.confirmedAt,
      joinedAt: participants.joinedAt,
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
    .where(eq(participants.activityId, activityId));

  return participantsList;
}

/**
 * 创建幽灵锚点（运营功能）
 * 幽灵锚点用于引导用户在特定区域创建活动
 */
export async function createGhostAnchor(data: any) {
  const { 
    location, 
    locationName, 
    address, 
    locationHint, 
    ghostAnchorType, 
    ghostSuggestedType,
    title,
    description 
  } = data;
  
  // 创建幽灵锚点（本质上是一个特殊的活动记录）
  const [ghost] = await db
    .insert(activities)
    .values({
      // 幽灵锚点标记
      isGhost: true,
      ghostAnchorType,
      ghostSuggestedType: ghostSuggestedType || null,
      
      // 位置信息
      location: sql`ST_SetSRID(ST_MakePoint(${location[0]}, ${location[1]}), 4326)`,
      locationName,
      address: address || null,
      locationHint: locationHint || null,
      
      // 基础信息（幽灵锚点的占位数据）
      title: title || `${ghostSuggestedType || '活动'}热门区域`,
      description: description || '这里是热门活动区域，快来发起你的活动吧！',
      type: ghostSuggestedType || 'other',
      startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后
      maxParticipants: 4,
      currentParticipants: 0,
      feeType: 'free',
      joinMode: 'instant',
      status: 'published',
      
      // 创建者ID使用系统账号（需要预先创建）
      creatorId: sql`(SELECT id FROM users WHERE wx_openid = 'system' LIMIT 1)`,
    })
    .returning();

  return ghost;
}