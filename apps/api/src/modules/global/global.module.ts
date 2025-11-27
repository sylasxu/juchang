import { Global, Module } from '@nestjs/common';
import { UserServiceProvider } from './factories/users.factory';
import { ActivityServiceProvider } from './factories/activities.factory';

// 注册所有从 packages/services 引入的服务
const providers = [
  UserServiceProvider,
  ActivityServiceProvider,
  // WechatServiceProvider,
  // ...
];

@Global()
@Module({
  providers: providers,
  exports: providers, // 必须导出，UsersModule 才能用
})
export class GlobalModule {}