import { Copy } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface TruncatedCellProps {
  value: string
  /** 最大显示字符数，默认 20 */
  maxLength?: number
  /** 是否显示复制按钮，默认 false */
  showCopy?: boolean
  /** 是否使用等宽字体（适合 ID），默认 false */
  mono?: boolean
  /** 自定义类名 */
  className?: string
}

/**
 * 通用的表格单元格裁剪组件，超长文本用 Tooltip 展示完整内容
 */
export function TruncatedCell({
  value,
  maxLength = 20,
  showCopy = false,
  mono = false,
  className,
}: TruncatedCellProps) {
  if (!value) return <span className='text-muted-foreground'>-</span>

  const needsTruncate = value.length > maxLength
  const displayText = needsTruncate ? `${value.slice(0, maxLength)}...` : value

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await navigator.clipboard.writeText(value)
    toast.success('已复制到剪贴板')
  }

  const content = (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-sm',
        mono && 'font-mono text-xs',
        className
      )}
    >
      {displayText}
      {showCopy && (
        <Copy
          size={12}
          className='text-muted-foreground hover:text-foreground cursor-pointer flex-shrink-0'
          onClick={handleCopy}
        />
      )}
    </span>
  )

  if (!needsTruncate) return content

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className='cursor-default'>{content}</span>
        </TooltipTrigger>
        <TooltipContent side='top' className='max-w-[400px]'>
          <p className={cn('text-xs break-all', mono && 'font-mono')}>{value}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * 工具函数：裁剪文本
 */
export function truncateText(text: string, maxLength = 20): string {
  if (!text) return ''
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
}
