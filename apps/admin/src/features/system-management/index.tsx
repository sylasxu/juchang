import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SystemHealthMonitor } from './components/system-health-monitor'
import { BusinessRulesConfig } from './components/business-rules-config'
import { FeatureFlagsConfig } from './components/feature-flags-config'
import { PlatformAnnouncements } from './components/platform-announcements'
import { AuditLogs } from './components/audit-logs'
import { MaintenanceManagement } from './components/maintenance-management'
import { AdminAccounts } from './components/admin-accounts'
import { 
  Activity, 
  Settings, 
  Flag, 
  Megaphone,
  RefreshCw,
  FileText,
  Wrench,
  UserCog
} from 'lucide-react'

export function SystemManagement() {
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
            <h2 className='text-2xl font-bold tracking-tight'>系统管理</h2>
            <p className='text-muted-foreground'>
              管理系统配置、监控系统健康状态和发布平台公告
            </p>
          </div>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新数据
          </Button>
        </div>

        <Tabs defaultValue="health" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="health" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              系统健康
            </TabsTrigger>
            <TabsTrigger value="business-rules" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              业务规则
            </TabsTrigger>
            <TabsTrigger value="feature-flags" className="flex items-center gap-2">
              <Flag className="h-4 w-4" />
              功能开关
            </TabsTrigger>
            <TabsTrigger value="announcements" className="flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              平台公告
            </TabsTrigger>
            <TabsTrigger value="audit-logs" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              审计日志
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              系统维护
            </TabsTrigger>
            <TabsTrigger value="admin-accounts" className="flex items-center gap-2">
              <UserCog className="h-4 w-4" />
              管理员账户
            </TabsTrigger>
          </TabsList>

          <TabsContent value="health" className="space-y-6">
            <SystemHealthMonitor />
          </TabsContent>

          <TabsContent value="business-rules" className="space-y-6">
            <BusinessRulesConfig />
          </TabsContent>

          <TabsContent value="feature-flags" className="space-y-6">
            <FeatureFlagsConfig />
          </TabsContent>

          <TabsContent value="announcements" className="space-y-6">
            <PlatformAnnouncements />
          </TabsContent>

          <TabsContent value="audit-logs" className="space-y-6">
            <AuditLogs />
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-6">
            <MaintenanceManagement />
          </TabsContent>

          <TabsContent value="admin-accounts" className="space-y-6">
            <AdminAccounts />
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}