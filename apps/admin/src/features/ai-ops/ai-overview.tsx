// AI Ops 总览页面 (已废弃，保留备用)
// 现在 /ai-ops 直接渲染 PlaygroundLayout
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Bot, Gauge, RefreshCw, AlertTriangle, TrendingUp, FileCode } from 'lucide-react'
import { api } from '@/lib/eden'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// DeepSeek 余额查询 Hook（静默处理错误，UI 已有错误状态展示）
function useDeepSeekBalance() {
  return useQuery({
    queryKey: ['ai', 'balance'],
    queryFn: async () => {
      const response = await api.ai.balance.get()
      if (response.error) {
        throw new Error('余额查询失败')
      }
      return response.data
    },
    refetchInterval: 60000,
    retry: false,
  })
}

// 用户额度统计 Hook（静默处理错误）
function useQuotaStats() {
  return useQuery({
    queryKey: ['users', 'quota-stats'],
    queryFn: async () => {
      const response = await api.users.get({ query: { limit: 100 } })
      if (response.error) {
        throw new Error('统计数据加载失败')
      }
      const result = response.data
      const users = result?.data || []
      const totalUsers = result?.total || 0
      const usersWithQuotaUsed = users.filter(u => (u.aiCreateQuotaToday ?? 3) < 3).length
      return { totalUsers, usersWithQuotaUsed }
    },
    retry: false,
  })
}

export function AIOverview() {
  const { data: balance, isLoading: balanceLoading, error: balanceError, refetch: refetchBalance } = useDeepSeekBalance()
  const { data: quotaStats, isLoading: quotaLoading } = useQuotaStats()

  const totalBalance = balance?.balance_infos?.[0]?.total_balance
  const balanceNum = totalBalance ? parseFloat(totalBalance) : 0
  const isLowBalance = balanceNum <= 0

  return (
    <>
      <Header fixed>
        <div className='flex items-center gap-2'>
          <Bot className='h-5 w-5' />
          <h1 className='text-lg font-semibold'>AI Ops 总览</h1>
        </div>
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='space-y-6'>
          <div className='grid gap-4 md:grid-cols-2'>
            <Card className={isLowBalance ? 'border-red-500' : ''}>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>DeepSeek 余额</CardTitle>
                <Button variant='ghost' size='icon' onClick={() => refetchBalance()} className='h-8 w-8'>
                  <RefreshCw className='h-4 w-4' />
                </Button>
              </CardHeader>
              <CardContent>
                {balanceLoading ? (
                  <div className='space-y-2'>
                    <Skeleton className='h-8 w-24' />
                    <Skeleton className='h-4 w-16' />
                  </div>
                ) : balanceError ? (
                  <div className='text-sm text-red-500'>余额查询失败</div>
                ) : (
                  <>
                    <div className={`text-2xl font-bold ${isLowBalance ? 'text-red-500' : ''}`}>
                      ¥ {balanceNum.toFixed(2)}
                    </div>
                    {isLowBalance && (
                      <div className='mt-1 flex items-center gap-1 text-xs text-red-500'>
                        <AlertTriangle className='h-3 w-3' />
                        余额不足，请及时充值
                      </div>
                    )}
                    {!isLowBalance && (
                      <p className='text-xs text-muted-foreground'>
                        {balance?.is_available ? '服务正常' : '服务异常'}
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>今日额度使用</CardTitle>
                <Gauge className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                {quotaLoading ? (
                  <div className='space-y-2'>
                    <Skeleton className='h-8 w-24' />
                    <Skeleton className='h-4 w-32' />
                  </div>
                ) : (
                  <>
                    <div className='text-2xl font-bold'>
                      {quotaStats?.usersWithQuotaUsed || 0} / {quotaStats?.totalUsers || 0}
                    </div>
                    <p className='text-xs text-muted-foreground'>用户已使用 AI 额度</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className='mb-4 text-lg font-semibold'>快捷入口</h2>
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              <Link to='/ai-ops/token-usage'>
                <Card className='cursor-pointer transition-colors hover:bg-accent'>
                  <CardHeader className='pb-2'>
                    <Gauge className='h-8 w-8 text-primary' />
                  </CardHeader>
                  <CardContent>
                    <CardTitle className='text-base'>额度管理</CardTitle>
                    <CardDescription className='mt-1'>查看用户 AI 额度使用情况</CardDescription>
                  </CardContent>
                </Card>
              </Link>

              <Link to='/ai-ops/token-usage'>
                <Card className='cursor-pointer transition-colors hover:bg-accent'>
                  <CardHeader className='pb-2'>
                    <TrendingUp className='h-8 w-8 text-primary' />
                  </CardHeader>
                  <CardContent>
                    <CardTitle className='text-base'>Token 统计</CardTitle>
                    <CardDescription className='mt-1'>查看 Token 使用量和趋势</CardDescription>
                  </CardContent>
                </Card>
              </Link>

              <Link to='/ai-ops/prompt-viewer'>
                <Card className='cursor-pointer transition-colors hover:bg-accent'>
                  <CardHeader className='pb-2'>
                    <FileCode className='h-8 w-8 text-primary' />
                  </CardHeader>
                  <CardContent>
                    <CardTitle className='text-base'>Prompt 查看</CardTitle>
                    <CardDescription className='mt-1'>查看当前 System Prompt</CardDescription>
                  </CardContent>
                </Card>
              </Link>

              <Link to='/ai-ops/conversations'>
                <Card className='cursor-pointer transition-colors hover:bg-accent'>
                  <CardHeader className='pb-2'>
                    <Bot className='h-8 w-8 text-primary' />
                  </CardHeader>
                  <CardContent>
                    <CardTitle className='text-base'>对话审计</CardTitle>
                    <CardDescription className='mt-1'>查看用户 AI 对话历史</CardDescription>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </div>
      </Main>
    </>
  )
}
