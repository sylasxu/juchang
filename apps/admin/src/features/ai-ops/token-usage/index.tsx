// Token 使用统计页面
import { useState } from 'react'
import { Bot, TrendingUp, Zap, Hash } from 'lucide-react'
import { useTokenUsageStats } from '@/hooks/use-ai-metrics'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  }
}

export function TokenUsage() {
  const defaultRange = getDefaultDateRange()
  const [startDate, setStartDate] = useState(defaultRange.startDate)
  const [endDate, setEndDate] = useState(defaultRange.endDate)

  const { data, isLoading, error } = useTokenUsageStats({ startDate, endDate })

  return (
    <>
      <Header fixed>
        <div className='flex items-center gap-2'>
          <TrendingUp className='h-5 w-5' />
          <h1 className='text-lg font-semibold'>Token 使用统计</h1>
        </div>
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        {/* 日期筛选 */}
        <div className='flex flex-wrap items-end gap-4'>
          <div className='space-y-1'>
            <Label htmlFor='startDate'>开始日期</Label>
            <Input
              id='startDate'
              type='date'
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className='w-40'
            />
          </div>
          <div className='space-y-1'>
            <Label htmlFor='endDate'>结束日期</Label>
            <Input
              id='endDate'
              type='date'
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className='w-40'
            />
          </div>
        </div>

        {isLoading ? (
          <div className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-4'>
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className='h-24' />
              ))}
            </div>
            <Skeleton className='h-64' />
          </div>
        ) : error ? (
          <div className='text-center py-8 text-muted-foreground'>
            加载失败：{error.message}
          </div>
        ) : (
          <>
            {/* 汇总卡片 */}
            <div className='grid gap-4 md:grid-cols-4'>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>总请求数</CardTitle>
                  <Hash className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {data?.summary.totalRequests.toLocaleString() || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>输入 Token</CardTitle>
                  <Zap className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {data?.summary.totalInputTokens.toLocaleString() || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>输出 Token</CardTitle>
                  <Zap className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {data?.summary.totalOutputTokens.toLocaleString() || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>平均 Token/请求</CardTitle>
                  <TrendingUp className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {data?.summary.avgTokensPerRequest.toLocaleString() || 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tool 调用统计 */}
            {data?.toolCalls && data.toolCalls.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>Tool 调用统计</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='flex flex-wrap gap-2'>
                    {data.toolCalls.map((tool) => (
                      <div
                        key={tool.toolName}
                        className='flex items-center gap-2 rounded-md bg-muted px-3 py-1.5'
                      >
                        <Bot className='h-4 w-4' />
                        <span className='text-sm font-medium'>{tool.toolName}</span>
                        <span className='text-sm text-muted-foreground'>
                          {tool.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 每日统计表格 */}
            <div>
              <h3 className='text-base font-semibold mb-4'>每日统计</h3>
              <div className='overflow-hidden rounded-md border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>日期</TableHead>
                      <TableHead className='text-right'>请求数</TableHead>
                      <TableHead className='text-right'>输入 Token</TableHead>
                      <TableHead className='text-right'>输出 Token</TableHead>
                      <TableHead className='text-right'>总 Token</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.daily && data.daily.length > 0 ? (
                      data.daily.map((row) => (
                        <TableRow key={row.date}>
                          <TableCell>{row.date}</TableCell>
                          <TableCell className='text-right'>
                            {row.totalRequests.toLocaleString()}
                          </TableCell>
                          <TableCell className='text-right'>
                            {row.inputTokens.toLocaleString()}
                          </TableCell>
                          <TableCell className='text-right'>
                            {row.outputTokens.toLocaleString()}
                          </TableCell>
                          <TableCell className='text-right'>
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
            </div>
          </>
        )}
      </Main>
    </>
  )
}
