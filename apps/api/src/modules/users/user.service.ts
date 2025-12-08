// User Service - 纯业务逻辑，无 HTTP 依赖
import { db, users, eq } from '@juchang/db';
import type { UserModel } from './user.model';

/**
 * 获取用户列表（分页）
 */
export async function getUserList(query: UserModel.paginationQuery) {
  const { page = 1, limit = 20 } = query;
  const offset = (page - 1) * limit;

  const [data, totalResult] = await Promise.all([
    db
      .select()
      .from(users)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: users.id })
      .from(users)
      .then((result) => result.length),
  ]);

  const total = totalResult;
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    total,
    page,
    totalPages,
  } satisfies UserModel.listResponse;
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

