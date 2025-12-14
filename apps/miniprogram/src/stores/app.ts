/**
 * 应用全局状态管理
 */
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface AppState {
  // 系统信息
  systemInfo: WechatMiniprogram.SystemInfo | null
  
  // 网络状态
  networkType: string
  isOnline: boolean
  
  // 应用状态
  isReady: boolean
  currentTabIndex: number
  
  // Actions
  setSystemInfo: (info: WechatMiniprogram.SystemInfo) => void
  setNetworkStatus: (type: string, isOnline: boolean) => void
  setAppReady: (ready: boolean) => void
  setCurrentTab: (index: number) => void
}

export const useAppStore = create<AppState>()(
  immer((set) => ({
    // 初始状态
    systemInfo: null,
    networkType: 'unknown',
    isOnline: true,
    isReady: false,
    currentTabIndex: 0,

    // 设置系统信息
    setSystemInfo: (info) => {
      set((state) => {
        state.systemInfo = info
      })
    },

    // 设置网络状态
    setNetworkStatus: (type, isOnline) => {
      set((state) => {
        state.networkType = type
        state.isOnline = isOnline
      })
    },

    // 设置应用就绪状态
    setAppReady: (ready) => {
      set((state) => {
        state.isReady = ready
      })
    },

    // 设置当前 Tab
    setCurrentTab: (index) => {
      set((state) => {
        state.currentTabIndex = index
      })
    },
  }))
)