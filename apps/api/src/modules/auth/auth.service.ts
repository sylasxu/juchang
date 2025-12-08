// Auth Service - 纯业务逻辑，无 HTTP 依赖
import { db, users, userAuths, eq, and } from '@juchang/db';

/**
 * 验证用户登录
 * @param phoneNumber 手机号
 * @param password 密码（实际应该用 bcrypt 比较 hash）
 * @returns 用户信息或 null
 */
export async function validateUser(phoneNumber: string, password: string) {
  // 查找用户
  const user = await db.query.users.findFirst({
    where: eq(users.phoneNumber, phoneNumber),
  });

  if (!user) {
    return null;
  }

  // 查找认证信息（通过 userAuths 表）
  const auth = await db.query.userAuths.findFirst({
    where: and(
      eq(userAuths.userId, user.id),
      eq(userAuths.identityType, 'phone')
    ),
  });

  if (!auth) {
    return null;
  }

  // TODO: 实际应该用 bcrypt.compare 比较 password 和 auth.credential
  // 这里暂时简化处理
  // const isValid = await bcrypt.compare(password, auth.credential || '');
  // if (!isValid) return null;

  return user;
}

