import { z } from 'zod';

// 手搓 Zod Schema：用于验证微信 API 的返回数据 (Data in Transit)
// 微信文档：https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/user-login/code2Session.html
const WxSessionResponseSchema = z.object({
  openid: z.string(),
  session_key: z.string(),
  unionid: z.string().optional(),
  errcode: z.number().optional(),
  errmsg: z.string().optional(),
});

export class WechatService {
  constructor(private appId: string, private appSecret: string) {}

  /**
   * 用 Code 换取 SessionKey 和 OpenId
   */
  async code2Session(code: string) {
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${this.appId}&secret=${this.appSecret}&js_code=${code}&grant_type=authorization_code`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      // 使用 Zod 验证结构，防止微信接口变动导致服务崩溃
      const result = WxSessionResponseSchema.parse(data);

      if (result.errcode && result.errcode !== 0) {
        throw new Error(`WeChat API Error [${result.errcode}]: ${result.errmsg}`);
      }

      return {
        openId: result.openid,
        sessionKey: result.session_key,
        unionId: result.unionid
      };
    } catch (error) {
      // 这里可以接入日志系统
      console.error('WechatService code2Session failed:', error);
      throw error;
    }
  }
}