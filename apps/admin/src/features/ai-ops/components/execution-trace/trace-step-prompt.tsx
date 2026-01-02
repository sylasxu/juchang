/**
 * TraceStepPrompt Component
 * 
 * System Prompt 注入步骤详情组件。
 * 参考 Requirements R10
 */

import { useState } from 'react'
import { Clock, MapPin, FileEdit, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PromptModal } from '../shared/prompt-modal'
import type { PromptStepData } from '../../types/trace'

interface TraceStepPromptProps {
  data: PromptStepData
}

export function TraceStepPrompt({ data }: TraceStepPromptProps) {
  const [showFullPrompt, setShowFullPrompt] = useState(false)

  return (
    <div className='space-y-3'>
      {/* 上下文摘要 */}
      <div className='space-y-2'>
        {/* 当前时间 */}
        <div className='flex items-center gap-2 text-sm'>
          <Clock className='h-4 w-4 text-muted-foreground' />
          <span className='text-muted-foreground'>当前时间</span>
          <span className='font-medium'>{data.currentTime}</span>
        </div>

        {/* 用户位置 */}
        {data.userLocation && (
          <div className='flex items-center gap-2 text-sm'>
            <MapPin className='h-4 w-4 text-muted-foreground' />
            <span className='text-muted-foreground'>用户位置</span>
            <span className='font-medium'>
              {data.userLocation.name || `${data.userLocation.lat.toFixed(4)}, ${data.userLocation.lng.toFixed(4)}`}
            </span>
          </div>
        )}

        {/* 草稿上下文 */}
        {data.draftContext && (
          <div className='flex items-center gap-2 text-sm'>
            <FileEdit className='h-4 w-4 text-muted-foreground' />
            <span className='text-muted-foreground'>草稿上下文</span>
            <span className='font-medium'>{data.draftContext.title}</span>
          </div>
        )}
      </div>

      {/* 查看完整 Prompt 按钮 */}
      {data.fullPrompt && (
        <>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setShowFullPrompt(true)}
            className='gap-1.5'
          >
            <Eye className='h-3.5 w-3.5' />
            查看完整 Prompt
          </Button>

          <PromptModal
            open={showFullPrompt}
            onOpenChange={setShowFullPrompt}
            content={data.fullPrompt}
          />
        </>
      )}
    </div>
  )
}
