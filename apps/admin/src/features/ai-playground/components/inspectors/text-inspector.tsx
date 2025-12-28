// TextInspector - 渲染 Markdown 文本
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare } from 'lucide-react'

interface TextInspectorProps {
  content: string
  className?: string
}

export function TextInspector({ content, className }: TextInspectorProps) {
  return (
    <Card className={className}>
      <CardHeader className='pb-2'>
        <CardTitle className='flex items-center gap-2 text-sm font-medium'>
          <MessageSquare className='h-4 w-4' />
          文本消息
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className='whitespace-pre-wrap text-sm text-muted-foreground'>
          {content}
        </p>
      </CardContent>
    </Card>
  )
}
