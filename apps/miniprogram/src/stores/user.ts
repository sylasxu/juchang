/**
 * 用户状态管理 - 基于 Zustand
 */
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, LoginParams, UpdateUserParams } from '../types/global'
// 使用生成的 API
import { getUsersMe, putUsersMe } from '../api/endpoints/users/users'
import { postAuthWxLogin } from '../api/endpoints/auth/auth'

interface UserState {
  // 状态
  user: User | null
  token: string | null
  isLoggedIn: boolean
  isLoading: boolean
  
  // Actions
  login: (params: LoginParams) => Promise<void>
  logout: () => void
  updateProfile: (data: UpdateUserParams) => Promise<void>
  refreshUserInfo: () => Promise<void>
  setLoading: (loading: boolean) => void
}

// 微信小程序存储适配器
const wechatStorage = {
  getItem: (name: string) => {
    return wx.getStorageSync(name) || null
  },
  setItem: (name: string, value: string) => {
    wx.setStorageSync(name, value)
  },
  removeItem: (name: string) => {
    wx.removeStorageSync(name)
  },
}

export const useUserStore = create<UserState>()(
  persist(
    immer((set, get) => ({
      // 初始状态
      user: null,
      token: null,
      isLoggedIn: false,
      isLoading: false,

      // 登录
      login: async (params) => {
        set((state) => {
          state.isLoading = true
        })

        try {
          const response = await postAuthWxLogin({ code: params.code })
          
          // 检查响应状态
          if (response.status !== 200) {
            throw new Error('登录失败')
          }
          
          const result = response.data as any // 临时使用 any，因为生成的类型有问题
          
          set((state) => {
            state.user = result.user
            state.token = result.token
            state.isLoggedIn = true
            state.isLoading = false
          })

          // 同步到微信存储
          wx.setStorageSync('token', result.token)
          wx.setStorageSync('userInfo', result.user)

        } catch (error: any) {
          set((state) => {
            state.isLoading = false
          })
          throw error
        }
      },

      // 退出登录
      logout: () => {
        set((state) => {
          state.user = null
          state.token = null
          state.isLoggedIn = false
        })

        // 清除微信存储
        wx.removeStorageSync('token')
        wx.removeStorageSync('userInfo')
      },

      // 更新用户资料
      updateProfile: async (data) => {
        const { user } = get()
        if (!user) throw new Error('用户未登录')

        set((state) => {
          state.isLoading = true
        })

        try {
          const response = await putUsersMe(data)
          
          // 检查响应状态
          if (response.status !== 200) {
            throw new Error('更新用户信息失败')
          }
          
          const updatedUser = response.data as any // 临时使用 any，因为生成的类型有问题
          
          set((state) => {
            state.user = updatedUser
            state.isLoading = false
          })

          // 同步到微信存储
          wx.setStorageSync('userInfo', updatedUser)

        } catch (error: any) {
          set((state) => {
            state.isLoading = false
          })
          throw error
        }
      },

      // 刷新用户信息
      refreshUserInfo: async () => {
        const { token } = get()
        if (!token) return

        try {
          const response = await getUsersMe()
          
          // 检查响应状态
          if (response.status !== 200) {
            throw new Error('获取用户信息失败')
          }
          
          const userInfo = response.data as any // 临时使用 any，因为生成的类型有问题
          
          set((state) => {
            state.user = userInfo
          })

          wx.setStorageSync('userInfo', userInfo)
        } catch (error: any) {
          console.error('刷新用户信息失败:', error)
          // 如果是认证错误，自动退出登录
          if (error?.message?.includes('401') || error?.message?.includes('未授权')) {
            get().logout()
          }
        }
      },

      // 设置加载状态
      setLoading: (loading) => {
        set((state) => {
          state.isLoading = loading
        })
      },
    })),
    {
      name: 'user-store',
      storage: createJSONStorage(() => wechatStorage),
      // 只持久化必要的数据
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isLoggedIn: state.isLoggedIn,
      }),
    }
  )
)