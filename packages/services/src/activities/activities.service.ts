import { db, activities, participants, users } from '@juchang/db';
import { eq, and, sql, desc } from 'drizzle-orm';

// 定义创建活动的输入类型 (纯数据结构)
export type CreateActivityPayload = {
  creatorId: string;
  title: string;
  description?: string;
  type: 'sports' | 'food' | 'entertainment' | 'culture' | 'travel' | 'study';
  startAt: Date;
  location: { lat: number; lng: number; name?: string; address?: string };
  maxParticipants: number;
  feeType?: 'free' | 'aa' | 'treat'; // 费用类型：仅作信息展示，用户需在线下自行结算
  estimatedCost?: number; // 预估费用（仅信息展示，单位：元），不涉及交易
  joinMode?: 'instant' | 'approval'; // 加入模式：instant=即时加入，approval=需要审核
  riskScore?: number; // 风险分：0-100分，系统自动计算，>60分为高风险
};

export class ActivityService {
  constructor(private readonly database = db) {}

  /**
   * [AI-Ready] 创建活动
   * P2P模式：创建者即第一个参与者，无特殊权限
   */
  async create(payload: CreateActivityPayload) {
    return await this.database.transaction(async (tx) => {
      // 1. 创建活动
      const [activity] = await tx.insert(activities).values({
        creatorId: payload.creatorId,
        title: payload.title,
        description: payload.description,
        type: payload.type,
        startAt: payload.startAt,
        // PostGIS 插入格式：ST_Point(lng, lat)
        location: { x: payload.location.lng, y: payload.location.lat },
        locationName: payload.location.name,
        address: payload.location.address,
        maxParticipants: payload.maxParticipants,
        feeType: payload.feeType || 'free',
        estimatedCost: payload.estimatedCost || 0,
        joinMode: payload.joinMode || 'instant',
        riskScore: payload.riskScore || 0,
        riskLevel: payload.riskScore && payload.riskScore > 60 ? 'high' : payload.riskScore && payload.riskScore > 30 ? 'medium' : 'low',
      }).returning();

      // 2. 创建者自动成为第一个参与者（状态为 approved）
      await tx.insert(participants).values({
        activityId: activity.id,
        userId: payload.creatorId,
        status: 'approved',
        applicationMsg: null,
      });

      return activity;
    });
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
        creator: {
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
   * 申请加入活动 (P2P模式：支持即时加入和审核模式)
   * @param activityId 活动ID
   * @param userId 用户ID
   * @param applicationMsg 申请理由（仅当 joinMode=approval 时使用）
   */
  async join(activityId: string, userId: string, applicationMsg?: string) {
    return await this.database.transaction(async (tx) => {
      // 1. 检查活动是否存在 & 是否满员 & 是否自己创建的
      const activity = await tx.query.activities.findFirst({
        where: eq(activities.id, activityId),
        with: { participants: true }
      });

      if (!activity) throw new Error('活动不存在');
      if (activity.creatorId === userId) throw new Error('不能报名自己创建的活动');
      
      // 计算已批准的人数
      const approvedCount = activity.participants.filter(p => p.status === 'approved').length;
      if (approvedCount >= activity.maxParticipants) throw new Error('活动已满员');

      // 2. 检查是否重复报名
      const existing = await tx.query.participants.findFirst({
        where: and(
          eq(participants.activityId, activityId),
          eq(participants.userId, userId)
        )
      });
      if (existing) {
        if (existing.status === 'approved') throw new Error('您已成功加入该活动');
        if (existing.status === 'pending') throw new Error('您的申请正在审核中，请勿重复提交');
        if (existing.status === 'rejected') throw new Error('您的申请已被拒绝');
      }

      // 3. 根据 joinMode 决定状态
      const status = activity.joinMode === 'instant' ? 'approved' : 'pending';

      // 4. 插入报名记录
      const [participant] = await tx.insert(participants).values({
        activityId,
        userId,
        applicationMsg: applicationMsg || null,
        status,
      }).returning();

      return participant;
    });
  }

  /**
   * 创建者审核申请（仅当 joinMode=approval 时使用）
   * @param activityId 活动ID
   * @param participantId 参与者ID
   * @param creatorId 创建者ID（用于权限校验）
   * @param action 'approve' | 'reject'
   */
  async reviewApplication(
    activityId: string,
    participantId: string,
    creatorId: string,
    action: 'approve' | 'reject'
  ) {
    return await this.database.transaction(async (tx) => {
      // 1. 验证创建者身份
      const activity = await tx.query.activities.findFirst({
        where: eq(activities.id, activityId),
      });

      if (!activity) throw new Error('活动不存在');
      if (activity.creatorId !== creatorId) throw new Error('只有创建者可以审核申请');

      // 2. 检查参与者记录
      const participant = await tx.query.participants.findFirst({
        where: and(
          eq(participants.id, participantId),
          eq(participants.activityId, activityId)
        ),
      });

      if (!participant) throw new Error('申请记录不存在');
      if (participant.status !== 'pending') throw new Error('该申请已被处理');

      // 3. 如果是批准，检查是否满员
      if (action === 'approve') {
        const activityWithParticipants = await tx.query.activities.findFirst({
          where: eq(activities.id, activityId),
          with: { participants: true },
        });
        const approvedCount = activityWithParticipants!.participants.filter(
          p => p.status === 'approved'
        ).length;
        if (approvedCount >= activity.maxParticipants) {
          throw new Error('活动已满员，无法批准更多申请');
        }
      }

      // 4. 更新状态
      const [updated] = await tx
        .update(participants)
        .set({
          status: action === 'approve' ? 'approved' : 'rejected',
          updatedAt: new Date(),
        })
        .where(eq(participants.id, participantId))
        .returning();

      return updated;
    });
  }
}