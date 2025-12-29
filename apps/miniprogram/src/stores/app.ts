/**
 * 应用全局状态管理
 * 包含系统信息、网络状态、UI 状态控制
 */
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

// AI 思考状态类型
type AIThinkingState = 'idle' | 'thinking' | 'rendering_widget'

// 待执行操作类型（用于手机号绑定后继续执行）
interface PendingAction {
  type: 'publish' | 'join' | 'other'
  payload?: any
}

interface AppState {
  // 系统信息
  systemInfo: WechatMiniprogram.SystemInfo | null
  
  // 网络状态
  networkType: string
  isOnline: boolean
  
  // 应用状态
  isReady: boolean
  currentTabIndex: number
  
  // UI 状态控制 (中间态组件)
  isAuthSheetVisible: boolean
  isShareGuideVisible: boolean
  aiThinkingState: AIThinkingState
  
  // 待执行操作（手机号绑定成功后继续执行）
  pendingAction: PendingAction | null
  
  // 分享引导数据
  shareGuideData: {
    activityId?: string
    title?: string
    locationName?: string
  } | null
  
  // Actions
  setSystemInfo: (info: WechatMiniprogram.SystemInfo) => void
  setNetworkStatus: (type: string, isOnline: boolean) => void
  setAppReady: (ready: boolean) => void
  setCurrentTab: (index: number) => void
  
  // UI 状态控制 Actions
  showAuthSheet: (pendingAction?: PendingAction) => void
  hideAuthSheet: () => void
  showShareGuide: (data: { activityId?: string; title?: string; locationName?: string }) => void
  hideShareGuide: () => void
  setAIThinkingState: (state: AIThinkingState) => void
  clearPendingAction: () => void
}

export const useAppStore = create<AppState>()(
  immer((set) => ({
    // 初始状态
    systemInfo: null,
    networkType: 'unknown',
    isOnline: true,
    isReady: false,
    currentTabIndex: 0,
    
    // UI 状态初始值
    isAuthSheetVisible: false,
    isShareGuideVisible: false,
    aiThinkingState: 'idle',
    pendingAction: null,
    shareGuideData: null,

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
    
    // 显示手机号绑定半屏
    showAuthSheet: (pendingAction) => {
      set((state) => {
        state.isAuthSheetVisible = true
        state.pendingAction = pendingAction || null
      })
    },
    
    // 隐藏手机号绑定半屏
    hideAuthSheet: () => {
      set((state) => {
        state.isAuthSheetVisible = false
      })
    },
    
    // 显示分享引导蒙层
    showShareGuide: (data) => {
      set((state) => {
        state.isShareGuideVisible = true
        state.shareGuideData = data
      })
    },
    
    // 隐藏分享引导蒙层
    hideShareGuide: () => {
      set((state) => {
        state.isShareGuideVisible = false
        state.shareGuideData = null
      })
    },
    
    // 设置 AI 思考状态
    setAIThinkingState: (thinkingState) => {
      set((state) => {
        state.aiThinkingState = thinkingState
      })
    },
    
    // 清除待执行操作
    clearPendingAction: () => {
      set((state) => {
        state.pendingAction = null
      })
    },
  }))
)