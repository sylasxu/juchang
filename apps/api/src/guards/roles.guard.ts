import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, Role } from '../decorators/roles';
import { IS_PUBLIC_KEY } from '../decorators/public';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. 获取路由上的角色元数据
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 2. 如果路由没有标记 @Roles，或者是 @Public 的，则放行
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles || isPublic) {
      return true;
    }

    // 3. 获取用户信息 (由 JwtAuthGuard 解析 Token 后注入 request)
    const { user } = context.switchToHttp().getRequest();

    // 4. 强校验：如果此时没有 user 对象，说明 JWT 校验失败或逻辑错误
    if (!user) {
      return false;
    }

    // 5. 核心逻辑：检查用户角色是否在允许列表中
    // 假设 user.role 是单值字符串。如果是数组则用 .some()
    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException('权限不足');
    }

    return true;
  }
}