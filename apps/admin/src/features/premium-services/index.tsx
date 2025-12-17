import { useState } from 'react'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PremiumStats } from './components/premium-stats'
import { MembershipDistribution } from './components/membership-distribution'
import { ServiceConfigTable } from './components/service-config-table'
import { AIQuotaManagement } from './components/ai-quota-management'
import { 
  Crown, 
  BarChart3, 
  Settings, 
  Bot,
  Calendar,
  RefreshCw
} from 'lucide-react'

export function PremiumServices() {
  const [timeRange, setTimeRange] = useState('30d')
  const [activeTab, setActiveTab] = useState('overview')

  const timeRangeOptions = [
    { value: '7d', label: '最近7天' },
    { value: '30d', label: '最近30天' },
    { value: '90d', label: '最近90天' },
    { value: '1y', label: '最近1年' },
  ]

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
            <h2 className='text-2xl font-bold tracking-tight'>增值服务管理</h2>
            <p className='text-muted-foreground'>
              管理平台增值服务、会员订阅和AI配额使用情况
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeRangeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" asChild>
              <a href="/premium/analysis">
                <BarChart3 className="h-4 w-4 mr-2" />
                深度分析
              </a>
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新数据
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              统计概览
            </TabsTrigger>
            <TabsTrigger value="membership" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              会员分析
            </TabsTrigger>
            <TabsTrigger value="ai-quota" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              AI配额管理
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              服务配置
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <PremiumStats timeRange={timeRange} />
          </TabsContent>

          <TabsContent value="membership" className="space-y-6">
            <MembershipDistribution />
          </TabsContent>

          <TabsContent value="ai-quota" className="space-y-6">
            <AIQuotaManagement />
          </TabsContent>

          <TabsContent value="config" className="space-y-6">
            <ServiceConfigTable />
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}