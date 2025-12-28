// RawJsonInspector - 折叠/展开显示原始 JSON
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible'
import { 
  Code2, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RawJsonInspectorProps {
  data: any
  title?: string
  defaultOpen?: boolean
  className?: string
}

export function RawJsonInspector({ 
  data, 
  title = '原始 JSON',
  defaultOpen = false,
  className 
}: RawJsonInspectorProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const jsonString = JSON.stringify(data, null, 2)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(jsonString)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className={className}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className='pb-2'>
          <CollapsibleTrigger asChild>
            <CardTitle className='flex cursor-pointer items-center gap-2 text-sm font-medium hover:text-primary'>
              <Code2 className='h-4 w-4' />
              {title}
              {isOpen ? (
                <ChevronUp className='ml-auto h-4 w-4' />
              ) : (
                <ChevronDown className='ml-auto h-4 w-4' />
              )}
            </CardTitle>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className='pt-0'>
            <div className='relative'>
              {/* 工具栏 */}
              <div className='absolute right-2 top-2 z-10 flex gap-1'>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-6 w-6 p-0'
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? (
                    <Minimize2 className='h-3 w-3' />
                  ) : (
                    <Maximize2 className='h-3 w-3' />
                  )}
                </Button>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-6 w-6 p-0'
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className='h-3 w-3 text-green-500' />
                  ) : (
                    <Copy className='h-3 w-3' />
                  )}
                </Button>
              </div>

              {/* JSON 内容 */}
              <pre
                className={cn(
                  'overflow-auto rounded-md bg-muted p-3 text-xs',
                  expanded ? 'max-h-[500px]' : 'max-h-[200px]'
                )}
              >
                <code className='text-muted-foreground'>
                  {jsonString}
                </code>
              </pre>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
