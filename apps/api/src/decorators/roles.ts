import { SetMetadata } from '@nestjs/common';

// 定义 Metadata Key，用于反射获取
export const ROLES_KEY = 'roles';

// 定义角色类型 (可以是字符串，也可以是 Enum，建议与数据库保持一致)
export type Role = 'user' | 'admin' | 'super_admin';

/**
 * @Roles('admin') - 仅管理员可访问
 * @Roles('user', 'admin') - 用户和管理员均可访问
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);