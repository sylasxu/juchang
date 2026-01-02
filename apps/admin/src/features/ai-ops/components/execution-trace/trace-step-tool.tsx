/**
 * TraceStepTool Component
 * 
 * Tool 调用步骤详情组件。
 * 参考 Requirements R12
 */

import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { JsonViewer } from '../shared/json-viewer'
import type { ToolStepData } from '../../types/trace'

interface TraceStepToolProps {
  data: ToolStepData
  /** 错误信息 */
  error?: string
  /** 重试回调 */
  onRetry?: () => void
}

export function TraceStepTool({ data, error, onRetry }: TraceStepToolProps) {
  const [activeTab, setActiveTab] = useState<string>('input')
  
  const hasOutput = data.output !== undefined
  const hasError = !!error

  return (
    <div className='space-y-3'>
      {/* 工具信息 */}
      <div className='flex items-center gap-2 text-sm'>
        <span className='text-muted-foreground'>工具</span>
        <code className='rounded bg-muted px-1.5 py-0.5 font-mono text-xs'>
          {data.toolName}
        </code>
        <span className='text-muted-foreground'>→</span>
        <span className='font-medium'>{data.toolDisplayName}</span>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className='h-8'>
          <TabsTrigger value='input' className='text-xs'>
            输入参数
          </TabsTrigger>
          {(hasOutput || hasError) && (
            <TabsTrigger value='output' className='text-xs'>
              执行结果
            </TabsTrigger>
          )}
          {data.widgetType && hasOutput && (
            <TabsTrigger value='preview' className='text-xs'>
              预览
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value='input' className='mt-3'>
          <JsonViewer data={data.input} maxHeight={200} />
        </TabsContent>

        {(hasOutput || hasError) && (
          <TabsContent value='output' className='mt-3'>
            {hasError ? (
              <div className='space-y-3'>
                <div className='rounded-md border border-destructive/50 bg-destructive/10 p-3'>
                  <p className='text-sm text-destructive'>{error}</p>
                </div>
                {onRetry && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={onRetry}
                    className='gap-1.5'
                  >
                    <RotateCcw className='h-3.5 w-3.5' />
                    重试
                  </Button>
                )}
              </div>
            ) : (
              <JsonViewer data={data.output} maxHeight={200} />
            )}
          </TabsContent>
        )}

        {data.widgetType && hasOutput && (
          <TabsContent value='preview' className='mt-3'>
            <WidgetPreview type={data.widgetType} data={data.output} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

/** Widget 预览组件 */
function WidgetPreview({ 
  type, 
  data 
}: { 
  type: 'widget_draft' | 'widget_explore' | 'widget_share'
  data: Record<string, unknown> | undefined
}) {
  if (!data) {
    return (
      <div className='rounded-md bg-muted/50 p-4 text-center text-sm text-muted-foreground'>
        暂无预览数据
      </div>
    )
  }

  // 根据 Widget 类型渲染不同的预览
  switch (type) {
    case 'widget_draft':
      return <DraftPreview data={data} />
    case 'widget_explore':
      return <ExplorePreview data={data} />
    case 'widget_share':
      return <SharePreview data={data} />
    default:
      return (
        <div className='rounded-md bg-muted/50 p-4 text-center text-sm text-muted-foreground'>
          未知 Widget 类型: {type}
        </div>
      )
  }
}

/** 草稿卡片预览 */
function DraftPreview({ data }: { data: Record<string, unknown> }) {
  const draft = data.draft as Record<string, unknown> | undefined
  if (!draft) return null

  return (
    <div className='rounded-lg border bg-gradient-to-br from-primary/5 to-transparent p-4'>
      <div className='space-y-2 text-sm'>
        {draft.title && (
          <h4 className='font-semibold'>{String(draft.title)}</h4>
        )}
        <div className='flex flex-wrap gap-2 text-xs text-muted-foreground'>
          {draft.type && (
            <span className='rounded bg-muted px-1.5 py-0.5'>
              {getTypeLabel(String(draft.type))}
            </span>
          )}
          {draft.startAt && (
            <span>
              {new Date(String(draft.startAt)).toLocaleString('zh-CN')}
            </span>
          )}
          {draft.locationName && (
            <span>📍 {String(draft.locationName)}</span>
          )}
        </div>
      </div>
    </div>
  )
}

/** 探索卡片预览 */
function ExplorePreview({ data }: { data: Record<string, unknown> }) {
  const explore = data.explore as Record<string, unknown> | undefined
  if (!explore) return null

  const results = explore.results as unknown[] | undefined

  return (
    <div className='rounded-lg border bg-gradient-to-br from-green-500/5 to-transparent p-4'>
      <div className='space-y-2 text-sm'>
        {explore.title && (
          <h4 className='font-semibold'>{String(explore.title)}</h4>
        )}
        {results && (
          <p className='text-muted-foreground'>
            找到 {results.length} 个活动
          </p>
        )}
      </div>
    </div>
  )
}

/** 分享卡片预览 */
function SharePreview({ data }: { data: Record<string, unknown> }) {
  const share = data.share as Record<string, unknown> | undefined
  if (!share) return null

  return (
    <div className='rounded-lg border bg-gradient-to-br from-blue-500/5 to-transparent p-4'>
      <div className='space-y-2 text-sm'>
        {share.title && (
          <h4 className='font-semibold'>{String(share.title)}</h4>
        )}
        {share.activityId && (
          <p className='text-xs text-muted-foreground'>
            活动 ID: {String(share.activityId)}
          </p>
        )}
      </div>
    </div>
  )
}

/** 获取活动类型标签 */
function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    food: '🍜 美食',
    entertainment: '🎮 娱乐',
    sports: '⚽ 运动',
    boardgame: '🎲 桌游',
    other: '📌 其他',
  }
  return labels[type] || type
}
