/**
 * useSplitView Hook
 * 
 * 分屏布局状态管理 Hook。
 * 参考 Requirements R14
 */

import { useState, useCallback, useEffect } from 'react'

/** 布局模式 */
export type LayoutMode = 'split' | 'overlay' | 'bottom-sheet'

/** localStorage keys */
const STORAGE_KEYS = {
  TRACE_PANEL_VISIBLE: 'ai-ops-trace-visible',
  TRACE_PANEL_WIDTH: 'ai-ops-trace-width',
}

/** 默认值 */
const DEFAULTS = {
  TRACE_PANEL_WIDTH: 400,
  MIN_TRACE_PANEL_WIDTH: 300,
  MAX_TRACE_PANEL_WIDTH_RATIO: 0.5, // 最大占屏幕 50%
}

/** 断点 */
const BREAKPOINTS = {
  LARGE: 1440,  // ≥1440px: 默认 Split View
  MEDIUM: 1024, // 1024-1439px: 追踪面板默认收起
  // <1024px: Bottom Sheet
}

interface UseSplitViewReturn {
  /** 追踪面板是否可见 */
  tracePanelVisible: boolean
  /** 追踪面板宽度 (px) */
  tracePanelWidth: number
  /** 布局模式 */
  layoutMode: LayoutMode
  /** 切换追踪面板显示 */
  toggleTracePanel: () => void
  /** 设置追踪面板可见性 */
  setTracePanelVisible: (visible: boolean) => void
  /** 设置追踪面板宽度 */
  setTracePanelWidth: (width: number) => void
  /** 是否正在拖拽 */
  isDragging: boolean
  /** 开始拖拽 */
  startDragging: () => void
  /** 停止拖拽 */
  stopDragging: () => void
}

export function useSplitView(): UseSplitViewReturn {
  // 从 localStorage 读取初始值
  const [tracePanelVisible, setTracePanelVisibleState] = useState(() => {
    if (typeof window === 'undefined') return true
    const stored = localStorage.getItem(STORAGE_KEYS.TRACE_PANEL_VISIBLE)
    return stored !== null ? stored === 'true' : true
  })

  const [tracePanelWidth, setTracePanelWidthState] = useState(() => {
    if (typeof window === 'undefined') return DEFAULTS.TRACE_PANEL_WIDTH
    const stored = localStorage.getItem(STORAGE_KEYS.TRACE_PANEL_WIDTH)
    return stored ? parseInt(stored, 10) : DEFAULTS.TRACE_PANEL_WIDTH
  })

  const [layoutMode, setLayoutMode] = useState<LayoutMode>('split')
  const [isDragging, setIsDragging] = useState(false)

  // 检测屏幕尺寸，更新布局模式
  useEffect(() => {
    const updateLayoutMode = () => {
      const width = window.innerWidth
      if (width >= BREAKPOINTS.LARGE) {
        setLayoutMode('split')
      } else if (width >= BREAKPOINTS.MEDIUM) {
        setLayoutMode('overlay')
      } else {
        setLayoutMode('bottom-sheet')
      }
    }

    updateLayoutMode()
    window.addEventListener('resize', updateLayoutMode)
    return () => window.removeEventListener('resize', updateLayoutMode)
  }, [])

  // 根据布局模式设置默认可见性
  useEffect(() => {
    if (layoutMode === 'split') {
      // 大屏默认显示
      const stored = localStorage.getItem(STORAGE_KEYS.TRACE_PANEL_VISIBLE)
      if (stored === null) {
        setTracePanelVisibleState(true)
      }
    } else if (layoutMode === 'overlay') {
      // 中屏默认收起
      const stored = localStorage.getItem(STORAGE_KEYS.TRACE_PANEL_VISIBLE)
      if (stored === null) {
        setTracePanelVisibleState(false)
      }
    }
  }, [layoutMode])

  // 设置追踪面板可见性
  const setTracePanelVisible = useCallback((visible: boolean) => {
    setTracePanelVisibleState(visible)
    localStorage.setItem(STORAGE_KEYS.TRACE_PANEL_VISIBLE, String(visible))
  }, [])

  // 切换追踪面板显示
  const toggleTracePanel = useCallback(() => {
    setTracePanelVisible(!tracePanelVisible)
  }, [tracePanelVisible, setTracePanelVisible])

  // 设置追踪面板宽度
  const setTracePanelWidth = useCallback((width: number) => {
    const maxWidth = window.innerWidth * DEFAULTS.MAX_TRACE_PANEL_WIDTH_RATIO
    const clampedWidth = Math.max(
      DEFAULTS.MIN_TRACE_PANEL_WIDTH,
      Math.min(width, maxWidth)
    )
    setTracePanelWidthState(clampedWidth)
    localStorage.setItem(STORAGE_KEYS.TRACE_PANEL_WIDTH, String(clampedWidth))
  }, [])

  // 开始拖拽
  const startDragging = useCallback(() => {
    setIsDragging(true)
  }, [])

  // 停止拖拽
  const stopDragging = useCallback(() => {
    setIsDragging(false)
  }, [])

  return {
    tracePanelVisible,
    tracePanelWidth,
    layoutMode,
    toggleTracePanel,
    setTracePanelVisible,
    setTracePanelWidth,
    isDragging,
    startDragging,
    stopDragging,
  }
}
