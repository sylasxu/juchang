import { create } from 'zustand'
import { setCookie, removeCookie } from '@/lib/cookies'
import { auth } from '@/lib/eden'

const ACCESS_TOKEN = 'admin_token'

interface AuthUser {
  id: string
  username: string
  email: string
  role: {
    id: string
    name: string
    permissions: Array<{
      resource: string
      actions: string[]
    }>
  }
  exp: number
}

interface AuthState {
  auth: {
    user: AuthUser | null
    setUser: (user: AuthUser | null) => void
    accessToken: string
    setAccessToken: (accessToken: string) => void
    resetAccessToken: () => void
    reset: () => void
    isAuthenticated: () => boolean
    hasPermission: (resource: string, action: string) => boolean
  }
}

export const useAuthStore = create<AuthState>()((set, get) => {
  // 初始化时从 localStorage 读取 token（与 Eden Treaty 保持一致）
  const initToken = auth.getToken() || ''
  
  return {
    auth: {
      user: null,
      setUser: (user) =>
        set((state) => ({ ...state, auth: { ...state.auth, user } })),
      accessToken: initToken,
      setAccessToken: (accessToken) =>
        set((state) => {
          // 同时更新 localStorage 和 cookie（向后兼容）
          auth.setToken(accessToken)
          setCookie(ACCESS_TOKEN, JSON.stringify(accessToken))
          return { ...state, auth: { ...state.auth, accessToken } }
        }),
      resetAccessToken: () =>
        set((state) => {
          // 同时清除 localStorage 和 cookie
          auth.clearToken()
          removeCookie(ACCESS_TOKEN)
          return { ...state, auth: { ...state.auth, accessToken: '' } }
        }),
      reset: () =>
        set((state) => {
          // 完全重置认证状态
          auth.clearToken()
          removeCookie(ACCESS_TOKEN)
          return {
            ...state,
            auth: { ...state.auth, user: null, accessToken: '' },
          }
        }),
      isAuthenticated: () => {
        const { accessToken, user } = get().auth
        return !!accessToken && !!user && user.exp > Date.now() / 1000
      },
      hasPermission: (resource: string, action: string) => {
        const { user } = get().auth
        if (!user || !user.role) return false
        
        return user.role.permissions.some(permission => 
          permission.resource === resource && 
          permission.actions.includes(action)
        )
      },
    },
  }
})
