import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ActivityHeatmap } from './components/activity-heatmap'
import { UserDistribution } from './components/user-distribution'
import { RegionPerformance } from './components/region-performance'
import { LocationManagement } from './components/location-management'
import { PrivacyControls } from './components/privacy-controls'
import { 
  Map, 
  Users, 
  TrendingUp, 
  MapPin,
  Shield,
  RefreshCw
} from 'lucide-react'

export function GeographyManagement() {
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
            <h2 className='text-2xl font-bold tracking-tight'>地理分析</h2>
            <p className='text-muted-foreground'>
              分析用户分布、活动热点和区域性能数据
            </p>
          </div>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新数据
          </Button>
        </div>

        <Tabs defaultValue="heatmap" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="heatmap" className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              活动热力图
            </TabsTrigger>
            <TabsTrigger value="distribution" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              用户分布
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              区域性能
            </TabsTrigger>
            <TabsTrigger value="locations" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              位置管理
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              隐私控制
            </TabsTrigger>
          </TabsList>

          <TabsContent value="heatmap" className="space-y-6">
            <ActivityHeatmap />
          </TabsContent>

          <TabsContent value="distribution" className="space-y-6">
            <UserDistribution />
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <RegionPerformance />
          </TabsContent>

          <TabsContent value="locations" className="space-y-6">
            <LocationManagement />
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6">
            <PrivacyControls />
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}