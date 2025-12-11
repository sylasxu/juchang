// Auth Service - 认证业务逻辑
import { db, users, userAuths, eq, and } from '@juchang/db';
import type { LoginRequest } from './auth.model';

/**
 * 验证用户登录
 * TODO: 实际项目中应该使用 bcrypt 等库进行密码哈希验证
 */
export async function validateUser(phoneNumber: string, password: string) {
  // 查询用户信息
  const [user] = await db
    .select({
      id: users.id,
      phoneNumber: users.phoneNumber,
      nickname: users.nickname,
      membershipType: users.membershipType,
      isBlocked: users.isBlocked,
    })
    .from(users)
    .where(eq(users.phoneNumber, phoneNumber))
    .limit(1);

  if (!user) {
    return null;
  }

  // 检查用户状态
  if (user.isBlocked) {
    throw new Error('用户已被封禁');
  }

  // 查询认证信息
  const [auth] = await db
    .select()
    .from(userAuths)
    .where(and(
      eq(userAuths.userId, user.id),
      eq(userAuths.provider, 'phone_sms')
    ))
    .limit(1);

  if (!auth) {
    return null;
  }

  // TODO: 实际项目中应该使用 bcrypt.compare(password, auth.passwordHash)
  // 这里为了演示，直接比较明文（生产环境绝对不能这样做）
  if (auth.passwordHash !== password) {
    return null;
  }

  return user;
}

/**
 * 微信小程序登录
 * TODO: 集成微信小程序登录逻辑
 */
export async function loginWithWechat(code: string) {
  // TODO: 调用微信 API 获取 openid
  // TODO: 查询或创建用户
  // TODO: 返回用户信息
  throw new Error('微信登录功能待实现');
}