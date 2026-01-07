/**
 * PlaygroundLayout Component (v3.11)
 * 
 * Split View 布局容器，管理左右面板的显示和尺寸。
 * 状态提升：traces 和 modelParams 在此管理。
 */

import { useEffect, useCallback, useRef, useState } from 'react'
import { useExecutionTrace } from '../../hooks/use-execution-trace'
import { ExecutionTracePanel } from '../execution-trace/trace-panel'
import { PlaygroundChat, type PlaygroundChatRef } from './playground-chat'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { ProfileDropdown } from '@/components/profile-dropdown'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

export function PlaygroundLayout() {
  const [tracePanelVisible, setTracePanelVisible] = useState(true)
  const [tracePanelWidth, setTracePanelWidth] = useState(420)
  const [isDragging, setIsDragging] = useState(false)
  const [balance, setBalance] = useState<{ total: number; isAvailable: boolean } | null>(null)
  const [balanceLoading, setBalanceLoading] = useState(false)
  const [traceEnabled, setTraceEnabled] = useState(true)

  const { 
    traces, 
    modelParams,
    setModelParams,
    clearTrace, 
    handleTraceStart, 
    handleTraceStep, 
    handleTraceEnd, 
    updateTraceStep,
    isStreaming,
  } = useExecutionTrace()
  
  const containerRef = useRef<HTMLDivElement>(null)
  const chatRef = useRef<PlaygroundChatRef>(null)

  // 获取余额
  const fetchBalance = useCallback(async () => {
    setBalanceLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/ai/balance`)
      if (response.ok) {
        const data = await response.json()
        setBalance({
          total: parseFloat(data.balance_infos?.[0]?.total_balance || '0'),
          isAvailable: data.is_available,
        })
      }
    } catch (err) {
      console.error('获取余额失败:', err)
    } finally {
      setBalanceLoading(false)
    }
  }, [])

  // 初始加载余额
  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  const toggleTracePanel = useCallback(() => {
    setTracePanelVisible(prev => !prev)
  }, [])

  // 重跑功能
  const handleRerun = useCallback(() => {
    chatRef.current?.rerun()
  }, [])

  // 是否可以重跑（有历史消息且不在执行中）
  const canRerun = traces.length > 0 && !isStreaming

  // 处理拖拽
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return
    
    const containerRect = containerRef.current.getBoundingClientRect()
    const newWidth = Math.max(320, Math.min(600, containerRect.right - e.clientX))
    setTracePanelWidth(newWidth)
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // 键盘快捷键: ⌘+E 切换追踪面板
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault()
        toggleTracePanel()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [toggleTracePanel])

  return (
    <>
      {/* 标准 Header */}
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      {/* 页面内容 - 使用 fixed 布局确保高度正确 */}
      <Main fixed className='flex flex-1 flex-col gap-0 p-0 overflow-hidden'>
        {/* Split View */}
        <div ref={containerRef} className='flex flex-1 min-h-0'>
          {/* Chat Panel */}
          <div className='flex-1 min-w-0 overflow-hidden'>
            <PlaygroundChat
              ref={chatRef}
              modelParams={modelParams}
              traceEnabled={traceEnabled}
              onTraceEnabledChange={setTraceEnabled}
              onTraceStart={handleTraceStart}
              onTraceStep={handleTraceStep}
              onTraceEnd={handleTraceEnd}
              onUpdateTraceStep={updateTraceStep}
              onClearTrace={clearTrace}
              tracePanelVisible={tracePanelVisible}
              onToggleTracePanel={toggleTracePanel}
            />
          </div>

          {/* Trace Panel */}
          {tracePanelVisible && (
            <div
              className='relative flex-shrink-0 border-l bg-background overflow-hidden'
              style={{ width: tracePanelWidth }}
            >
              {/* 拖拽手柄 */}
              <div
                className='absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/20 active:bg-primary/30 z-10'
                onMouseDown={() => setIsDragging(true)}
              />

              <ExecutionTracePanel
                traces={traces}
                isStreaming={isStreaming}
                modelParams={modelParams}
                onModelParamsChange={setModelParams}
                onRerun={handleRerun}
                canRerun={canRerun}
                balance={balance}
                balanceLoading={balanceLoading}
                onRefreshBalance={fetchBalance}
                traceEnabled={traceEnabled}
              />
            </div>
          )}
        </div>
      </Main>
    </>
  )
}
