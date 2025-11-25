import { Controller, Post, Body, Ip, UsePipes } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WechatService, UserService } from '@juchang/services'; // 直接注入业务逻辑
import { ZodValidationPipe } from '../../pipes/zod-validation.pipe'; // 自定义管道
import { Public } from '../../decorators/public'; // 自定义装饰器
import { type WechatLoginDto, WechatLoginSchema } from './dto/wechat-login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly wechatService: WechatService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 微信小程序一键登录
   * POST /api/auth/login
   */
  @Public() // 登录接口必须公开，跳过 JWT 检查
  @Post('login')
  @UsePipes(new ZodValidationPipe(WechatLoginSchema)) // 显式启用 Zod 校验
  async login(@Body() dto: WechatLoginDto, @Ip() ip: string) {
    // 1. 调用微信服务：Code -> Session
    // WechatService 内部已经处理了微信 API 错误，这里无需 try-catch，让 GlobalFilter 兜底即可
    const wxSession = await this.wechatService.code2Session(dto.code);

    // 2. 调用用户服务：注册或更新登录态
    // 原子操作，返回最新的 User 对象
    const user = await this.userService.loginOrCreateByWechat(
      wxSession.openId,
      wxSession.sessionKey,
      ip
    );

    // 3. 签发 JWT Token
    // payload 包含 sub (ID) 和 role (角色)，供 Guard 使用
    const payload = { 
      sub: user.id, 
      role: 'user' // 默认为 user，如果是管理员可以从 user 数据库字段取
    };
    
    const accessToken = this.jwtService.sign(payload);

    // 4. 返回结果
    // TransformInterceptor 会将其包装为 { code: 0, data: { ... } }
    return {
      accessToken,
      user: {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatarUrl,
        isRegistered: user.isRegistered, // 前端判断是否需要跳去"完善资料"页
      },
    };
  }
}