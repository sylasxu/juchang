// User Service - 纯业务逻辑 (MVP 简化版)
import { db, users, eq, or, ilike, count, desc } from '@juchang/db';
import type { UpdateProfileBody, QuotaResponse, UserListQuery, UserListResponse, AdminUser, UpdateUserRequest } from './user.model';

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
 * 更新用户资料 (MVP 简化版)
 * 只支持更新 nickname 和 avatarUrl
 */
export async function updateProfile(id: string, data: UpdateProfileBody) {
  const updateData: Record<string, any> = {
    updatedAt: new Date(),
  };

  if (data.nickname !== undefined) {
    updateData.nickname = data.nickname;
  }
  if (data.avatarUrl !== undefined) {
    updateData.avatarUrl = data.avatarUrl;
  }

  const [updated] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, id))
    .returning();

  return updated || null;
}

/**
 * 获取用户今日额度
 */
export async function getQuota(id: string): Promise<QuotaResponse | null> {
  const user = await getUserById(id);
  if (!user) return null;

  // 检查是否需要重置额度（跨天重置）
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  let aiCreateQuota = user.aiCreateQuotaToday;
  let resetAt = user.aiQuotaResetAt?.toISOString() || null;

  // 如果上次重置时间不是今天，重置额度
  if (!user.aiQuotaResetAt || user.aiQuotaResetAt < today) {
    aiCreateQuota = 3; // 默认每日 3 次
    resetAt = today.toISOString();
    
    // 更新数据库
    await db
      .update(users)
      .set({
        aiCreateQuotaToday: 3,
        aiQuotaResetAt: today,
        updatedAt: now,
      })
      .where(eq(users.id, id));
  }

  return {
    aiCreateQuota,
    resetAt,
  };
}

/**
 * 扣减 AI 创建额度
 * 返回 true 表示扣减成功，false 表示额度不足
 */
export async function deductAiCreateQuota(id: string): Promise<boolean> {
  const quota = await getQuota(id);
  if (!quota || quota.aiCreateQuota <= 0) {
    return false;
  }

  await db
    .update(users)
    .set({
      aiCreateQuotaToday: quota.aiCreateQuota - 1,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id));

  return true;
}


// ============ Admin Service Functions ============

/**
 * 获取用户列表 (Admin)
 * Requirements: 1.1, 1.2, 1.3, 1.5
 */
export async function getUserList(query: UserListQuery): Promise<UserListResponse> {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const offset = (page - 1) * limit;

  // 构建查询条件
  let whereCondition = undefined;
  if (query.search) {
    const searchPattern = `%${query.search}%`;
    whereCondition = or(
      ilike(users.nickname, searchPattern),
      ilike(users.phoneNumber, searchPattern)
    );
  }

  try {
    // 查询用户列表 (排除 wxOpenId) - 使用数据库实际存在的字段
    const userList = await db
      .select()
      .from(users)
      .where(whereCondition)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    // 查询总数
    const [totalResult] = await db
      .select({ total: count() })
      .from(users)
      .where(whereCondition);

    // 排除敏感字段 wxOpenId
    const sanitizedList = userList.map(({ wxOpenId, ...rest }) => rest);

    return {
      data: sanitizedList as AdminUser[],
      total: totalResult?.total ?? 0,
      page,
      limit,
    };
  } catch (error) {
    console.error('getUserList error:', error);
    throw error;
  }
}

/**
 * 根据 ID 获取用户详情 (Admin, 排除敏感字段)
 * Requirements: 2.1, 2.3
 */
export async function getAdminUserById(id: string): Promise<AdminUser | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!user) return null;

  // 排除敏感字段 wxOpenId
  const { wxOpenId, ...sanitizedUser } = user;
  return sanitizedUser as AdminUser;
}

/**
 * Admin 更新用户信息
 * Requirements: 3.1, 3.3
 */
export async function adminUpdateUser(id: string, data: UpdateUserRequest): Promise<AdminUser | null> {
  // 检查用户是否存在
  const existingUser = await getUserById(id);
  if (!existingUser) {
    return null;
  }

  const updateData: Record<string, any> = {
    updatedAt: new Date(),
  };

  // 只允许更新 nickname 和 avatarUrl
  if (data.nickname !== undefined) {
    updateData.nickname = data.nickname;
  }
  if (data.avatarUrl !== undefined) {
    updateData.avatarUrl = data.avatarUrl;
  }

  await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, id));

  // 返回更新后的用户 (排除敏感字段)
  return getAdminUserById(id);
}
