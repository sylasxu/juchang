import { Provider } from '@nestjs/common';
import { UserService } from '@juchang/services'; // 从 Monorepo 引入类
import { db } from '@juchang/db'; // 从 Monorepo 引入 DB 实例

export const UserServiceProvider: Provider = {
  provide: UserService,
  useFactory: () => new UserService(db),
};