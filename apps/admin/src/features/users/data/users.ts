// 用户数据 API 调用
import { api } from '@/lib/eden'
import type { User, UserListResponse, AdminUser, AdminUserListResponse } from './schema'

export interface UserQueryParams {
  page?: number
  limit?: number
  search?: string
}

export interface AdminUserQueryParams extends UserQueryParams {
  membershipType?: ('free' | 'pro')[]
  isBlocked?: boolean
  isRealNameVerified?: boolean
  sortBy?: 'createdAt' | 'lastActiveAt' | 'participationCount' | 'fulfillmentCount'
  sortOrder?: 'asc' | 'desc'
}

/**
 * 获取用户列表
 */
export async function fetchUsers(params: UserQueryParams = {}): Promise<UserListResponse> {
  const { data, error } = await api.users.get({
    query: {
      page: params.page || 1,
      limit: params.limit || 20,
      search: params.search,
    },
  })

  if (error) {
    throw new Error('获取用户列表失败')
  }

  return data as UserListResponse
}

/**
 * 管理员获取用户列表（增强版）
 */
export async function fetchAdminUsers(params: AdminUserQueryParams = {}): Promise<AdminUserListResponse> {
  const { data, error } = await api.users.admin.get({
    query: {
      page: params.page || 1,
      limit: params.limit || 20,
      search: params.search,
      membershipType: params.membershipType,
      isBlocked: params.isBlocked,
      isRealNameVerified: params.isRealNameVerified,
      sortBy: params.sortBy || 'createdAt',
      sortOrder: params.sortOrder || 'desc',
    },
  })

  if (error) {
    throw new Error('获取用户列表失败')
  }

  return data as AdminUserListResponse
}

/**
 * 获取用户详情
 */
export async function fetchUserById(id: string): Promise<User> {
  const { data, error } = await api.users({ id }).get()

  if (error) {
    throw new Error('获取用户详情失败')
  }

  return data as User
}

/**
 * 管理员获取用户详情（增强版）
 */
export async function fetchAdminUserById(id: string): Promise<AdminUser> {
  const { data, error } = await api.users.admin({ id }).get()

  if (error) {
    throw new Error('获取用户详情失败')
  }

  return data as AdminUser
}

/**
 * 更新用户
 */
export async function updateUser(
  id: string,
  body: {
    nickname?: string
    bio?: string
    gender?: 'male' | 'female' | 'unknown'
    membershipType?: 'free' | 'pro'
    isBlocked?: boolean
  }
): Promise<User> {
  const { data, error } = await api.users({ id }).put(body)

  if (error) {
    throw new Error('更新用户失败')
  }

  return data as User
}

/**
 * 删除用户
 */
export async function deleteUser(id: string): Promise<void> {
  const { error } = await api.users({ id }).delete()

  if (error) {
    throw new Error('删除用户失败')
  }
}

/**
 * 封禁用户
 */
export async function blockUser(id: string): Promise<void> {
  const { error } = await api.users({ id }).block.post()

  if (error) {
    throw new Error('封禁用户失败')
  }
}

/**
 * 解封用户
 */
export async function unblockUser(id: string): Promise<void> {
  const { error } = await api.users({ id }).unblock.post()

  if (error) {
    throw new Error('解封用户失败')
  }
}
