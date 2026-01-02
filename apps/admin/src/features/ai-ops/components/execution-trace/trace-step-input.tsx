/**
 * TraceStepInput Component
 * 
 * 用户输入步骤详情组件。
 * 参考 Requirements R10
 */

import type { InputStepData } from '../../types/trace'

interface TraceStepInputProps {
  data: InputStepData
}

export function TraceStepInput({ data }: TraceStepInputProps) {
  return (
    <div className='rounded-md bg-muted/50 p-3'>
      <p className='text-sm whitespace-pre-wrap'>{data.text}</p>
    </div>
  )
}
