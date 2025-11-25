import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';

@Module({
  controllers: [UsersController],
  // 不需要 providers: [UserService]，因为它是 Global 的
})
export class UsersModule {}