/**
 * JSON Viewer Component
 * 
 * JSON 语法高亮查看器，支持折叠和复制。
 * 使用简单 CSS 实现语法高亮，不引入 shiki。
 * 参考 Requirements R12
 */

import { useState, useCallback, useMemo } from 'react'
import { Check, Copy, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface JsonViewerProps {
  /** JSON 数据 */
  data: unknown
  /** 最大高度 */
  maxHeight?: number
  /** 是否显示行号 */
  showLineNumbers?: boolean
  /** 是否可折叠 */
  collapsible?: boolean
  /** 默认展开层级 */
  defaultExpandLevel?: number
  /** 自定义类名 */
  className?: string
}

export function JsonViewer({
  data,
  maxHeight = 300,
  showLineNumbers = true,
  collapsible = true,
  defaultExpandLevel = 2,
  className,
}: JsonViewerProps) {
  const [copied, setCopied] = useState(false)

  const jsonString = useMemo(() => {
    if (data === undefined || data === null) {
      return 'null'
    }
    try {
      return JSON.stringify(data, null, 2)
    } catch {
      return String(data)
    }
  }, [data])

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(jsonString)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [jsonString])

  const lines = useMemo(() => jsonString?.split('\n') ?? [], [jsonString])

  return (
    <div className={cn('relative rounded-md border bg-muted/30', className)}>
      {/* Copy button */}
      <Button
        variant='ghost'
        size='sm'
        className='absolute right-2 top-2 z-10 h-7 w-7 p-0'
        onClick={handleCopy}
      >
        {copied ? (
          <Check className='h-3.5 w-3.5 text-green-500' />
        ) : (
          <Copy className='h-3.5 w-3.5' />
        )}
      </Button>

      {/* Code content */}
      <div
        className='overflow-auto p-3 pr-10 font-mono text-xs'
        style={{ maxHeight }}
      >
        {collapsible ? (
          <CollapsibleJson data={data} level={0} defaultExpandLevel={defaultExpandLevel} />
        ) : (
          <pre className='m-0'>
            {showLineNumbers ? (
              <table className='border-collapse'>
                <tbody>
                  {lines.map((line, i) => (
                    <tr key={i}>
                      <td className='select-none pr-4 text-right text-muted-foreground/50'>
                        {i + 1}
                      </td>
                      <td>
                        <HighlightedLine line={line} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              lines.map((line, i) => (
                <div key={i}>
                  <HighlightedLine line={line} />
                </div>
              ))
            )}
          </pre>
        )}
      </div>
    </div>
  )
}

/** 高亮单行 JSON */
function HighlightedLine({ line }: { line: string }) {
  // 简单的 JSON 语法高亮
  const highlighted = line
    // 字符串值 (绿色)
    .replace(
      /("(?:[^"\\]|\\.)*")\s*:/g,
      '<span class="text-purple-500 dark:text-purple-400">$1</span>:'
    )
    // 字符串键 (紫色)
    .replace(
      /:\s*("(?:[^"\\]|\\.)*")/g,
      ': <span class="text-green-600 dark:text-green-400">$1</span>'
    )
    // 数字 (蓝色)
    .replace(
      /:\s*(-?\d+\.?\d*)/g,
      ': <span class="text-blue-500 dark:text-blue-400">$1</span>'
    )
    // 布尔值和 null (橙色)
    .replace(
      /:\s*(true|false|null)/g,
      ': <span class="text-orange-500 dark:text-orange-400">$1</span>'
    )

  return <span dangerouslySetInnerHTML={{ __html: highlighted }} />
}

/** 可折叠的 JSON 节点 */
function CollapsibleJson({
  data,
  level,
  defaultExpandLevel,
  keyName,
}: {
  data: unknown
  level: number
  defaultExpandLevel: number
  keyName?: string
}) {
  const [expanded, setExpanded] = useState(level < defaultExpandLevel)

  const indent = '  '.repeat(level)
  const childIndent = '  '.repeat(level + 1)

  // 基本类型
  if (data === null) {
    return (
      <span>
        {keyName && <span className='text-purple-500 dark:text-purple-400'>"{keyName}"</span>}
        {keyName && ': '}
        <span className='text-orange-500 dark:text-orange-400'>null</span>
      </span>
    )
  }

  if (typeof data === 'boolean') {
    return (
      <span>
        {keyName && <span className='text-purple-500 dark:text-purple-400'>"{keyName}"</span>}
        {keyName && ': '}
        <span className='text-orange-500 dark:text-orange-400'>{String(data)}</span>
      </span>
    )
  }

  if (typeof data === 'number') {
    return (
      <span>
        {keyName && <span className='text-purple-500 dark:text-purple-400'>"{keyName}"</span>}
        {keyName && ': '}
        <span className='text-blue-500 dark:text-blue-400'>{data}</span>
      </span>
    )
  }

  if (typeof data === 'string') {
    return (
      <span>
        {keyName && <span className='text-purple-500 dark:text-purple-400'>"{keyName}"</span>}
        {keyName && ': '}
        <span className='text-green-600 dark:text-green-400'>"{data}"</span>
      </span>
    )
  }

  // 数组
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return (
        <span>
          {keyName && <span className='text-purple-500 dark:text-purple-400'>"{keyName}"</span>}
          {keyName && ': '}
          {'[]'}
        </span>
      )
    }

    return (
      <div className='inline'>
        <button
          onClick={() => setExpanded(!expanded)}
          className='inline-flex items-center hover:bg-muted rounded'
        >
          {expanded ? (
            <ChevronDown className='h-3 w-3 text-muted-foreground' />
          ) : (
            <ChevronRight className='h-3 w-3 text-muted-foreground' />
          )}
        </button>
        {keyName && <span className='text-purple-500 dark:text-purple-400'>"{keyName}"</span>}
        {keyName && ': '}
        {expanded ? (
          <>
            {'['}
            <div>
              {data.map((item, i) => (
                <div key={i}>
                  {childIndent}
                  <CollapsibleJson
                    data={item}
                    level={level + 1}
                    defaultExpandLevel={defaultExpandLevel}
                  />
                  {i < data.length - 1 && ','}
                </div>
              ))}
            </div>
            {indent}{']'}
          </>
        ) : (
          <span className='text-muted-foreground'>[...{data.length} items]</span>
        )}
      </div>
    )
  }

  // 对象
  if (typeof data === 'object') {
    const entries = Object.entries(data)
    if (entries.length === 0) {
      return (
        <span>
          {keyName && <span className='text-purple-500 dark:text-purple-400'>"{keyName}"</span>}
          {keyName && ': '}
          {'{}'}
        </span>
      )
    }

    return (
      <div className='inline'>
        <button
          onClick={() => setExpanded(!expanded)}
          className='inline-flex items-center hover:bg-muted rounded'
        >
          {expanded ? (
            <ChevronDown className='h-3 w-3 text-muted-foreground' />
          ) : (
            <ChevronRight className='h-3 w-3 text-muted-foreground' />
          )}
        </button>
        {keyName && <span className='text-purple-500 dark:text-purple-400'>"{keyName}"</span>}
        {keyName && ': '}
        {expanded ? (
          <>
            {'{'}
            <div>
              {entries.map(([key, value], i) => (
                <div key={key}>
                  {childIndent}
                  <CollapsibleJson
                    data={value}
                    level={level + 1}
                    defaultExpandLevel={defaultExpandLevel}
                    keyName={key}
                  />
                  {i < entries.length - 1 && ','}
                </div>
              ))}
            </div>
            {indent}{'}'}
          </>
        ) : (
          <span className='text-muted-foreground'>{'{...}'}</span>
        )}
      </div>
    )
  }

  return <span>{String(data)}</span>
}
