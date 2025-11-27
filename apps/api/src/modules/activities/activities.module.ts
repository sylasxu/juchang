import { Module } from '@nestjs/common';
import { ActivitiesController } from './activities.controller';
// ActivityService 由 GlobalModule 提供，无需在此导入

@Module({
  controllers: [ActivitiesController],
})
export class ActivitiesModule {}

