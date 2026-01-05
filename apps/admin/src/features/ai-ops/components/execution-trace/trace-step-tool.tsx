/**
 * TraceStepTool Component
 * 
 * Tool 调用步骤详情组件。
 * 参考 Requirements R12
 */

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { JsonViewer } from '../shared/json-viewer'
import type { ToolStepData } from '../../types/trace'

interface TraceStepToolProps {
  data: ToolStepData
  /** 错误信息 */
  error?: string
}

export function TraceStepTool({ data, error }: TraceStepToolProps) {
  const [inputOpen, setInputOpen] = useState(false)
  const [outputOpen, setOutputOpen] = useState(false)
  
  const hasOutput = data.output !== undefined
  const hasError = !!error

  return (
    <div className='space-y-2 text-sm'>
      {/* 工具信息 */}
      <div className='flex items-center gap-2'>
        <span className='text-muted-foreground'>工具</span>
        <code className='rounded bg-muted px-1.5 py-0.5 font-mono text-xs'>
          {data.toolName}
        </code>
      </div>

      {/* 输入参数 */}
      <Collapsible open={inputOpen} onOpenChange={setInputOpen}>
        <CollapsibleTrigger className='flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground'>
          {inputOpen ? (
            <ChevronDown className='h-3 w-3' />
          ) : (
            <ChevronRight className='h-3 w-3' />
          )}
          输入参数
        </CollapsibleTrigger>
        <CollapsibleContent className='mt-1'>
          <JsonViewer data={data.input} maxHeight={200} />
        </CollapsibleContent>
      </Collapsible>

      {/* 输出结果 */}
      {(hasOutput || hasError) && (
        <Collapsible open={outputOpen} onOpenChange={setOutputOpen}>
          <CollapsibleTrigger className='flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground'>
            {outputOpen ? (
              <ChevronDown className='h-3 w-3' />
            ) : (
              <ChevronRight className='h-3 w-3' />
            )}
            {hasError ? '错误信息' : '输出结果'}
          </CollapsibleTrigger>
          <CollapsibleContent className='mt-1'>
            {hasError ? (
              <div className='rounded border border-destructive/50 bg-destructive/10 p-2 text-xs text-destructive'>
                {error}
              </div>
            ) : (
              <JsonViewer data={data.output} maxHeight={200} />
            )}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  )
}
