import { useState, useEffect, useCallback } from 'react';
import { api, apiRequest, type ApiError } from '@/lib/api';

export interface User {
  id: string;
  nickname: string;
  phoneNumber: string;
  avatarUrl?: string;
  participationCount: number;
  fulfillmentCount: number;
  membershipType: 'free' | 'pro';
  isBlocked: boolean;
  createdAt: string;
  lastActiveAt?: string;
}

export interface UserFilters {
  search?: string;
  status?: 'all' | 'active' | 'blocked' | 'inactive';
  membershipType?: 'all' | 'free' | 'pro';
  page?: number;
  limit?: number;
}

export interface UserListResponse {
  data: User[];
  total: number;
  page: number;
  totalPages: number;
}

export function useUsers(filters: UserFilters = {}) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(filters.page || 1);
  const [totalPages, setTotalPages] = useState(0);

  const fetchUsers = useCallback(async () => {
    setLoading(true)/*  */;
    setError(null);

    const { data, error: apiError } = await apiRequest(() =>
      api.users.get({
        page: filters.page || page,
        limit: filters.limit || 20,
        search: filters.search,
      })
    );

    if (apiError) {
      setError(apiError);
    } else if (data) {
      // 转换数据格式以匹配 User 接口
      const transformedUsers: User[] = data.data.map((user: any) => ({
        id: user.id,
        nickname: user.nickname || '未知用户',
        phoneNumber: user.phoneNumber || '未知手机号',
        avatarUrl: user.avatarUrl,
        participationCount: user.participationCount || 0,
        fulfillmentCount: user.fulfillmentCount || 0,
        membershipType: user.membershipType || 'free',
        isBlocked: user.isBlocked || false,
        createdAt: user.createdAt,
        lastActiveAt: user.lastActiveAt,
      }));
      
      setUsers(transformedUsers);
      setTotal(data.total);
      setPage(data.page);
      setTotalPages(data.totalPages);
    }

    setLoading(false);
  }, [filters, page]);

  const blockUser = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/users/${userId}/block`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        setError({ code: response.status, msg: '封禁用户失败' });
        return false;
      }

      // 更新本地状态
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, isBlocked: true } : user
      ));
      return true;
    } catch (error) {
      setError({ code: 500, msg: '封禁用户失败' });
      return false;
    }
  }, []);

  const unblockUser = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/users/${userId}/unblock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        setError({ code: response.status, msg: '解封用户失败' });
        return false;
      }

      // 更新本地状态
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, isBlocked: false } : user
      ));
      return true;
    } catch (error) {
      setError({ code: 500, msg: '解封用户失败' });
      return false;
    }
  }, []);

  const refreshUsers = useCallback(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    total,
    page,
    totalPages,
    blockUser,
    unblockUser,
    refreshUsers,
    setPage,
    setError
  };
}