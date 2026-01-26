import { useState } from 'react'
import { BarChart3, TrendingUp, TrendingDown, Minus, Target, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { useHotKeywordsAnalytics } from '../hooks/use-hot-keywords'
import { useNavigate } from '@tanstack/react-router'

export function HotKeywordsAnalytics() {
  const navigate = useNavigate()
  const [period, setPeriod] = useState<'7d' | '30d'>('7d')
  const { data, isLoading, error, refetch } = useHotKeywordsAnalytics(period)

  const analytics = data?.data || []

  // 计算 Top 10 by hit count
  const topByHits = [...analytics]
    .sort((a, b) => b.hitCount - a.hitCount)
    .slice(0, 10)

  // 计算 Top 10 by conversion rate (minimum 10 hits)
  const topByConversion = [...analytics]
    .filter(item => item.hitCount >= 10)
    .sort((a, b) => b.conversionRate - a.conversionRate)
    .slice(0, 10)

  // 计算总体统计
  const totalHits = analytics.reduce((sum, item) => sum + item.hitCount, 0)
  const totalConversions = analytics.reduce((sum, item) => sum + item.conversionCount, 0)
  const overallConversionRate = totalHits > 0 ? (totalConversions / totalHits) * 100 : 0
  const activeKeywordsCount = analytics.length

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className='h-4 w-4 text-green-500' />
      case 'down':
        return <TrendingDown className='h-4 w-4 text-red-500' />
      case 'stable':
        return <Minus className='h-4 w-4 text-muted-foreground' />
    }
  }

  return (
    <>
      <Header>
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-6 flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <BarChart3 className='h-6 w-6' />
            <div>
              <h1 className='text-2xl font-bold'>热词数据分析</h1>
              <p className='text-muted-foreground'>查看热词命中率和转化率数据</p>
            </div>
          </div>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => navigate({ to: '/hot-keywords' })}
            >
              返回列表
            </Button>
            <Button
              variant={period === '7d' ? 'default' : 'outline'}
              size='sm'
              onClick={() => setPeriod('7d')}
            >
              最近 7 天
            </Button>
            <Button
              variant={period === '30d' ? 'default' : 'outline'}
              size='sm'
              onClick={() => setPeriod('30d')}
            >
              最近 30 天
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => refetch()}
            >
              <RefreshCw className='h-4 w-4' />
            </Button>
          </div>
        </div>

        {error && (
          <div className='mb-4 p-4 bg-red-50 text-red-600 rounded-lg'>
            加载失败: {error.message}
          </div>
        )}

        {/* 概览卡片 */}
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6'>
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium text-muted-foreground flex items-center gap-2'>
                <Target className='h-4 w-4' />
                活跃热词数
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className='h-8 w-20' />
              ) : (
                <div className='text-2xl font-bold'>{activeKeywordsCount}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium text-muted-foreground'>
                总命中次数
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className='h-8 w-20' />
              ) : (
                <div className='text-2xl font-bold'>{totalHits.toLocaleString()}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium text-muted-foreground'>
                总转化次数
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className='h-8 w-20' />
              ) : (
                <div className='text-2xl font-bold'>{totalConversions.toLocaleString()}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium text-muted-foreground'>
                整体转化率
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className='h-8 w-20' />
              ) : (
                <div className='text-2xl font-bold'>{overallConversionRate.toFixed(2)}%</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className='grid gap-6 lg:grid-cols-2'>
          {/* Top 10 by Hit Count */}
          <Card>
            <CardHeader>
              <CardTitle>热词命中排行 Top 10</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className='space-y-3'>
                  {[...Array(10)].map((_, i) => (
                    <Skeleton key={i} className='h-12 w-full' />
                  ))}
                </div>
              ) : topByHits.length > 0 ? (
                <div className='space-y-3'>
                  {topByHits.map((item, index) => (
                    <div key={item.keyword} className='flex items-center justify-between border-b pb-3 last:border-0'>
                      <div className='flex items-center gap-3'>
                        <span className='w-6 text-center text-muted-foreground font-mono'>
                          {index + 1}
                        </span>
                        <div>
                          <div className='font-medium'>{item.keyword}</div>
                          <div className='text-sm text-muted-foreground'>
                            转化率: {item.conversionRate.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                      <div className='flex items-center gap-3'>
                        <div className='text-right'>
                          <div className='font-bold'>{item.hitCount}</div>
                          <div className='text-sm text-muted-foreground'>
                            {item.conversionCount} 转化
                          </div>
                        </div>
                        {getTrendIcon(item.trend)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='py-8 text-center text-muted-foreground'>
                  暂无数据
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top 10 by Conversion Rate */}
          <Card>
            <CardHeader>
              <CardTitle>转化率排行 Top 10</CardTitle>
              <p className='text-sm text-muted-foreground'>最少 10 次命中</p>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className='space-y-3'>
                  {[...Array(10)].map((_, i) => (
                    <Skeleton key={i} className='h-12 w-full' />
                  ))}
                </div>
              ) : topByConversion.length > 0 ? (
                <div className='space-y-3'>
                  {topByConversion.map((item, index) => (
                    <div key={item.keyword} className='flex items-center justify-between border-b pb-3 last:border-0'>
                      <div className='flex items-center gap-3'>
                        <span className='w-6 text-center text-muted-foreground font-mono'>
                          {index + 1}
                        </span>
                        <div>
                          <div className='font-medium'>{item.keyword}</div>
                          <div className='text-sm text-muted-foreground'>
                            命中: {item.hitCount} 次
                          </div>
                        </div>
                      </div>
                      <div className='flex items-center gap-3'>
                        <div className='text-right'>
                          <div className='font-bold text-primary'>
                            {item.conversionRate.toFixed(2)}%
                          </div>
                          <div className='text-sm text-muted-foreground'>
                            {item.conversionCount} 转化
                          </div>
                        </div>
                        {getTrendIcon(item.trend)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='py-8 text-center text-muted-foreground'>
                  暂无数据（需要至少 10 次命中）
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 优化建议 */}
        {topByHits.length > 0 && (
          <Card className='mt-6'>
            <CardContent className='py-6'>
              <div className='space-y-3'>
                <h3 className='font-medium flex items-center gap-2'>
                  💡 优化建议
                </h3>
                <div className='space-y-2 text-sm text-muted-foreground'>
                  {topByHits[0] && (
                    <p>
                      • 「{topByHits[0].keyword}」是最热门的关键词，命中 {topByHits[0].hitCount} 次
                      {topByHits[0].conversionRate < 10 && '，但转化率较低，建议优化响应内容'}
                    </p>
                  )}
                  {topByConversion[0] && topByConversion[0].conversionRate > 50 && (
                    <p>
                      • 「{topByConversion[0].keyword}」转化率高达 {topByConversion[0].conversionRate.toFixed(1)}%，
                      可以考虑提高优先级或创建类似关键词
                    </p>
                  )}
                  {overallConversionRate < 20 && (
                    <p className='text-amber-600'>
                      • 整体转化率偏低（{overallConversionRate.toFixed(1)}%），建议检查响应内容的相关性和吸引力
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </Main>
    </>
  )
}
