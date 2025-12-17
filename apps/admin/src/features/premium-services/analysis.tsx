import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConversionFunnel } from './components/conversion-funnel'
import { UserJourneyAnalysis } from './components/user-journey-analysis'
import { ServicePerformanceMonitoring } from './components/service-performance-monitoring'
import { 
  Target, 
  Route, 
  Activity,
  RefreshCw
} from 'lucide-react'

export function PremiumServicesAnalysis() {
  return (
    <>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>增值服务分析</h2>
            <p className='text-muted-foreground'>
              深入分析用户转化漏斗、旅程路径和服务性能指标
            </p>
          </div>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新数据
          </Button>
        </div>

        <Tabs defaultValue="funnel" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="funnel" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              转化漏斗
            </TabsTrigger>
            <TabsTrigger value="journey" className="flex items-center gap-2">
              <Route className="h-4 w-4" />
              用户旅程
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              性能监控
            </TabsTrigger>
          </TabsList>

          <TabsContent value="funnel" className="space-y-6">
            <ConversionFunnel />
          </TabsContent>

          <TabsContent value="journey" className="space-y-6">
            <UserJourneyAnalysis />
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <ServicePerformanceMonitoring />
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}