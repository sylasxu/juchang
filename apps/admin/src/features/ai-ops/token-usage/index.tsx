// Token 使用统计页面 - 扁平化设计
import { useState } from 'react'
import { Bot } from 'lucide-react'
import { useTokenUsageStats } from '@/hooks/use-ai-metrics'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/date-picker'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// 默认日期范围：最近 7 天
function getDefaultDateRange() {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 7)
  return { start, end }
}

export function TokenUsage() {
  const defaultRange = getDefaultDateRange()
  const [startDate, setStartDate] = useState<Date | undefined>(defaultRange.start)
  const [endDate, setEndDate] = useState<Date | undefined>(defaultRange.end)

  const { data, isLoading, error } = useTokenUsageStats({
    startDate: startDate?.toISOString().split('T')[0],
    endDate: endDate?.toISOString().split('T')[0],
  })

  return (
    <>
      <Header fixed>
        <div className='flex items-center gap-2'>
          <h1 className='text-lg font-semibold'>Token 统计</h1>
        </div>
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-6'>
        {/* 日期筛选 + 汇总数据 */}
        <div className='flex flex-wrap items-center justify-between gap-4'>
          <div className='flex items-center gap-4'>
            <div className='flex items-center gap-2'>
              <Label className='text-sm text-muted-foreground'>从</Label>
              <DatePicker
                selected={startDate}
                onSelect={setStartDate}
                placeholder='开始日期'
              />
            </div>
            <div className='flex items-center gap-2'>
              <Label className='text-sm text-muted-foreground'>至</Label>
              <DatePicker
                selected={endDate}
                onSelect={setEndDate}
                placeholder='结束日期'
              />
            </div>
          </div>

          {/* 汇总数据 - 扁平展示 */}
          {!isLoading && data?.summary && (
            <div className='flex items-center gap-6 text-sm'>
              <div>
                <span className='text-muted-foreground'>请求</span>
                <span className='ml-2 font-medium'>{data.summary.totalRequests.toLocaleString()}</span>
              </div>
              <div>
                <span className='text-muted-foreground'>输入</span>
                <span className='ml-2 font-medium'>{data.summary.totalInputTokens.toLocaleString()}</span>
              </div>
              <div>
                <span className='text-muted-foreground'>输出</span>
                <span className='ml-2 font-medium'>{data.summary.totalOutputTokens.toLocaleString()}</span>
              </div>
              <div>
                <span className='text-muted-foreground'>总计</span>
                <span className='ml-2 font-semibold text-primary'>{data.summary.totalTokens.toLocaleString()}</span>
              </div>
              <div>
                <span className='text-muted-foreground'>均值</span>
                <span className='ml-2 font-medium'>{data.summary.avgTokensPerRequest.toLocaleString()}/次</span>
              </div>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className='space-y-4'>
            <Skeleton className='h-8 w-full' />
            <Skeleton className='h-64' />
          </div>
        ) : error ? (
          <div className='text-center py-8 text-muted-foreground'>
            加载失败：{error.message}
          </div>
        ) : (
          <>
            {/* Tool 调用统计 - 扁平展示 */}
            {data?.toolCalls && data.toolCalls.length > 0 && (
              <div className='flex items-center gap-2 flex-wrap'>
                <span className='text-sm text-muted-foreground'>Tools:</span>
                {data.toolCalls.map((tool) => (
                  <Badge key={tool.toolName} variant='secondary' className='gap-1'>
                    <Bot className='h-3 w-3' />
                    {tool.toolName}
                    <span className='text-muted-foreground'>×{tool.totalCount}</span>
                  </Badge>
                ))}
              </div>
            )}

            {/* 每日统计表格 */}
            <div className='overflow-hidden rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>日期</TableHead>
                    <TableHead className='text-right'>请求数</TableHead>
                    <TableHead className='text-right'>输入</TableHead>
                    <TableHead className='text-right'>输出</TableHead>
                    <TableHead className='text-right'>总计</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.daily && data.daily.length > 0 ? (
                    data.daily.map((row) => (
                      <TableRow key={String(row.date)}>
                        <TableCell>
                          {typeof row.date === 'object' && row.date !== null
                            ? (row.date as Date).toISOString().split('T')[0] 
                            : String(row.date)}
                        </TableCell>
                        <TableCell className='text-right'>
                          {row.totalRequests.toLocaleString()}
                        </TableCell>
                        <TableCell className='text-right'>
                          {row.inputTokens.toLocaleString()}
                        </TableCell>
                        <TableCell className='text-right'>
                          {row.outputTokens.toLocaleString()}
                        </TableCell>
                        <TableCell className='text-right font-medium'>
                          {row.totalTokens.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className='text-center py-8 text-muted-foreground'>
                        暂无数据
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </Main>
    </>
  )
}
