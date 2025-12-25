// Auth Service - 认证相关业务逻辑 (MVP 简化版)
import { db, users, eq } from '@juchang/db';
import type { WxLoginRequest, BindPhoneRequest } from './auth.model';

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
 * 微信手机号响应接口
 */
interface WxPhoneResponse {
  phone_info?: {
    phoneNumber: string;
    purePhoneNumber: string;
    countryCode: string;
  };
  errcode?: number;
  errmsg?: string;
}

/**
 * 微信登录 (MVP 简化版)
 * - 移除复杂的会员逻辑
 * - 只创建基础用户信息
 */
export async function wxLogin(params: WxLoginRequest) {
  const { code } = params;

  try {
    // 调用微信接口获取 openid
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

    let isNewUser = false;

    if (!user) {
      // 创建新用户 (MVP 简化字段)
      isNewUser = true;
      const [newUser] = await db
        .insert(users)
        .values({
          wxOpenId: wxData.openid,
          nickname: null, // 延迟完善
          avatarUrl: null, // 延迟完善
          phoneNumber: null, // 延迟绑定
          aiCreateQuotaToday: 3,
          activitiesCreatedCount: 0,
          participationCount: 0,
        })
        .returning();

      user = newUser;
    }

    return { user, isNewUser };
  } catch (error: any) {
    console.error('微信登录失败:', error);
    throw new Error(error?.message || '登录失败');
  }
}

/**
 * 绑定手机号 (延迟验证)
 * 使用 getPhoneNumber 返回的 code 获取手机号
 */
export async function bindPhone(userId: string, params: BindPhoneRequest) {
  const { code } = params;

  try {
    // 调用微信接口获取手机号
    const phoneData = await getWxPhoneNumber(code);
    
    if (!phoneData.phone_info?.phoneNumber) {
      throw new Error('获取手机号失败，请重试');
    }

    const phoneNumber = phoneData.phone_info.phoneNumber;

    // 更新用户手机号
    const [updated] = await db
      .update(users)
      .set({
        phoneNumber,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updated) {
      throw new Error('用户不存在');
    }

    return {
      success: true,
      phoneNumber,
    };
  } catch (error: any) {
    console.error('绑定手机号失败:', error);
    throw new Error(error?.message || '绑定手机号失败');
  }
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
 * 根据 code 获取微信手机号
 */
async function getWxPhoneNumber(code: string): Promise<WxPhoneResponse> {
  const WECHAT_APP_ID = process.env.WECHAT_APP_ID;
  const WECHAT_APP_SECRET = process.env.WECHAT_APP_SECRET;

  if (!WECHAT_APP_ID || !WECHAT_APP_SECRET) {
    console.warn('微信配置未设置，使用模拟数据');
    // 开发环境返回模拟数据
    return {
      phone_info: {
        phoneNumber: '13800138000',
        purePhoneNumber: '13800138000',
        countryCode: '86',
      }
    };
  }

  try {
    // 先获取 access_token
    const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${WECHAT_APP_ID}&secret=${WECHAT_APP_SECRET}`;
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      throw new Error('获取 access_token 失败');
    }

    // 获取手机号
    const phoneUrl = `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${tokenData.access_token}`;
    const phoneRes = await fetch(phoneUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const phoneData: WxPhoneResponse = await phoneRes.json();

    if (phoneData.errcode) {
      throw new Error(`微信接口错误: ${phoneData.errmsg}`);
    }

    return phoneData;
  } catch (error) {
    console.error('获取微信手机号失败:', error);
    throw new Error('获取手机号失败');
  }
}
