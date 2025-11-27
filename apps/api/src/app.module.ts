import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';

// 基础
import { validate } from './config/env.validation';
import { GlobalModule } from './modules/global/global.module';

// 特性
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module'; // 为了注册 Strategy
import { ActivitiesModule } from './modules/activities/activities.module';

// 切面
import { AllExceptionsFilter } from './filters/http-exception.filter';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import configuration from './config/configuration';

@Module({
  imports: [
    // 1. 配置
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration], // <--- 加载 configuration.ts
      validate: validate,    // <--- 加载 env.validation.ts (Zod版)
    }),

    // 2. 基座
    GlobalModule,

    // 3. 业务
    UsersModule,
    ActivitiesModule,
    
    // 我们需要引入 AuthModule 来注册 JwtStrategy，
    // 即使还没有 AuthController，只要 AuthModule 的 providers 里有 JwtStrategy 即可
    AuthModule, 
  ],
  providers: [
    // 4. 全局切面
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}