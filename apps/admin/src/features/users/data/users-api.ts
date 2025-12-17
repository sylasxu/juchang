import { type User } from './schema'

// Query parameter types
export interface UserQueryParams {
  page?: number
  pageSize?: number
  status?: string[]
  membership?: string[]
  filter?: string
}

export interface AdminUserQueryParams extends UserQueryParams {
  includeDeleted?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// API response types
export interface UserListResponse {
  data: User[]
  total: number
  page: number
  pageSize: number
}

/**
 * 获取用户列表
 */
export async function fetchUsers(params: UserQueryParams = {}): Promise<UserListResponse> {
  try {
    // For now, return mock data since API endpoints are not implemented
    const { users } = await import('./users')
    
    // Apply filters
    let filteredUsers = [...users]
    
    if (params.status?.length) {
      filteredUsers = filteredUsers.filter(user => params.status!.includes(user.status))
    }
    
    if (params.membership?.length) {
      filteredUsers = filteredUsers.filter(user => params.membership!.includes(user.membershipType))
    }
    
    if (params.filter) {
      const filter = params.filter.toLowerCase()
      filteredUsers = filteredUsers.filter(user => 
        user.nickname.toLowerCase().includes(filter) ||
        user.phoneNumber?.toLowerCase().includes(filter)
      )
    }
    
    // Pagination
    const page = params.page || 1
    const pageSize = params.pageSize || 10
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const paginatedUsers = filteredUsers.slice(start, end)
    
    return {
      data: paginatedUsers,
      total: filteredUsers.length,
      page,
      pageSize,
    }
  } catch (error) {
    console.error('fetchUsers error:', error)
    throw error
  }
}

/**
 * 管理员获取用户列表（增强版）
 */
export async function fetchAdminUsers(params: AdminUserQueryParams = {}): Promise<UserListResponse> {
  // For now, use the same implementation as fetchUsers
  return fetchUsers(params)
}

/**
 * 获取用户详情
 */
export async function fetchUserById(id: string): Promise<User> {
  try {
    const { users } = await import('./users')
    const user = users.find(u => u.id === id)
    
    if (!user) {
      throw new Error('用户不存在')
    }
    
    return user
  } catch (error) {
    console.error('fetchUserById error:', error)
    throw error
  }
}

/**
 * 管理员获取用户详情（增强版）
 */
export async function fetchAdminUserById(id: string): Promise<User> {
  // For now, use the same implementation as fetchUserById
  return fetchUserById(id)
}

/**
 * 更新用户
 */
export async function updateUser(id: string, data: Partial<User>): Promise<User> {
  try {
    // Mock implementation - in real app this would call the API
    const user = await fetchUserById(id)
    const updatedUser = { ...user, ...data }
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return updatedUser
  } catch (error) {
    console.error('updateUser error:', error)
    throw error
  }
}

/**
 * 删除用户
 */
export async function deleteUser(id: string): Promise<void> {
  try {
    // Mock implementation - in real app this would call the API
    await new Promise(resolve => setTimeout(resolve, 500))
    console.log('User deleted:', id)
  } catch (error) {
    console.error('deleteUser error:', error)
    throw error
  }
}

/**
 * 封禁用户
 */
export async function blockUser(id: string): Promise<User> {
  try {
    // Mock implementation - in real app this would call the API
    const user = await fetchUserById(id)
    const blockedUser = { ...user, status: 'blocked' as const, isBlocked: true }
    
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return blockedUser
  } catch (error) {
    console.error('blockUser error:', error)
    throw error
  }
}

/**
 * 解封用户
 */
export async function unblockUser(id: string): Promise<User> {
  try {
    // Mock implementation - in real app this would call the API
    const user = await fetchUserById(id)
    const unblockedUser = { ...user, status: 'active' as const, isBlocked: false }
    
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return unblockedUser
  } catch (error) {
    console.error('unblockUser error:', error)
    throw error
  }
}