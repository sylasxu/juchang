import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Analytics } from './components/analytics'
import { Overview } from './components/overview'
import { RecentActivities } from './components/recent-activities'
import { useDashboardKPIs, useRealTimeUpdates } from '@/hooks/use-dashboard'
import { RefreshCw, Users, Activity, Calendar } from 'lucide-react'

export function Dashboard() {
  const { data: kpis, isLoading: kpisLoading, error: kpisError } = useDashboardKPIs()
  const { refreshAll } = useRealTimeUpdates()

  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header>
        <div className='ms-auto flex items-center space-x-4'>
          <Search />
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      {/* ===== Main ===== */}
      <Main>
        <div className='mb-2 flex items-center justify-between space-y-2'>
          <h1 className='text-2xl font-bold tracking-tight'>聚场数据概览</h1>
          <div className='flex items-center space-x-2'>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshAll}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              刷新数据
            </Button>
          </div>
        </div>
        <Tabs
          orientation='vertical'
          defaultValue='overview'
          className='space-y-4'
        >
          <div className='w-full overflow-x-auto pb-2'>
            <TabsList>
              <TabsTrigger value='overview'>概览</TabsTrigger>
              <TabsTrigger value='analytics'>分析</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value='overview' className='space-y-4'>
            {/* MVP 核心指标：用户数、活动数、今日活跃 */}
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {/* 总用户数 */}
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    总用户数
                  </CardTitle>
                  <Users className='text-muted-foreground h-4 w-4' />
                </CardHeader>
                <CardContent>
                  {kpisLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ) : kpisError ? (
                    <div className="text-sm text-red-500">加载失败</div>
                  ) : (
                    <>
                      <div className='text-2xl font-bold'>
                        {kpis?.totalUsers?.toLocaleString() || '0'}
                      </div>
                      <p className={`text-xs ${
                        (kpis?.userGrowthRate || 0) >= 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {(kpis?.userGrowthRate || 0) >= 0 ? '+' : ''}
                        {(kpis?.userGrowthRate || 0).toFixed(1)}% 较上月
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* 活跃用户 */}
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    今日活跃
                  </CardTitle>
                  <Activity className='text-muted-foreground h-4 w-4' />
                </CardHeader>
                <CardContent>
                  {kpisLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ) : kpisError ? (
                    <div className="text-sm text-red-500">加载失败</div>
                  ) : (
                    <>
                      <div className='text-2xl font-bold'>
                        {kpis?.activeUsers?.toLocaleString() || '0'}
                      </div>
                      <p className={`text-xs ${
                        (kpis?.activeUserGrowthRate || 0) >= 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {(kpis?.activeUserGrowthRate || 0) >= 0 ? '+' : ''}
                        {(kpis?.activeUserGrowthRate || 0).toFixed(1)}% 较昨日
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* 活动总数 */}
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>活动总数</CardTitle>
                  <Calendar className='text-muted-foreground h-4 w-4' />
                </CardHeader>
                <CardContent>
                  {kpisLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ) : kpisError ? (
                    <div className="text-sm text-red-500">加载失败</div>
                  ) : (
                    <>
                      <div className='text-2xl font-bold'>
                        {kpis?.totalActivities?.toLocaleString() || '0'}
                      </div>
                      <p className={`text-xs ${
                        (kpis?.activityGrowthRate || 0) >= 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {(kpis?.activityGrowthRate || 0) >= 0 ? '+' : ''}
                        {(kpis?.activityGrowthRate || 0).toFixed(1)}% 较上月
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
              <Card className='col-span-1 lg:col-span-4'>
                <CardHeader>
                  <CardTitle>用户增长趋势</CardTitle>
                </CardHeader>
                <CardContent className='ps-2'>
                  <Overview />
                </CardContent>
              </Card>
              <Card className='col-span-1 lg:col-span-3'>
                <CardHeader>
                  <CardTitle>最新活动</CardTitle>
                  <CardDescription>
                    最近创建的活动列表
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RecentActivities />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value='analytics' className='space-y-4'>
            <Analytics />
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}
