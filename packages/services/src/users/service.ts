import { db, users, eq, and, sql } from '@juchang/db';
import { 
  createUserSchema,
  updateUserSchema,
  type User,
} from './validation';
import type { User } from '@juchang/db';

export class UserService {
  /**
   * 创建用户
   */
  async createUser(data: CreateUserInput): Promise<User> {
    // 验证输入数据
    const validatedData = createUserSchema.parse(data);
    
    // 检查用户是否已存在
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.openid, validatedData.openid))
      .limit(1);
    
    if (existingUser.length > 0) {
      throw new Error('用户已存在');
    }
    
    // 创建用户
    const result = await db
      .insert(users)
      .values(validatedData)
      .returning();
    
    return result[0];
  }

  /**
   * 根据ID获取用户
   */
  async getUserById(id: string): Promise<User | null> {
    // 验证ID格式
    const validatedId = userIdSchema.parse({ id });
    
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, validatedId.id))
      .limit(1);
    
    return result[0] || null;
  }

  /**
   * 根据OpenID获取用户
   */
  async getUserByOpenId(openid: string): Promise<User | null> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.openid, openid))
      .limit(1);
    
    return result[0] || null;
  }

  /**
   * 根据手机号获取用户
   */
  async getUserByPhone(phone: string): Promise<User | null> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.phone, phone))
      .limit(1);
    
    return result[0] || null;
  }

  /**
   * 更新用户
   */
  async updateUser(id: string, data: UpdateUserInput): Promise<User> {
    // 验证输入数据
    const validatedData = updateUserSchema.parse(data);
    
    // 更新用户
    const result = await db
      .update(users)
      .set({ ...validatedData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error('用户不存在');
    }
    
    return result[0];
  }

  /**
   * 删除用户（软删除）
   */
  async deleteUser(id: string): Promise<boolean> {
    // 验证ID格式
    const { id: validId } = userIdSchema.parse({ id });
    
    // 这里可以实现软删除，更新状态而不是真正删除
    const [deletedUser] = await db.update(users)
      .set({ 
        updatedAt: new Date() 
      })
      .where(eq(users.id, validId))
      .returning();

    return !!deletedUser;
  }

  /**
   * 查询用户列表
   */
  async queryUsers(query: QueryUserInput): Promise<{ users: User[]; total: number }> {
    // 验证查询参数
    const validatedQuery = userQuerySchema.parse(query);
    
    const { page = 1, pageSize = 20, ...filters } = validatedQuery;
    const offset = (page - 1) * pageSize;
    
    // 构建查询条件
    const conditions = [];
    
    if (filters.id) {
      conditions.push(eq(users.id, filters.id));
    }
    
    if (filters.openid) {
      conditions.push(eq(users.openid, filters.openid));
    }
    
    if (filters.phone) {
      conditions.push(eq(users.phone, filters.phone));
    }
    
    // 构建 where 条件
    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;
    
    // 查询总数
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(whereCondition);
    
    const total = Number(countResult[0]?.count || 0);
    
    // 查询用户列表
    const userList = await db
      .select()
      .from(users)
      .where(whereCondition)
      .limit(pageSize)
      .offset(offset)
      .orderBy(sql`${users.createdAt} DESC`);
    
    return { users: userList, total };
  }

  /**
   * 获取附近的用户
   */
  async getNearbyUsers(locationData: LocationQueryInput): Promise<User[]> {
    // 验证位置参数
    const validatedLocation = locationQuerySchema.parse(locationData);
    
    const { latitude, longitude, radius, limit } = validatedLocation;

    // 使用PostGIS进行地理查询
    const nearbyUsers = await db.select()
      .from(users)
      .where(
        sql`ST_DWithin(
          ST_Transform(${users.location}, 3857),
          ST_Transform(ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326), 3857),
          ${radius}
        )`
      )
      .limit(limit)
      .orderBy(sql`ST_DistanceSphere(${users.location}, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326))`);

    return nearbyUsers;
  }

  /**
   * 更新用户信用分
   */
  async updateCreditScore(id: string, scoreChange: number, reason?: string): Promise<User> {
    // 验证ID格式
    const { id: validId } = userIdSchema.parse({ id });
    
    // 确保信用分在0-100范围内
    const [updatedUser] = await db.update(users)
      .set({ 
        creditScore: sql`GREATEST(0, LEAST(100, ${users.creditScore} + ${scoreChange}))`,
        updatedAt: new Date()
      })
      .where(eq(users.id, validId))
      .returning();

    if (!updatedUser) {
      throw new Error('User not found');
    }

    return updatedUser;
  }

  /**
   * 检查用户是否存在
   */
  async exists(id: string): Promise<boolean> {
    try {
      const { id: validId } = userIdSchema.parse({ id });
      const [user] = await db.select({ id: users.id })
        .from(users)
        .where(eq(users.id, validId))
        .limit(1);
      
      return !!user;
    } catch {
      return false;
    }
  }

  /**
   * 批量获取用户
   */
  async getUsersByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) {
      return [];
    }

    // 验证所有ID格式
    const validIds = ids.map(id => {
      const { id: validId } = userIdSchema.parse({ id });
      return validId;
    });

    const userList = await db.select()
      .from(users)
      .where(sql`${users.id} IN ${validIds}`);

    return userList;
  }

  /**
   * 根据地理位置查询附近用户
   */
  async queryNearbyUsers(location: LocationQueryInput): Promise<User[]> {
    // 验证位置参数
    const validatedLocation = locationQuerySchema.parse(location);
    
    const { latitude, longitude, radius = 3000, limit = 20 } = validatedLocation;
    
    // 使用 PostgreSQL 的地理空间函数查询附近用户
    // 这里使用简单的距离计算，实际项目中可以考虑使用 PostGIS
    const nearbyUsers = await db
      .select()
      .from(users)
      .where(
        sql`ST_DWithin(
          ST_MakePoint(${longitude}, ${latitude})::geography,
          ST_MakePoint(
            (${users.location}::jsonb->>'longitude')::float,
            (${users.location}::jsonb->>'latitude')::float
          )::geography,
          ${radius}
        )`
      )
      .limit(limit)
      .orderBy(sql`ST_Distance(
        ST_MakePoint(${longitude}, ${latitude})::geography,
        ST_MakePoint(
          (${users.location}::jsonb->>'longitude')::float,
          (${users.location}::jsonb->>'latitude')::float
        )::geography
      )`);
    
    return nearbyUsers;
  }
}

// 导出单例实例
export const userService = new UserService();
