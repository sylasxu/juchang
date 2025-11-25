import { Controller, Get } from '@nestjs/common';
import { UserService } from '@juchang/services'; // 直接引入类型
import { CurrentUser } from '../../decorators/current-user';

@Controller('users')
export class UsersController {
  // 优雅时刻：自动注入，无需在 Module imports 写 GlobalModule
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async getProfile(@CurrentUser('id') userId: string) {
    // 调用 Monorepo 的业务逻辑
    const user = await this.userService.findById(userId);
    return user; 
    // 返回后会被 TransformInterceptor 包装成 { code: 0, data: user ... }
  }
}