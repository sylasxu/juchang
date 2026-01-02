/**
 * TraceStepOutput Component
 * 
 * 最终输出步骤详情组件。
 * 参考 Requirements R10
 */

import type { OutputStepData } from '../../types/trace'

interface TraceStepOutputProps {
  data: OutputStepData
}

export function TraceStepOutput({ data }: TraceStepOutputProps) {
  return (
    <div className='rounded-md bg-muted/50 p-3'>
      <p className='text-sm whitespace-pre-wrap'>{data.text}</p>
    </div>
  )
}
