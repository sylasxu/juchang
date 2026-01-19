import { createFileRoute } from '@tanstack/react-router'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useTrendInsights } from '@/hooks/use-growth'
import { useState } from 'react'

export const Route = createFileRoute('/_authenticated/growth/trends')({
  component: TrendsPage,
})

function TrendsPage() {
  const [period, setPeriod] = useState<'7d' | '30d'>('7d')
  const { data, isLoading, error } = useTrendInsights(period)

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
            <Sparkles className='h-6 w-6' />
            <h1 className='text-2xl font-bold'>热门洞察</h1>
          </div>
          <div className='flex gap-2'>
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
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
            加载失败，请刷新重试
          </div>
        )}

        <div className='grid gap-6 lg:grid-cols-2'>
          {/* 高频词 */}
          <Card>
            <CardHeader>
              <CardTitle>用户高频词 Top 20</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className='space-y-3'>
                  {[...Array(10)].map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : data?.topWords && data.topWords.length > 0 ? (
                <div className='space-y-3'>
                  {data.topWords.map((item, index) => (
                    <div key={item.word} className='flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        <span className='w-6 text-center text-muted-foreground font-mono'>
                          {index + 1}
                        </span>
                        <span className='font-medium'>{item.word}</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <span className='text-muted-foreground'>{item.count}</span>
                        {item.trend === 'up' && <TrendingUp className='h-4 w-4 text-green-500' />}
                        {item.trend === 'down' && <TrendingDown className='h-4 w-4 text-red-500' />}
                        {item.trend === 'stable' && <Minus className='h-4 w-4 text-muted-foreground' />}
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

          {/* 意图分布 */}
          <Card>
            <CardHeader>
              <CardTitle>意图分布</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className='space-y-4'>
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : data?.intentDistribution && data.intentDistribution.length > 0 ? (
                <div className='space-y-4'>
                  {data.intentDistribution.map((item) => (
                    <div key={item.intent}>
                      <div className='flex items-center justify-between mb-1'>
                        <span className='font-medium'>{item.intent}</span>
                        <span className='text-muted-foreground'>
                          {item.count} ({item.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className='h-2 bg-muted rounded-full overflow-hidden'>
                        <div 
                          className='h-full bg-primary rounded-full transition-all'
                          style={{ width: `${item.percentage}%` }}
                        />
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
        </div>

        {data?.topWords && data.topWords.length > 0 && (
          <Card className='mt-6'>
            <CardContent className='py-8 text-center text-muted-foreground'>
              <p>
                💡 选题建议：最近「{data.topWords[0]?.word}」
                {data.topWords[1] && `「${data.topWords[1].word}」`}
                热度较高，可以围绕这些话题做内容
              </p>
            </CardContent>
          </Card>
        )}
      </Main>
    </>
  )
}
