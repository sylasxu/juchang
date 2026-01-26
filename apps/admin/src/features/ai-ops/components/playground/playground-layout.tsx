/**
 * PlaygroundLayout Component (v3.11)
 * 
 * Split View 布局容器，管理左右面板的显示和尺寸。
 * 状态提升：traces 和 modelParams 在此管理。
 */

import { useEffect, useCallback, useRef, useState } from 'react'
import { useExecutionTrace } from '../../hooks/use-execution-trace'
import { FlowTracePanel } from '../flow/flow-trace-panel'
import { PlaygroundChat, type PlaygroundChatRef } from './playground-chat'
import { MockSettingsPanel, type MockSettings } from './mock-settings-panel'
import { StatsPanel, type ConversationStats } from './stats-panel'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { ProfileDropdown } from '@/components/profile-dropdown'

export function PlaygroundLayout() {
  const [tracePanelVisible, setTracePanelVisible] = useState(true)
  const [tracePanelWidth, setTracePanelWidth] = useState(420)
  const [isDragging, setIsDragging] = useState(false)
  const [traceEnabled, setTraceEnabled] = useState(true)
  
  // 模拟设置
  const [mockSettings, setMockSettings] = useState<MockSettings>({
    userType: 'with_phone',
    location: 'guanyinqiao',
  })
  
  // 统计信息
  const [stats] = useState<ConversationStats | null>(null)

  const { 
    traces, 
    modelParams,
    clearTrace, 
    handleTraceStart, 
    handleTraceStep, 
    handleTraceEnd, 
    updateTraceStep,
    isStreaming,
  } = useExecutionTrace()
  
  const containerRef = useRef<HTMLDivElement>(null)
  const chatRef = useRef<PlaygroundChatRef>(null)

  const toggleTracePanel = useCallback(() => {
    setTracePanelVisible(prev => !prev)
  }, [])

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
        {/* 顶部设置区 */}
        <div className='border-b bg-muted/30 p-4'>
          <div className='flex gap-4 max-w-7xl mx-auto'>
            <div className='w-80'>
              <MockSettingsPanel 
                settings={mockSettings} 
                onChange={setMockSettings} 
              />
            </div>
            <div className='w-64'>
              <StatsPanel stats={stats} />
            </div>
          </div>
        </div>

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

              <FlowTracePanel
                traces={traces}
                isStreaming={isStreaming}
              />
            </div>
          )}
        </div>
      </Main>
    </>
  )
}
