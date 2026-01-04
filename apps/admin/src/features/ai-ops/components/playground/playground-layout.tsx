/**
 * PlaygroundLayout Component
 * 
 * Split View 布局容器，管理左右面板的显示和尺寸。
 */

import { useEffect, useCallback, useRef, useState } from 'react'
import { useExecutionTrace } from '../../hooks/use-execution-trace'
import { ExecutionTracePanel } from '../execution-trace/trace-panel'
import { PlaygroundChat } from './playground-chat'
import { PlaygroundHeader } from './playground-header'

export function PlaygroundLayout() {
  const [tracePanelVisible, setTracePanelVisible] = useState(true)
  const [tracePanelWidth, setTracePanelWidth] = useState(400)
  const [isDragging, setIsDragging] = useState(false)

  const { trace, clearTrace, handleTraceStart, handleTraceStep, handleTraceEnd, updateTraceStep } = useExecutionTrace()
  
  const containerRef = useRef<HTMLDivElement>(null)
  const isStreaming = trace?.status === 'running'

  const toggleTracePanel = useCallback(() => {
    setTracePanelVisible(prev => !prev)
  }, [])

  // 处理拖拽
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return
    
    const containerRect = containerRef.current.getBoundingClientRect()
    const newWidth = Math.max(300, Math.min(600, containerRect.right - e.clientX))
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
    <div ref={containerRef} className='flex h-full flex-col'>
      <PlaygroundHeader
        tracePanelVisible={tracePanelVisible}
        onToggleTracePanel={toggleTracePanel}
      />

      <div className='flex flex-1 min-h-0'>
        {/* Chat Panel */}
        <div className='flex-1 min-w-0 overflow-hidden'>
          <PlaygroundChat
            onTraceStart={handleTraceStart}
            onTraceStep={handleTraceStep}
            onTraceEnd={handleTraceEnd}
            onUpdateTraceStep={updateTraceStep}
            onClearTrace={clearTrace}
          />
        </div>

        {/* Trace Panel */}
        {tracePanelVisible && (
          <div
            className='relative flex-shrink-0 border-l bg-background'
            style={{ width: tracePanelWidth }}
          >
            {/* 拖拽手柄 */}
            <div
              className='absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/20 active:bg-primary/30 z-10'
              onMouseDown={() => setIsDragging(true)}
            />

            <ExecutionTracePanel
              trace={trace}
              isStreaming={isStreaming}
            />
          </div>
        )}
      </div>
    </div>
  )
}
