import { db, users, type NewUser } from '@juchang/db';
import { eq } from 'drizzle-orm';
import { desc, count } from 'drizzle-orm';
import type { PaginationDto } from '../common/pagination';

class UserService {
  // 1. Create
  async create(data: NewUser) {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  // 2. Read (List with Pagination)
  async list(params: PaginationDto) {
    const { page, limit } = params;
    const offset = (page - 1) * limit;

    // 并行查询：数据 + 总数
    const [data, [totalRecord]] = await Promise.all([
      db.select()
        .from(users)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(users.createdAt)),
      db.select({ count: count() }).from(users),
    ]);

    return {
      data,
      total: totalRecord?.count || 0,
      page,
      limit,
      totalPages: Math.ceil((totalRecord?.count || 0) / limit),
    };
  }

  // 2.1 Read (Get One)
  async getById(id: string) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null;
  }

  // 3. Update
  async update(id: string, data: Partial<NewUser>) {
    const [updatedUser] = await db.update(users)
      .set({ ...data, updatedAt: new Date() }) // 假设表里有 updatedAt
      .where(eq(users.id, id))
      .returning();
    return updatedUser || null;
  }

  // 4. Delete
  async delete(id: string) {
    const [deletedUser] = await db.delete(users)
      .where(eq(users.id, id))
      .returning();
    return deletedUser || null;
  }
}

export const userService = new UserService();