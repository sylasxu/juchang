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