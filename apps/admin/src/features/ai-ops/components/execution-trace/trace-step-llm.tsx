/**
 * TraceStepLLM Component
 * 
 * LLM 推理步骤详情组件。
 * 参考 Requirements R11
 */

import { Cpu, Zap, Timer, DollarSign } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { LLMStepData } from '../../types/trace'

interface TraceStepLLMProps {
  data: LLMStepData
}

// DeepSeek context window (假设 32K)
const CONTEXT_WINDOW = 32000

export function TraceStepLLM({ data }: TraceStepLLMProps) {
  const tokenUsagePercent = (data.totalTokens / CONTEXT_WINDOW) * 100
  
  // Token 使用量警告级别
  const getTokenWarningLevel = (tokens: number) => {
    if (tokens > 4000) return 'danger'
    if (tokens > 2000) return 'warning'
    return 'normal'
  }
  
  const warningLevel = getTokenWarningLevel(data.totalTokens)

  return (
    <div className='space-y-4'>
      {/* 模型信息 */}
      <div className='flex items-center gap-2'>
        <Cpu className='h-4 w-4 text-muted-foreground' />
        <Badge variant='outline' className='font-mono'>
          {data.model}
        </Badge>
      </div>

      {/* Token 使用量 */}
      <div className='space-y-2'>
        <div className='flex items-center justify-between text-sm'>
          <span className='text-muted-foreground'>Token 使用量</span>
          <span className={cn(
            'font-mono font-medium',
            warningLevel === 'danger' && 'text-destructive',
            warningLevel === 'warning' && 'text-orange-500',
          )}>
            {data.totalTokens.toLocaleString()}
          </span>
        </div>
        
        <Progress 
          value={Math.min(tokenUsagePercent, 100)} 
          className={cn(
            'h-2',
            warningLevel === 'danger' && '[&>div]:bg-destructive',
            warningLevel === 'warning' && '[&>div]:bg-orange-500',
          )}
        />
        
        <div className='flex justify-between text-xs text-muted-foreground'>
          <span>输入: {data.inputTokens.toLocaleString()}</span>
          <span>输出: {data.outputTokens.toLocaleString()}</span>
        </div>
      </div>

      {/* 性能指标 */}
      <div className='grid grid-cols-2 gap-3'>
        {/* 首 Token 延迟 */}
        {data.timeToFirstToken !== undefined && (
          <div className='rounded-md bg-muted/50 p-2'>
            <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
              <Timer className='h-3 w-3' />
              首 Token 延迟
            </div>
            <div className='mt-1 font-mono text-sm font-medium'>
              {data.timeToFirstToken}ms
            </div>
          </div>
        )}

        {/* 生成速度 */}
        {data.tokensPerSecond !== undefined && (
          <div className='rounded-md bg-muted/50 p-2'>
            <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
              <Zap className='h-3 w-3' />
              生成速度
            </div>
            <div className='mt-1 font-mono text-sm font-medium'>
              {data.tokensPerSecond.toFixed(1)} t/s
            </div>
          </div>
        )}
      </div>

      {/* 成本 */}
      {data.cost !== undefined && (
        <div className='flex items-center gap-2 text-sm'>
          <DollarSign className='h-4 w-4 text-muted-foreground' />
          <span className='text-muted-foreground'>成本</span>
          <span className='font-mono font-medium'>
            ${data.cost.toFixed(6)}
          </span>
        </div>
      )}
    </div>
  )
}
