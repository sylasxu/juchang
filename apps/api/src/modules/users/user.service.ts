// User Service - 纯业务逻辑，无 HTTP 依赖
import { db, users, eq, count, or, ilike } from '@juchang/db';
import type { PaginationQuery, ListResponse, UpdateUserBody } from './user.model';

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
    const result = await db
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
    const result = await db
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
export async function getUserActivities(userId: string, query: any) {
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
export async function getUserParticipations(userId: string, query: any) {
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
export async function getUserDisputes(userId: string, query: any) {
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