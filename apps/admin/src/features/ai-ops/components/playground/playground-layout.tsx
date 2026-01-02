/**
 * PlaygroundLayout Component
 * 
 * Split View 布局容器，管理左右面板的显示和尺寸。
 * 参考 Requirements R8, R14
 */

import { useEffect, useCallback, useRef } from 'react'
import { PanelRightClose, PanelRightOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useSplitView } from '../../hooks/use-split-view'
import { useExecutionTrace } from '../../hooks/use-execution-trace'
import { ExecutionTracePanel } from '../execution-trace/trace-panel'
import { PlaygroundChat } from './playground-chat'
import { PlaygroundHeader } from './playground-header'

export function PlaygroundLayout() {
  const {
    tracePanelVisible,
    tracePanelWidth,
    layoutMode,
    toggleTracePanel,
    setTracePanelWidth,
    isDragging,
    startDragging,
    stopDragging,
  } = useSplitView()

  const { trace, clearTrace, handleTraceStart, handleTraceStep, handleTraceEnd, updateTraceStep } = useExecutionTrace()
  
  const containerRef = useRef<HTMLDivElement>(null)
  const isStreaming = trace?.status === 'running'

  // 处理拖拽
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return
    
    const containerRect = containerRef.current.getBoundingClientRect()
    const newWidth = containerRect.right - e.clientX
    setTracePanelWidth(newWidth)
  }, [isDragging, setTracePanelWidth])

  const handleMouseUp = useCallback(() => {
    stopDragging()
  }, [stopDragging])

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

  // Bottom Sheet 模式
  if (layoutMode === 'bottom-sheet') {
    return (
      <div className='flex h-full flex-col'>
        <PlaygroundHeader
          tracePanelVisible={tracePanelVisible}
          onToggleTracePanel={toggleTracePanel}
        />
        
        <div className='flex-1 overflow-hidden'>
          <PlaygroundChat
            onTraceStart={handleTraceStart}
            onTraceStep={handleTraceStep}
            onTraceEnd={handleTraceEnd}
            onUpdateTraceStep={updateTraceStep}
            onClearTrace={clearTrace}
          />
        </div>

        <Sheet open={tracePanelVisible} onOpenChange={toggleTracePanel}>
          <SheetContent side='bottom' className='h-[60vh]'>
            <SheetHeader>
              <SheetTitle>执行追踪</SheetTitle>
            </SheetHeader>
            <div className='h-[calc(100%-3rem)] overflow-hidden'>
              <ExecutionTracePanel
                trace={trace}
                isStreaming={isStreaming}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    )
  }

  // Split View / Overlay 模式
  return (
    <div ref={containerRef} className='flex h-full flex-col'>
      <PlaygroundHeader
        tracePanelVisible={tracePanelVisible}
        onToggleTracePanel={toggleTracePanel}
      />

      <div className='flex flex-1 overflow-hidden'>
        {/* Chat Panel */}
        <div 
          className='flex-1 overflow-hidden'
          style={{
            marginRight: tracePanelVisible && layoutMode === 'split' 
              ? tracePanelWidth 
              : 0,
          }}
        >
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
            className={cn(
              'flex-shrink-0 border-l bg-background',
              layoutMode === 'split' && 'fixed right-0 top-[var(--header-height,4rem)] bottom-0',
              layoutMode === 'overlay' && 'fixed right-0 top-[var(--header-height,4rem)] bottom-0 z-50 shadow-xl',
            )}
            style={{ width: tracePanelWidth }}
          >
            {/* 拖拽手柄 */}
            {layoutMode === 'split' && (
              <div
                className='absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/20 active:bg-primary/30'
                onMouseDown={startDragging}
              />
            )}

            {/* 关闭按钮 (Overlay 模式) */}
            {layoutMode === 'overlay' && (
              <Button
                variant='ghost'
                size='icon'
                className='absolute left-2 top-2 z-10'
                onClick={toggleTracePanel}
              >
                <PanelRightClose className='h-4 w-4' />
              </Button>
            )}

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
