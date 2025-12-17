// Admin Activity Service - 管理后台活动管理业务逻辑
import { 
  db, 
  activities, 
  users, 
  participants, 
  actionLogs,
  eq, 
  sql, 
  and, 
  or, 
  inArray, 
  like, 
  gte, 
  lte,
  count,
  desc,
  asc
} from '@juchang/db';
import type { 
  AdminActivityView, 
  ActivityFilterOptions,
  AdminActivityListResponse,
  ActivityModerationAction 
} from './admin-activity.model';

/**
 * 获取管理后台活动列表（支持筛选、搜索、分页）
 */
export async function getAdminActivitiesList(
  options: ActivityFilterOptions
): Promise<AdminActivityListResponse> {
  const {
    search,
    status,
    type,
    riskLevel,
    isGhost,
    createdDateRange,
    startDateRange,
    locationRadius,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;

  const offset = (page - 1) * limit;

  // 构建查询条件
  const conditions = [];

  // 搜索条件
  if (search) {
    conditions.push(
      or(
        like(activities.title, `%${search}%`),
        like(activities.description, `%${search}%`),
        like(activities.locationName, `%${search}%`)
      )
    );
  }

  // 状态筛选
  if (status && status.length > 0) {
    conditions.push(inArray(activities.status, status as any));
  }

  // 类型筛选
  if (type && type.length > 0) {
    conditions.push(inArray(activities.type, type as any));
  }

  // 风险等级筛选
  if (riskLevel && riskLevel.length > 0) {
    conditions.push(inArray(activities.riskLevel, riskLevel as any));
  }

  // 锚点活动筛选
  if (typeof isGhost === 'boolean') {
    conditions.push(eq(activities.isGhost, isGhost));
  }

  // 创建时间范围
  if (createdDateRange) {
    conditions.push(
      and(
        gte(activities.createdAt, createdDateRange[0]),
        lte(activities.createdAt, createdDateRange[1])
      )
    );
  }

  // 开始时间范围
  if (startDateRange) {
    conditions.push(
      and(
        gte(activities.startAt, startDateRange[0]),
        lte(activities.startAt, startDateRange[1])
      )
    );
  }

  // 地理位置筛选
  if (locationRadius) {
    const { center, radius } = locationRadius;
    conditions.push(
      sql`ST_DWithin(
        ${activities.location}, 
        ST_SetSRID(ST_MakePoint(${center[0]}, ${center[1]}), 4326)::geography, 
        ${radius * 1000}
      )`
    );
  }

  // 排序字段映射
  const sortField = {
    createdAt: activities.createdAt,
    startAt: activities.startAt,
    riskScore: activities.riskScore,
    participantCount: activities.currentParticipants
  }[sortBy];

  const orderBy = sortOrder === 'desc' ? desc(sortField) : asc(sortField);

  // 查询活动列表
  const activityList = await db
    .select({
      // 活动基础信息
      id: activities.id,
      title: activities.title,
      description: activities.description,
      startAt: activities.startAt,
      endAt: activities.endAt,
      type: activities.type,
      status: activities.status,
      maxParticipants: activities.maxParticipants,
      currentParticipants: activities.currentParticipants,
      feeType: activities.feeType,
      estimatedCost: activities.estimatedCost,
      riskScore: activities.riskScore,
      riskLevel: activities.riskLevel,
      isGhost: activities.isGhost,
      ghostAnchorType: activities.ghostAnchorType,
      ghostSuggestedType: activities.ghostSuggestedType,
      isBoosted: activities.isBoosted,
      isPinPlus: activities.isPinPlus,
      locationName: activities.locationName,
      address: activities.address,
      locationHint: activities.locationHint,
      location: activities.location,
      createdAt: activities.createdAt,
      updatedAt: activities.updatedAt,
      // 创建者信息
      creatorId: users.id,
      creatorNickname: users.nickname,
      creatorAvatar: users.avatarUrl,
      creatorPhone: users.phoneNumber,
    })
    .from(activities)
    .innerJoin(users, eq(activities.creatorId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  // 获取总数
  const [{ total }] = await db
    .select({ total: count() })
    .from(activities)
    .innerJoin(users, eq(activities.creatorId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  // 获取每个活动的参与者数量和举报数量（这里简化处理，实际可能需要优化）
  const activityIds = activityList.map(a => a.id);
  
  // 批量查询参与者数量
  const participantCounts = await db
    .select({
      activityId: participants.activityId,
      count: count()
    })
    .from(participants)
    .where(inArray(participants.activityId, activityIds))
    .groupBy(participants.activityId);

  const participantCountMap = new Map(
    participantCounts.map(p => [p.activityId, p.count])
  );

  // 转换数据格式
  const data: AdminActivityView[] = activityList.map(item => ({
    id: item.id,
    title: item.title,
    description: item.description,
    startAt: item.startAt,
    endAt: item.endAt,
    type: item.type,
    status: item.status,
    maxParticipants: item.maxParticipants,
    currentParticipants: item.currentParticipants,
    feeType: item.feeType,
    estimatedCost: item.estimatedCost,
    riskScore: item.riskScore,
    riskLevel: item.riskLevel,
    isGhost: item.isGhost,
    ghostAnchorType: item.ghostAnchorType,
    ghostSuggestedType: item.ghostSuggestedType,
    isBoosted: item.isBoosted,
    isPinPlus: item.isPinPlus,
    locationName: item.locationName,
    address: item.address,
    locationHint: item.locationHint,
    location: item.location 
      ? [item.location.x, item.location.y] as [number, number]
      : null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    creatorInfo: {
      id: item.creatorId,
      nickname: item.creatorNickname,
      avatarUrl: item.creatorAvatar,
      phoneNumber: item.creatorPhone,
    },
    participantCount: participantCountMap.get(item.id) || 0,
    reportCount: 0, // TODO: 实现举报统计
    moderationFlags: [], // TODO: 实现审核标记
    lastModeratedAt: null, // TODO: 实现最后审核时间
  }));

  return {
    data,
    total,
    page,
    limit,
    hasMore: offset + limit < total
  };
}

/**
 * 根据ID获取活动详情（管理后台版本）
 */
export async function getAdminActivityById(id: string): Promise<AdminActivityView | null> {
  // 查询活动详情
  const [activity] = await db
    .select({
      // 活动基础信息
      id: activities.id,
      title: activities.title,
      description: activities.description,
      startAt: activities.startAt,
      endAt: activities.endAt,
      type: activities.type,
      status: activities.status,
      maxParticipants: activities.maxParticipants,
      currentParticipants: activities.currentParticipants,
      feeType: activities.feeType,
      estimatedCost: activities.estimatedCost,
      riskScore: activities.riskScore,
      riskLevel: activities.riskLevel,
      isGhost: activities.isGhost,
      ghostAnchorType: activities.ghostAnchorType,
      ghostSuggestedType: activities.ghostSuggestedType,
      isBoosted: activities.isBoosted,
      isPinPlus: activities.isPinPlus,
      locationName: activities.locationName,
      address: activities.address,
      locationHint: activities.locationHint,
      location: activities.location,
      createdAt: activities.createdAt,
      updatedAt: activities.updatedAt,
      // 创建者信息
      creatorId: users.id,
      creatorNickname: users.nickname,
      creatorAvatar: users.avatarUrl,
      creatorPhone: users.phoneNumber,
    })
    .from(activities)
    .innerJoin(users, eq(activities.creatorId, users.id))
    .where(eq(activities.id, id))
    .limit(1);

  if (!activity) {
    return null;
  }

  // 获取参与者数量
  const [{ participantCount }] = await db
    .select({ participantCount: count() })
    .from(participants)
    .where(eq(participants.activityId, id));

  return {
    id: activity.id,
    title: activity.title,
    description: activity.description,
    startAt: activity.startAt,
    endAt: activity.endAt,
    type: activity.type,
    status: activity.status,
    maxParticipants: activity.maxParticipants,
    currentParticipants: activity.currentParticipants,
    feeType: activity.feeType,
    estimatedCost: activity.estimatedCost,
    riskScore: activity.riskScore,
    riskLevel: activity.riskLevel,
    isGhost: activity.isGhost,
    ghostAnchorType: activity.ghostAnchorType,
    ghostSuggestedType: activity.ghostSuggestedType,
    isBoosted: activity.isBoosted,
    isPinPlus: activity.isPinPlus,
    locationName: activity.locationName,
    address: activity.address,
    locationHint: activity.locationHint,
    location: activity.location 
      ? [activity.location.x, activity.location.y] as [number, number]
      : null,
    createdAt: activity.createdAt,
    updatedAt: activity.updatedAt,
    creatorInfo: {
      id: activity.creatorId,
      nickname: activity.creatorNickname,
      avatarUrl: activity.creatorAvatar,
      phoneNumber: activity.creatorPhone,
    },
    participantCount,
    reportCount: 0, // TODO: 实现举报统计
    moderationFlags: [], // TODO: 实现审核标记
    lastModeratedAt: null, // TODO: 实现最后审核时间
  };
}

/**
 * 执行活动审核操作
 */
export async function moderateActivity(
  action: ActivityModerationAction,
  adminUserId: string
): Promise<{ success: boolean; message: string }> {
  const { activityId, action: moderationAction, reason, notes } = action;

  // 检查活动是否存在
  const [activity] = await db
    .select()
    .from(activities)
    .where(eq(activities.id, activityId))
    .limit(1);

  if (!activity) {
    throw new Error('活动不存在');
  }

  // 根据操作类型更新活动状态
  let updateData: any = { updatedAt: new Date() };
  let actionMessage = '';

  switch (moderationAction) {
    case 'approve':
      updateData.status = 'published';
      actionMessage = '活动已批准';
      break;
    case 'hide':
      updateData.status = 'hidden';
      actionMessage = '活动已隐藏';
      break;
    case 'remove':
      updateData.status = 'removed';
      actionMessage = '活动已删除';
      break;
    case 'flag':
      // 标记但不改变状态，增加风险评分
      updateData.riskScore = Math.min(100, activity.riskScore + 20);
      if (updateData.riskScore >= 80) {
        updateData.riskLevel = 'high';
      } else if (updateData.riskScore >= 50) {
        updateData.riskLevel = 'medium';
      }
      actionMessage = '活动已标记';
      break;
    case 'restore':
      updateData.status = 'published';
      updateData.riskScore = Math.max(0, activity.riskScore - 10);
      if (updateData.riskScore < 30) {
        updateData.riskLevel = 'low';
      } else if (updateData.riskScore < 60) {
        updateData.riskLevel = 'medium';
      }
      actionMessage = '活动已恢复';
      break;
    default:
      throw new Error('无效的审核操作');
  }

  // 更新活动状态
  await db
    .update(activities)
    .set(updateData)
    .where(eq(activities.id, activityId));

  // 记录操作日志
  await db
    .insert(actionLogs)
    .values({
      userId: adminUserId,
      actionType: `activity_${moderationAction}`,
      metadata: {
        activityId,
        targetType: 'activity',
        action: moderationAction,
        reason,
        notes: notes || null,
        previousStatus: activity.status,
        newStatus: updateData.status,
        previousRiskScore: activity.riskScore,
        newRiskScore: updateData.riskScore
      }
    });

  return {
    success: true,
    message: actionMessage
  };
}

/**
 * 批量审核活动
 */
export async function bulkModerateActivities(
  activityIds: string[],
  action: string,
  reason: string,
  notes: string | undefined,
  adminUserId: string
): Promise<{ success: boolean; processed: number; message: string }> {
  let processed = 0;

  for (const activityId of activityIds) {
    try {
      await moderateActivity(
        {
          activityId,
          action: action as any,
          reason,
          notes,
          adminId: adminUserId
        },
        adminUserId
      );
      processed++;
    } catch (error) {
      console.error(`批量审核活动 ${activityId} 失败:`, error);
    }
  }

  return {
    success: processed > 0,
    processed,
    message: `成功处理 ${processed}/${activityIds.length} 个活动`
  };
}

/**
 * 获取活动统计信息
 */
export async function getActivityStats() {
  // 总活动数
  const [{ totalActivities }] = await db
    .select({ totalActivities: count() })
    .from(activities);

  // 按状态统计
  const statusStats = await db
    .select({
      status: activities.status,
      count: count()
    })
    .from(activities)
    .groupBy(activities.status);

  // 按类型统计
  const typeStats = await db
    .select({
      type: activities.type,
      count: count()
    })
    .from(activities)
    .groupBy(activities.type);

  // 按风险等级统计
  const riskStats = await db
    .select({
      riskLevel: activities.riskLevel,
      count: count()
    })
    .from(activities)
    .groupBy(activities.riskLevel);

  // 今日新增活动
  const [{ todayActivities }] = await db
    .select({ todayActivities: count() })
    .from(activities)
    .where(gte(activities.createdAt, sql`CURRENT_DATE`));

  return {
    totalActivities,
    todayActivities,
    statusStats: statusStats.reduce((acc, item) => {
      acc[item.status] = item.count;
      return acc;
    }, {} as Record<string, number>),
    typeStats: typeStats.reduce((acc, item) => {
      acc[item.type] = item.count;
      return acc;
    }, {} as Record<string, number>),
    riskStats: riskStats.reduce((acc, item) => {
      acc[item.riskLevel] = item.count;
      return acc;
    }, {} as Record<string, number>)
  };
}