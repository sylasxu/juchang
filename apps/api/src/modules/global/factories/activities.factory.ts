import { Provider } from '@nestjs/common';
import { ActivityService } from '@juchang/services'; // 从 Monorepo 引入类
import { db } from '@juchang/db'; // 从 Monorepo 引入 DB 实例

export const ActivityServiceProvider: Provider = {
  provide: ActivityService,
  useFactory: () => new ActivityService(db),
};

