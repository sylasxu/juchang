import { Global, Module } from '@nestjs/common';
import { UserServiceProvider } from './factories/users.factory';

// 暂时只注册 UserService，后续有其他的再加
const providers = [
  UserServiceProvider, 
  // WechatServiceProvider, 
  // ... 
];

@Global()
@Module({
  providers: providers,
  exports: providers, // 必须导出，UsersModule 才能用
})
export class GlobalModule {}