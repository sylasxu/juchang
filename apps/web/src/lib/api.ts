// 简化的 API 客户端，避免复杂的类型依赖
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// 创建简单的 API 客户端
export const api = {
  dashboard: {
    stats: {
      get: async () => {
        const response = await fetch(`${API_BASE_URL}/dashboard/stats`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return { data: await response.json(), error: null };
      }
    },
    activities: {
      get: async () => {
        const response = await fetch(`${API_BASE_URL}/dashboard/activities`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return { data: await response.json(), error: null };
      }
    },
    users: {
      get: async () => {
        const response = await fetch(`${API_BASE_URL}/dashboard/users`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return { data: await response.json(), error: null };
      }
    }
  },
  users: {
    get: async (params?: { page?: number; limit?: number; search?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.search) searchParams.set('search', params.search);
      
      const url = `${API_BASE_URL}/users${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return { data: await response.json(), error: null };
    }
  }
};

// API 错误类型
export interface ApiError {
  code: number;
  msg: string;
  data?: any;
}

// 错误处理工具
export class ApiErrorHandler {
  static handle(error: any): ApiError {
    if (error?.error) {
      return {
        code: error.status || 500,
        msg: error.error.msg || '请求失败',
        data: error.error.data
      };
    }
    
    if (error?.message) {
      return {
        code: 500,
        msg: error.message
      };
    }
    
    return {
      code: 500,
      msg: '未知错误'
    };
  }
  
  static isNetworkError(error: any): boolean {
    return error?.code === 'NETWORK_ERROR' || error?.message?.includes('fetch');
  }
  
  static isAuthError(error: any): boolean {
    return error?.status === 401 || error?.code === 401;
  }
}

// 通用请求包装器
export async function apiRequest<T>(
  request: () => Promise<{ data: T; error: any }>
): Promise<{ data: T | null; error: ApiError | null }> {
  try {
    const response = await request();
    
    if (response.error) {
      return {
        data: null,
        error: ApiErrorHandler.handle(response.error)
      };
    }
    
    return {
      data: response.data,
      error: null
    };
  } catch (error) {
    return {
      data: null,
      error: ApiErrorHandler.handle(error)
    };
  }
}

// 认证状态管理
export class AuthManager {
  private static TOKEN_KEY = 'juchang_admin_token';
  
  static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }
  
  static setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.TOKEN_KEY, token);
  }
  
  static removeToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.TOKEN_KEY);
  }
  
  static isAuthenticated(): boolean {
    return !!this.getToken();
  }
}