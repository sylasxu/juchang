import { db, users, userAuths } from '@juchang/db'; // 假设这是你 db 包的导出
import { eq, and } from 'drizzle-orm';

export class UserService {
  constructor(private readonly database = db) {}

  /**
   * 核心逻辑：登录或注册 (Login or Register)
   * 原子操作：同时处理 users 和 user_auths 表
   */
  async loginOrCreateByWechat(
    openId: string, 
    sessionKey: string, 
    clientIp?: string
  ) {
    return await this.database.transaction(async (tx) => {
      // 1. 在 user_auths 表中查找凭证
      // 逻辑：通过 (类型 + 唯一标识) 查找
      const existingAuth = await tx.query.userAuths.findFirst({
        where: and(
          eq(userAuths.identityType, 'wechat_miniprogram'),
          eq(userAuths.identifier, openId)
        ),
        with: {
          user: true, // 连带查出 User 信息
        }
      });

      if (existingAuth) {
        // --- 场景 A：老用户登录 ---
        // 1.1 更新凭证信息 (SessionKey 会变，IP 会变)
        await tx.update(userAuths)
          .set({
            credential: sessionKey, // 更新 session_key
            lastLoginAt: new Date(),
            lastLoginIp: clientIp,
          })
          .where(eq(userAuths.id, existingAuth.id));

        // 1.2 更新用户活跃状态 (LBS 依赖)
        await tx.update(users)
          .set({ lastActiveAt: new Date() })
          .where(eq(users.id, existingAuth.userId));

        return existingAuth.user;
      } else {
        // --- 场景 B：新用户注册 ---
        // 2.1 创建基础用户画像
        const [newUser] = await tx.insert(users).values({
          wxOpenId: openId, // 冗余一份用于快速索引
          nickname: `用户${openId.slice(-4)}`, // 默认昵称
          gender: 'unknown',
          isRegistered: false, // 标记为未完成冷启动
        }).returning();

        // 2.2 创建登录凭证
        await tx.insert(userAuths).values({
          userId: newUser.id,
          identityType: 'wechat_miniprogram', // 枚举值
          identifier: openId,
          credential: sessionKey,
          lastLoginIp: clientIp,
        });

        return newUser;
      }
    });
  }

  /**
   * 根据 ID 查找用户 (用于 JWT Strategy)
   */
  async findById(userId: string) {
    return this.database.query.users.findFirst({
      where: eq(users.id, userId),
    });
  }
}