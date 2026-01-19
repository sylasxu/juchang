/**
 * Stats Panel
 * 
 * 显示当前对话的统计信息
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, Clock, Wrench } from 'lucide-react'

export interface ConversationStats {
  totalTokens: number
  responseTime: number // ms
  toolsUsed: string[]
}

interface StatsPanelProps {
  stats: ConversationStats | null
}

export function StatsPanel({ stats }: StatsPanelProps) {
  if (!stats) {
    return (
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-sm font-medium flex items-center gap-2'>
            <Activity className='h-4 w-4' />
            统计
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-xs text-muted-foreground'>发送消息后显示统计</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className='pb-3'>
        <CardTitle className='text-sm font-medium flex items-center gap-2'>
          <Activity className='h-4 w-4' />
          统计
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-3'>
        {/* Tokens */}
        <div className='flex items-center justify-between'>
          <span className='text-xs text-muted-foreground'>Tokens</span>
          <Badge variant='secondary'>{stats.totalTokens.toLocaleString()}</Badge>
        </div>

        {/* 响应时间 */}
        <div className='flex items-center justify-between'>
          <span className='text-xs text-muted-foreground flex items-center gap-1'>
            <Clock className='h-3 w-3' />
            响应时间
          </span>
          <Badge variant='secondary'>{(stats.responseTime / 1000).toFixed(2)}s</Badge>
        </div>

        {/* Tools */}
        {stats.toolsUsed.length > 0 && (
          <div className='space-y-1'>
            <span className='text-xs text-muted-foreground flex items-center gap-1'>
              <Wrench className='h-3 w-3' />
              Tools
            </span>
            <div className='flex flex-wrap gap-1'>
              {stats.toolsUsed.map((tool, i) => (
                <Badge key={i} variant='outline' className='text-xs'>
                  {tool}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
