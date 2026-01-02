/**
 * StreamingText Component
 * 
 * 流式文本渲染组件，支持闪烁光标效果。
 * 参考 Requirements R19, R23
 */

import { cn } from '@/lib/utils'

interface StreamingTextProps {
  /** 文本内容 */
  content: string
  /** 是否正在流式输出 */
  isStreaming: boolean
  /** 是否显示光标 */
  showCursor?: boolean
  /** 自定义类名 */
  className?: string
}

export function StreamingText({
  content,
  isStreaming,
  showCursor = true,
  className,
}: StreamingTextProps) {
  return (
    <span className={cn('whitespace-pre-wrap', className)}>
      {content}
      {isStreaming && showCursor && (
        <span className='animate-blink ml-0.5 inline-block h-[1.1em] w-[0.5em] translate-y-[0.1em] bg-current align-text-bottom'>
          ▊
        </span>
      )}
    </span>
  )
}
