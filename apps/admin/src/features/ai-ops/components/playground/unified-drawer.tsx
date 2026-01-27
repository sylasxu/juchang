/**
 * UnifiedDrawer Component
 * 
 * 统一的右侧抽屉，支持控制面板和节点详情两种视图
 */

import { useState } from 'react'
import {
  ArrowLeft,
  MessageSquare,
  Search,
  Target,
  Cpu,
  Sparkles,
  Wrench,
  CheckCircle,
  Circle,
  Trash2,
} from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import type { FlowNode } from '../../types/flow'
import type { MockSettings } from './mock-settings-panel'
import type { ConversationStats } from './stats-panel'
import { MockSettingsPanel } from './mock-settings-panel'
import { StatsPanel } from './stats-panel'
import { NodeInputContent, NodeOutputContent, NodeMetadata, getNodeLabel } from './node-detail-components'

type DrawerView = 'control' | 'node'

interface UnifiedDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  view: DrawerView
  onViewChange: (view: DrawerView) => void

  // 控制面板相关
  mockSettings: MockSettings
  onMockSettingsChange: (settings: MockSettings) => void
  traceEnabled: boolean
  onTraceEnabledChange: (enabled: boolean) => void
  onSendMessage: (message: string) => void
  onClear: () => void // 新增：清空回调
  stats: ConversationStats | null

  // 节点详情相关
  selectedNode: FlowNode | null
  allNodes?: FlowNode[] // 用于关联节点跳转
  onNodeClick?: (nodeId: string) => void
}

export function UnifiedDrawer({
  open,
  onOpenChange,
  view,
  onViewChange,
  mockSettings,
  onMockSettingsChange,
  traceEnabled,
  onTraceEnabledChange,
  onSendMessage,
  onClear,
  stats,
  selectedNode,
  allNodes = [],
  onNodeClick,
}: UnifiedDrawerProps) {
  const [message, setMessage] = useState('')

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message)
      setMessage('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSend()
    }
  }

  const width = view === 'control' ? 'w-[400px] sm:w-[480px]' : 'w-[480px] sm:w-[540px]'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className={`${width} overflow-y-auto p-0`}>
        {view === 'control' ? (
          <>
            <SheetHeader className='border-b px-6 py-4'>
              <div className='flex items-center justify-between'>
                <SheetTitle>AI Playground</SheetTitle>
                <Button variant='ghost' size='sm' onClick={onClear}>
                  <Trash2 className='mr-2 h-4 w-4' />
                  清空
                </Button>
              </div>
            </SheetHeader>

            <div className='space-y-6 p-6'>
              {/* 消息发送区 */}
              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <Label className='text-sm font-medium'>测试消息</Label>
                  <span className='text-xs text-muted-foreground'>⌘ + Enter 发送</span>
                </div>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder='输入测试消息...'
                  rows={4}
                  className='resize-none'
                />
                <Button onClick={handleSend} className='w-full' disabled={!message.trim()}>
                  <MessageSquare className='mr-2 h-4 w-4' />
                  发送消息
                </Button>
              </div>

              {/* Trace 开关 */}
              <div className='flex items-center justify-between rounded-lg border p-4'>
                <div className='space-y-0.5'>
                  <Label className='text-sm font-medium'>执行追踪</Label>
                  <p className='text-xs text-muted-foreground'>显示 AI 执行流程图</p>
                </div>
                <Switch checked={traceEnabled} onCheckedChange={onTraceEnabledChange} />
              </div>

              {/* 模拟设置 */}
              <div className='space-y-3'>
                <Label className='text-sm font-medium'>模拟设置</Label>
                <div className='rounded-lg border p-4'>
                  <MockSettingsPanel settings={mockSettings} onChange={onMockSettingsChange} />
                </div>
              </div>

              {/* 统计信息 */}
              {stats && (
                <div className='space-y-3'>
                  <Label className='text-sm font-medium'>统计信息</Label>
                  <div className='rounded-lg border p-4'>
                    <StatsPanel stats={stats} />
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* 增强的节点详情 Header */}
            <SheetHeader className='border-b px-6 py-4'>
              <div className='flex items-center gap-3'>
                <Button variant='ghost' size='icon' onClick={() => onViewChange('control')}>
                  <ArrowLeft className='h-4 w-4' />
                </Button>

                {/* 节点类型图标 */}
                <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10'>
                  {selectedNode && getNodeIcon(selectedNode.data.type)}
                </div>

                <div className='min-w-0 flex-1'>
                  <SheetTitle className='truncate'>{selectedNode?.data.label}</SheetTitle>
                  <p className='text-xs text-muted-foreground'>
                    {selectedNode && getNodeTypeLabel(selectedNode.data.type)}
                  </p>
                </div>

                {/* 执行状态 Badge */}
                {selectedNode?.data.status && (
                  <Badge
                    variant={
                      selectedNode.data.status === 'success'
                        ? 'default'
                        : selectedNode.data.status === 'error'
                          ? 'destructive'
                          : 'secondary'
                    }
                  >
                    {getStatusLabel(selectedNode.data.status)}
                  </Badge>
                )}
              </div>
            </SheetHeader>

            {/* 结构化的节点详情内容 */}
            <div className='space-y-6 p-6'>
              {/* 输入参数 */}
              {selectedNode && hasInput(selectedNode.data) && (
                <div className='space-y-3'>
                  <Label className='text-sm font-medium'>输入</Label>
                  <div className='rounded-lg border bg-muted/50 p-4'>
                    <NodeInputContent data={selectedNode.data} />
                  </div>
                </div>
              )}

              {/* 输出结果 */}
              {selectedNode && hasOutput(selectedNode.data) && (
                <div className='space-y-3'>
                  <Label className='text-sm font-medium'>输出</Label>
                  <div className='rounded-lg border bg-muted/50 p-4'>
                    <NodeOutputContent data={selectedNode.data} />
                  </div>
                </div>
              )}

              {/* 执行详情（耗时、Token 等） */}
              {selectedNode?.data.duration !== undefined && (
                <div className='space-y-3'>
                  <Label className='text-sm font-medium'>执行详情</Label>
                  <div className='rounded-lg border bg-muted/50 p-4'>
                    <div className='space-y-2 text-sm'>
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>耗时:</span>
                        <span className='font-medium'>{selectedNode.data.duration}ms</span>
                      </div>
                      {selectedNode.data.metadata && (
                        <NodeMetadata metadata={selectedNode.data.metadata} />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 关联节点 */}
              {selectedNode?.data.downstreamNodes && selectedNode.data.downstreamNodes.length > 0 && (
                <div className='space-y-3'>
                  <Label className='text-sm font-medium'>下一步</Label>
                  <div className='flex flex-wrap gap-2'>
                    {selectedNode.data.downstreamNodes.map((nodeId) => (
                      <Button
                        key={nodeId}
                        variant='outline'
                        size='sm'
                        onClick={() => onNodeClick?.(nodeId)}
                      >
                        {getNodeLabel(nodeId, allNodes)}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

// ============ 辅助函数 ============

function getNodeIcon(type: string): React.ReactElement {
  const icons: Record<string, React.ReactElement> = {
    input: <MessageSquare className='h-5 w-5' />,
    'p0-match': <Search className='h-5 w-5' />,
    'p1-intent': <Target className='h-5 w-5' />,
    processor: <Cpu className='h-5 w-5' />,
    llm: <Sparkles className='h-5 w-5' />,
    tool: <Wrench className='h-5 w-5' />,
    output: <CheckCircle className='h-5 w-5' />,
  }
  return icons[type] || <Circle className='h-5 w-5' />
}

function getNodeTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    input: '用户输入',
    'p0-match': 'P0 匹配',
    'p1-intent': 'P1 意图识别',
    processor: '处理器',
    llm: '大语言模型',
    tool: '工具调用',
    output: '输出结果',
  }
  return labels[type] || type
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: '等待中',
    running: '执行中',
    success: '成功',
    error: '失败',
    skipped: '已跳过',
  }
  return labels[status] || status
}

function hasInput(data: any): boolean {
  return (
    data.type === 'input' ||
    (data.type === 'llm' && data.inputMessages) ||
    (data.type === 'tool' && data.input)
  )
}

function hasOutput(data: any): boolean {
  return (
    data.type === 'p0-match' ||
    data.type === 'p1-intent' ||
    data.type === 'processor' ||
    (data.type === 'llm' && data.output) ||
    (data.type === 'tool' && data.output) ||
    data.type === 'output'
  )
}
