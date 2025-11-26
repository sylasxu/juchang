import { db, activities, participants, users } from '@juchang/db';
import { eq, and, sql, desc } from 'drizzle-orm';

// 定义创建活动的输入类型 (纯数据结构)
export type CreateActivityPayload = {
  hostId: string;
  title: string;
  description?: string;
  type: 'sports' | 'food' | 'entertainment' | 'culture' | 'travel' | 'study';
  startAt: Date;
  location: { lat: number; lng: number; name: string; address: string };
  maxParticipants: number;
  price?: number;
};

export class ActivityService {
  constructor(private readonly database = db) {}

  /**
   * [AI-Ready] 创建活动
   * 未来 AI Agent 可以构建 Payload 直接调用此方法
   */
  async create(payload: CreateActivityPayload) {
    return await this.database.insert(activities).values({
      hostId: payload.hostId,
      title: payload.title,
      description: payload.description,
      type: payload.type,
      startAt: payload.startAt,
      // PostGIS 插入格式：ST_Point(lng, lat)
      location: { x: payload.location.lng, y: payload.location.lat }, 
      locationName: payload.location.name,
      address: payload.location.address,
      maxParticipants: payload.maxParticipants,
      price: payload.price || 0,
    }).returning();
  }

  /**
   * [LBS Core] 查找附近活动
   * @param radiusKm 搜索半径 (默认 5km)
   */
  async findNearby(lat: number, lng: number, radiusKm: number = 5, type?: string) {
    // PostGIS SQL 魔法：ST_DWithin + ST_Distance
    // 注意：4326 坐标系下 ST_DWithin 的单位是度，需要转换，
    // 或者使用 geography 类型 (更精确)。这里演示简单投影转换逻辑。
    
    const conditions = [
      // 筛选 1: 状态必须是 active
      eq(activities.status, 'published'),
      // 筛选 2: 只有未来的活动
      sql`${activities.startAt} > NOW()`
    ];

    if (type) {
      conditions.push(eq(activities.type, type as any));
    }

    // 核心 LBS 查询
    return await this.database.query.activities.findMany({
      where: and(
        ...conditions,
        // 这里使用简单的球体距离计算 (ST_DistanceSphere)
        sql`ST_DistanceSphere(
          geometry(${activities.location}), 
          ST_MakePoint(${lng}, ${lat})
        ) <= ${radiusKm * 1000}`
      ),
      limit: 20,
      with: {
        host: {
          columns: { id: true, nickname: true, avatarUrl: true, creditScore: true }
        },
        participants: true // 可以计算当前人数
      },
      // 按距离排序
      orderBy: sql`ST_DistanceSphere(
        geometry(${activities.location}), 
        ST_MakePoint(${lng}, ${lat})
      ) ASC`
    });
  }

  /**
   * 申请加入活动 (带事务)
   */
  async join(activityId: string, userId: string, message?: string) {
    return await this.database.transaction(async (tx) => {
      // 1. 检查活动是否存在 & 是否满员 & 是否自己发的
      const activity = await tx.query.activities.findFirst({
        where: eq(activities.id, activityId),
        with: { participants: true }
      });

      if (!activity) throw new Error('活动不存在');
      if (activity.hostId === userId) throw new Error('不能报名自己的活动');
      if (activity.participants.length >= activity.maxParticipants) throw new Error('活动已满员');

      // 2. 检查是否重复报名
      const existing = await tx.query.participants.findFirst({
        where: and(
          eq(participants.activityId, activityId),
          eq(participants.userId, userId)
        )
      });
      if (existing) throw new Error('无需重复报名');

      // 3. 插入报名记录
      const [participant] = await tx.insert(participants).values({
        activityId,
        userId,
        message,
        status: 'pending' // 默认需要审核
      }).returning();

      return participant;
    });
  }
}