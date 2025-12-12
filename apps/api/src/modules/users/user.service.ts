// User Service - 纯业务逻辑，无 HTTP 依赖
import { db, users, eq } from '@juchang/db';
import { count } from 'drizzle-orm';
import type { PaginationQuery, ListResponse } from './user.model';

/**
 * 获取用户列表（分页）
 */
export async function getUserList(query: PaginationQuery): Promise<ListResponse> {
  const { page = 1, limit = 20 } = query;
  const offset = (page - 1) * limit;

  const [data, totalResult] = await Promise.all([
    db
      .select()
      .from(users)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(users),
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