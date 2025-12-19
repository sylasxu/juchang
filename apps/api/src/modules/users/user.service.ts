// User Service - 纯业务逻辑，无 HTTP 依赖
import { db, users, eq, count, or, ilike, and, desc, asc } from '@juchang/db';
import type { 
  PaginationQuery, 
  ListResponse, 
  UpdateUserBody, 
  AdminUserQuery, 
  AdminUserListResponse, 
  AdminUserView 
} from './user.model';

/**
 * 获取用户列表（分页 + 搜索）
 */
export async function getUserList(query: PaginationQuery): Promise<ListResponse> {
  const { page = 1, limit = 20, search } = query;
  const offset = (page - 1) * limit;

  // 构建搜索条件
  const searchCondition = search
    ? or(
        ilike(users.nickname, `%${search}%`),
        ilike(users.phoneNumber, `%${search}%`)
      )
    : undefined;

  const [data, totalResult] = await Promise.all([
    db
      .select()
      .from(users)
      .where(searchCondition)
      .limit(limit)
      .offset(offset)
      .orderBy(users.createdAt),
    db
      .select({ count: count() })
      .from(users)
      .where(searchCondition),
  ]);

  const total = totalResult[0]?.count || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    total,
    page,
    totalPages,
  };
}

/**
 * 根据 ID 获取用户详情
 */
export async function getUserById(id: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return user || null;
}

/**
 * 封禁用户
 */
export async function blockUser(id: string): Promise<boolean> {
  try {
    await db
      .update(users)
      .set({ isBlocked: true })
      .where(eq(users.id, id));

    return true;
  } catch (error) {
    console.error('封禁用户失败:', error);
    return false;
  }
}

/**
 * 解封用户
 */
export async function unblockUser(id: string): Promise<boolean> {
  try {
    await db
      .update(users)
      .set({ isBlocked: false })
      .where(eq(users.id, id));

    return true;
  } catch (error) {
    console.error('解封用户失败:', error);
    return false;
  }
}

/**
 * 更新用户信息
 */
export async function updateUser(id: string, data: UpdateUserBody) {
  const [updated] = await db
    .update(users)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning();

  return updated || null;
}

/**
 * 删除用户
 */
export async function deleteUser(id: string): Promise<boolean> {
  try {
    await db.delete(users).where(eq(users.id, id));
    return true;
  } catch (error) {
    console.error('删除用户失败:', error);
    return false;
  }
}


/**
 * 获取用户靠谱度详情
 */
export async function getUserReliability(userId: string) {
  const user = await getUserById(userId);
  if (!user) return null;

  const { participationCount, fulfillmentCount, disputeCount, feedbackReceivedCount } = user;
  
  // 计算靠谱度
  const reliabilityRate = participationCount > 0 
    ? Math.round((fulfillmentCount / participationCount) * 100) 
    : 100;

  // 确定等级
  let level = '新用户';
  if (participationCount > 0) {
    if (reliabilityRate >= 100) level = '非常靠谱';
    else if (reliabilityRate >= 80) level = '靠谱';
    else if (reliabilityRate >= 60) level = '一般';
    else level = '待提升';
  }

  return {
    userId,
    reliabilityRate,
    level,
    participationCount,
    fulfillmentCount,
    disputeCount,
    feedbackReceivedCount,
    recentActivities: [], // TODO: 查询最近活动记录
  };
}

/**
 * 获取用户创建的活动列表
 */
export async function getUserActivities(_userId: string, query: any) {
  // TODO: 实现查询用户创建的活动
  return {
    data: [],
    total: 0,
    page: query.page || 1,
    hasMore: false,
  };
}

/**
 * 获取用户参与的活动列表
 */
export async function getUserParticipations(_userId: string, query: any) {
  // TODO: 实现查询用户参与的活动
  return {
    data: [],
    total: 0,
    page: query.page || 1,
    hasMore: false,
  };
}

/**
 * 举报用户
 */
export async function reportUser(targetUserId: string, reporterId: string, data: any) {
  // TODO: 创建举报记录
  console.log(`User ${reporterId} reported ${targetUserId}:`, data);
  return true;
}

/**
 * 获取用户争议记录
 */
export async function getUserDisputes(_userId: string, query: any) {
  // TODO: 查询用户的争议记录
  return {
    data: [],
    total: 0,
    page: query.page || 1,
  };
}

/**
 * 申诉履约争议
 */
export async function appealDispute(userId: string, data: any) {
  // TODO: 创建申诉记录
  console.log(`User ${userId} appealed:`, data);
  return true;
}

/**
 * 管理员获取用户列表（增强版）
 */
export async function getAdminUserList(query: AdminUserQuery): Promise<AdminUserListResponse> {
  const { 
    page = 1, 
    limit = 20, 
    search, 
    membershipType, 
    isBlocked, 
    isRealNameVerified,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = query;
  
  const offset = (page - 1) * limit;

  // 构建搜索条件
  const conditions = [];
  
  if (search) {
    conditions.push(
      or(
        ilike(users.nickname, `%${search}%`),
        ilike(users.phoneNumber, `%${search}%`),
        ilike(users.wxOpenId, `%${search}%`)
      )
    );
  }
  
  if (membershipType && membershipType.length > 0) {
    conditions.push(
      or(...membershipType.map(type => eq(users.membershipType, type)))
    );
  }
  
  if (typeof isBlocked === 'boolean') {
    conditions.push(eq(users.isBlocked, isBlocked));
  }
  
  if (typeof isRealNameVerified === 'boolean') {
    conditions.push(eq(users.isRealNameVerified, isRealNameVerified));
  }

  const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

  // 构建排序
  let orderByColumn;
  switch (sortBy) {
    case 'createdAt':
      orderByColumn = users.createdAt;
      break;
    case 'lastActiveAt':
      orderByColumn = users.lastActiveAt;
      break;
    case 'participationCount':
      orderByColumn = users.participationCount;
      break;
    case 'fulfillmentCount':
      orderByColumn = users.fulfillmentCount;
      break;
    default:
      orderByColumn = users.createdAt;
  }
  const orderByFn = sortOrder === 'asc' ? asc : desc;

  const [data, totalResult] = await Promise.all([
    db
      .select()
      .from(users)
      .where(whereCondition)
      .limit(limit)
      .offset(offset)
      .orderBy(orderByFn(orderByColumn)),
    db
      .select({ count: count() })
      .from(users)
      .where(whereCondition),
  ]);

  const total = totalResult[0]?.count || 0;
  const totalPages = Math.ceil(total / limit);

  // 转换为管理员视图格式
  const adminData: AdminUserView[] = data.map(user => ({
    ...user,
    totalActivitiesCreated: user.activitiesCreatedCount,
    totalTransactionAmount: 0, // TODO: 从交易表计算
    lastActivityAt: user.lastActiveAt?.toISOString() || null,
    riskScore: calculateRiskScore(user),
    moderationStatus: user.isBlocked ? 'blocked' : 'clean',
    reliabilityRate: user.participationCount > 0 
      ? Math.round((user.fulfillmentCount / user.participationCount) * 100) 
      : 100,
  }));

  return {
    data: adminData,
    total,
    page,
    totalPages,
  };
}

/**
 * 管理员获取用户详情（增强版）
 */
export async function getAdminUserById(id: string): Promise<AdminUserView | null> {
  const user = await getUserById(id);
  if (!user) return null;

  // TODO: 查询相关统计数据
  const totalTransactionAmount = 0; // 从交易表计算
  
  return {
    ...user,
    totalActivitiesCreated: user.activitiesCreatedCount,
    totalTransactionAmount,
    lastActivityAt: user.lastActiveAt?.toISOString() || null,
    riskScore: calculateRiskScore(user),
    moderationStatus: user.isBlocked ? 'blocked' : 'clean',
    reliabilityRate: user.participationCount > 0 
      ? Math.round((user.fulfillmentCount / user.participationCount) * 100) 
      : 100,
  };
}

/**
 * 计算用户风险评分
 */
function calculateRiskScore(user: any): number {
  let score = 0;
  
  // 基于争议次数
  if (user.disputeCount > 5) score += 30;
  else if (user.disputeCount > 2) score += 15;
  
  // 基于履约率
  const reliabilityRate = user.participationCount > 0 
    ? (user.fulfillmentCount / user.participationCount) * 100 
    : 100;
  
  if (reliabilityRate < 50) score += 40;
  else if (reliabilityRate < 80) score += 20;
  
  // 基于账户状态
  if (user.isBlocked) score += 50;
  if (!user.isRealNameVerified) score += 10;
  
  return Math.min(score, 100);
}