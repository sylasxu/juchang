// Auth Service - 认证相关业务逻辑
import { db, users, eq } from '@juchang/db';
import type { WxLoginRequest } from './auth.model';

/**
 * 微信登录
 */
export async function wxLogin(params: WxLoginRequest) {
  const { code, phoneNumber, nickname, avatarUrl } = params;

  try {
    // 调用微信接口获取 openid 和 session_key
    const wxData = await getWxOpenId(code);
    
    if (!wxData.openid) {
      throw new Error('微信登录失败，请重试');
    }

    // 查找是否已存在用户
    let user = await db
      .select()
      .from(users)
      .where(eq(users.wxOpenId, wxData.openid))
      .limit(1)
      .then(rows => rows[0]);

    if (!user) {
      // 创建新用户
      const [newUser] = await db
        .insert(users)
        .values({
          wxOpenId: wxData.openid,
          phoneNumber: phoneNumber || null,
          nickname: nickname || `用户${wxData.openid.slice(-6)}`,
          avatarUrl: avatarUrl || null,
          gender: 'unknown',
          participationCount: 0,
          fulfillmentCount: 0,
          disputeCount: 0,
          activitiesCreatedCount: 0,
          membershipType: 'free',
          isRegistered: true,
          isBlocked: false,
        })
        .returning();

      user = newUser;
    } else {
      // 更新用户信息（如果提供了新信息）
      if (nickname || avatarUrl || phoneNumber) {
        const updateData: any = {};
        if (nickname) updateData.nickname = nickname;
        if (avatarUrl) updateData.avatarUrl = avatarUrl;
        if (phoneNumber) updateData.phoneNumber = phoneNumber;
        updateData.updatedAt = new Date();

        const [updatedUser] = await db
          .update(users)
          .set(updateData)
          .where(eq(users.id, user.id))
          .returning();

        user = updatedUser;
      }
    }

    return user;
  } catch (error: any) {
    console.error('微信登录失败:', error);
    throw new Error(error?.message || '登录失败');
  }
}

/**
 * 微信登录响应接口
 */
interface WxLoginResponse {
  openid?: string;
  session_key?: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

/**
 * 根据微信 code 获取 openid 和 session_key
 */
async function getWxOpenId(code: string): Promise<WxLoginResponse> {
  const WECHAT_APP_ID = process.env.WECHAT_APP_ID;
  const WECHAT_APP_SECRET = process.env.WECHAT_APP_SECRET;

  if (!WECHAT_APP_ID || !WECHAT_APP_SECRET) {
    console.warn('微信配置未设置，使用模拟数据');
    // 开发环境返回模拟数据
    return {
      openid: `wx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      session_key: 'mock_session_key'
    };
  }

  try {
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${WECHAT_APP_ID}&secret=${WECHAT_APP_SECRET}&js_code=${code}&grant_type=authorization_code`;
    
    const response = await fetch(url);
    const data: WxLoginResponse = await response.json();

    if (data.errcode) {
      throw new Error(`微信接口错误: ${data.errmsg}`);
    }

    return data;
  } catch (error) {
    console.error('调用微信接口失败:', error);
    throw new Error('微信登录验证失败');
  }
}


/**
 * 根据ID获取用户信息
 */
export async function getUserById(userId: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user || null;
}

/**
 * 更新用户信息
 */
export async function updateUserProfile(userId: string, data: any) {
  const updateData: any = {
    ...data,
    updatedAt: new Date(),
  };

  const [updated] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, userId))
    .returning();

  return updated;
}

/**
 * 完善用户信息（注册）
 * 用于微信登录后完善用户资料
 */
export async function registerUser(userId: string, data: any) {
  const { nickname, avatarUrl, gender, bio, interestTags } = data;

  const updateData: any = {
    nickname,
    isRegistered: true,
    updatedAt: new Date(),
  };

  if (avatarUrl) updateData.avatarUrl = avatarUrl;
  if (gender) updateData.gender = gender;
  if (bio) updateData.bio = bio;
  if (interestTags) updateData.interestTags = interestTags;

  const [updated] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, userId))
    .returning();

  if (!updated) {
    throw new Error('用户不存在');
  }

  return updated;
}