/**
 * Prompt Modal Component
 * 
 * System Prompt 查看弹窗，支持复制和 Markdown 高亮。
 * 参考 Requirements R10
 */

import { useState, useCallback } from 'react'
import { Check, Copy } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface PromptModalProps {
  /** 是否打开 */
  open: boolean
  /** 打开状态变化回调 */
  onOpenChange: (open: boolean) => void
  /** Prompt 内容 */
  content: string
  /** 标题 */
  title?: string
}

export function PromptModal({
  open,
  onOpenChange,
  content,
  title = 'System Prompt',
}: PromptModalProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [content])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-3xl max-h-[80vh] flex flex-col'>
        <DialogHeader className='flex-shrink-0'>
          <div className='flex items-center justify-between pr-8'>
            <DialogTitle>{title}</DialogTitle>
            <Button
              variant='outline'
              size='sm'
              onClick={handleCopy}
              className='gap-1.5'
            >
              {copied ? (
                <>
                  <Check className='h-3.5 w-3.5 text-green-500' />
                  已复制
                </>
              ) : (
                <>
                  <Copy className='h-3.5 w-3.5' />
                  复制
                </>
              )}
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className='flex-1 -mx-6 px-6'>
          <div className='rounded-md border bg-muted/30 p-4'>
            <MarkdownContent content={content} />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

/** 简单的 Markdown 渲染 */
function MarkdownContent({ content }: { content: string }) {
  // 简单的 Markdown 解析
  const lines = content.split('\n')
  
  return (
    <div className='space-y-2 font-mono text-sm'>
      {lines.map((line, i) => (
        <MarkdownLine key={i} line={line} />
      ))}
    </div>
  )
}

function MarkdownLine({ line }: { line: string }) {
  // 标题
  if (line.startsWith('# ')) {
    return <h1 className='text-lg font-bold text-foreground'>{line.slice(2)}</h1>
  }
  if (line.startsWith('## ')) {
    return <h2 className='text-base font-semibold text-foreground'>{line.slice(3)}</h2>
  }
  if (line.startsWith('### ')) {
    return <h3 className='text-sm font-semibold text-foreground'>{line.slice(4)}</h3>
  }

  // 列表项
  if (line.startsWith('- ')) {
    return (
      <div className='flex gap-2 pl-2'>
        <span className='text-muted-foreground'>•</span>
        <span className='text-foreground/90'>{highlightInlineCode(line.slice(2))}</span>
      </div>
    )
  }

  // 数字列表
  const numberedMatch = line.match(/^(\d+)\.\s(.+)$/)
  if (numberedMatch) {
    return (
      <div className='flex gap-2 pl-2'>
        <span className='text-muted-foreground'>{numberedMatch[1]}.</span>
        <span className='text-foreground/90'>{highlightInlineCode(numberedMatch[2])}</span>
      </div>
    )
  }

  // 空行
  if (line.trim() === '') {
    return <div className='h-2' />
  }

  // 普通文本
  return <p className='text-foreground/90'>{highlightInlineCode(line)}</p>
}

/** 高亮行内代码 */
function highlightInlineCode(text: string): React.ReactNode {
  const parts = text.split(/(`[^`]+`)/)
  
  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          className='rounded bg-primary/10 px-1 py-0.5 text-xs text-primary'
        >
          {part.slice(1, -1)}
        </code>
      )
    }
    return part
  })
}
