// 用户数据 API 调用
import { api } from '@/lib/eden'
import type { User, UserListResponse } from './schema'

export interface UserQueryParams {
  page?: number
  limit?: number
  search?: string
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
    throw new Error(error.value?.msg || '获取用户列表失败')
  }

  return data as UserListResponse
}

/**
 * 获取用户详情
 */
export async function fetchUserById(id: string): Promise<User> {
  const { data, error } = await api.users({ id }).get()

  if (error) {
    throw new Error(error.value?.msg || '获取用户详情失败')
  }

  return data as User
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
    throw new Error(error.value?.msg || '更新用户失败')
  }

  return data as User
}

/**
 * 删除用户
 */
export async function deleteUser(id: string): Promise<void> {
  const { error } = await api.users({ id }).delete()

  if (error) {
    throw new Error(error.value?.msg || '删除用户失败')
  }
}

/**
 * 封禁用户
 */
export async function blockUser(id: string): Promise<void> {
  const { error } = await api.users({ id }).block.post()

  if (error) {
    throw new Error(error.value?.msg || '封禁用户失败')
  }
}

/**
 * 解封用户
 */
export async function unblockUser(id: string): Promise<void> {
  const { error } = await api.users({ id }).unblock.post()

  if (error) {
    throw new Error(error.value?.msg || '解封用户失败')
  }
}
