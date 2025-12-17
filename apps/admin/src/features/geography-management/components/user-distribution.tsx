import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { useUserDistribution, useExportGeographyData } from '@/hooks/use-geography-management'
import { 
  Users, 
  Filter,
  Download,
  MapPin,
  TrendingUp,
  TrendingDown,
  UserPlus,
  Activity,
  BarChart3
} from 'lucide-react'

interface DistributionFilters {
  region?: string
  city?: string
  dateRange?: [string, string]
  minUsers?: number
}

export function UserDistribution() {
  const [filters, setFilters] = useState<DistributionFilters>({})
  
  const { data: distributionData, isLoading } = useUserDistribution(filters)
  const exportData = useExportGeographyData()
  
  // Mock data for demonstration
  const mockDistributionData = [
    {
      region: '北京市',
      city: '朝阳区',
      userCount: 12456,
      activeUsers: 8934,
      newUsers: 234,
      coordinates: { latitude: 39.9042, longitude: 116.4074 },
      growthRate: 15.6,
    },
    {
      region: '上海市',
      city: '浦东新区',
      userCount: 15678,
      activeUsers: 11234,
      newUsers: 345,
      coordinates: { latitude: 31.2304, longitude: 121.4737 },
      growthRate: 18.2,
    },
    {
      region: '深圳市',
      city: '南山区',
      userCount: 9876,
      activeUsers: 7123,
      newUsers: 189,
      coordinates: { latitude: 22.3193, longitude: 114.1694 },
      growthRate: 12.4,
    },
    {
      region: '广州市',
      city: '天河区',
      userCount: 8765,
      activeUsers: 6234,
      newUsers: 156,
      coordinates: { latitude: 23.1291, longitude: 113.2644 },
      growthRate: 9.8,
    },
    {
      region: '成都市',
      city: '锦江区',
      userCount: 7654,
      activeUsers: 5432,
      newUsers: 134,
      coordinates: { latitude: 30.5728, longitude: 104.0668 },
      growthRate: 14.3,
    },
    {
      region: '杭州市',
      city: '西湖区',
      userCount: 6543,
      activeUsers: 4567,
      newUsers: 123,
      coordinates: { latitude: 30.2741, longitude: 120.1551 },
      growthRate: 11.7,
    },
    {
      region: '南京市',
      city: '鼓楼区',
      userCount: 5432,
      activeUsers: 3876,
      newUsers: 98,
      coordinates: { latitude: 32.0603, longitude: 118.7969 },
      growthRate: 8.9,
    },
    {
      region: '武汉市',
      city: '江汉区',
      userCount: 4321,
      activeUsers: 3012,
      newUsers: 87,
      coordinates: { latitude: 30.5928, longitude: 114.3055 },
      growthRate: -2.1,
    }
  ]

  const distributionList = (distributionData && Array.isArray(distributionData)) ? distributionData : mockDistributionData

  const regionOptions = [
    { value: '', label: '全部地区' },
    { value: 'beijing', label: '北京市' },
    { value: 'shanghai', label: '上海市' },
    { value: 'shenzhen', label: '深圳市' },
    { value: 'guangzhou', label: '广州市' },
    { value: 'chengdu', label: '成都市' },
    { value: 'hangzhou', label: '杭州市' },
    { value: 'nanjing', label: '南京市' },
    { value: 'wuhan', label: '武汉市' },
  ]

  const handleFilterChange = (key: keyof DistributionFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleExport = () => {
    exportData.mutate({
      type: 'distribution',
      filters
    })
  }

  const totalUsers = distributionList.reduce((sum, item) => sum + item.userCount, 0)
  const totalActiveUsers = distributionList.reduce((sum, item) => sum + item.activeUsers, 0)
  const totalNewUsers = distributionList.reduce((sum, item) => sum + item.newUsers, 0)
  const avgGrowthRate = distributionList.reduce((sum, item) => sum + item.growthRate, 0) / distributionList.length

  const getGrowthTrend = (rate: number) => {
    if (rate > 0) {
      return {
        icon: TrendingUp,
        color: 'text-green-600',
        label: `+${rate.toFixed(1)}%`
      }
    } else {
      return {
        icon: TrendingDown,
        color: 'text-red-600',
        label: `${rate.toFixed(1)}%`
      }
    }
  }

  const getActiveRate = (active: number, total: number) => {
    return ((active / total) * 100).toFixed(1)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 用户分布统计概览 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总用户数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              所有区域用户总数
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃用户</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActiveUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              活跃率 {((totalActiveUsers / totalUsers) * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">新增用户</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalNewUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              本月新增用户数
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均增长率</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgGrowthRate > 0 ? '+' : ''}{avgGrowthRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              用户增长平均值
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 筛选器 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            筛选条件
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label htmlFor="region-filter">地区筛选</Label>
              <Select
                value={filters.region || ''}
                onValueChange={(value) => handleFilterChange('region', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择地区" />
                </SelectTrigger>
                <SelectContent>
                  {regionOptions.map((region) => (
                    <SelectItem key={region.value} value={region.value}>
                      {region.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="city-filter">城市筛选</Label>
              <Input
                id="city-filter"
                placeholder="输入城市名称"
                value={filters.city || ''}
                onChange={(e) => handleFilterChange('city', e.target.value || undefined)}
              />
            </div>

            <div>
              <Label htmlFor="min-users">最小用户数</Label>
              <Input
                id="min-users"
                type="number"
                placeholder="输入最小用户数"
                value={filters.minUsers || ''}
                onChange={(e) => handleFilterChange('minUsers', e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>

            <div>
              <Label htmlFor="date-filter">统计日期</Label>
              <Input
                id="date-filter"
                type="date"
                onChange={(e) => {
                  if (e.target.value) {
                    const startDate = e.target.value + 'T00:00:00'
                    const endDate = e.target.value + 'T23:59:59'
                    handleFilterChange('dateRange', [startDate, endDate])
                  } else {
                    handleFilterChange('dateRange', undefined)
                  }
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters({})}
            >
              重置筛选
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={exportData.isPending}
            >
              <Download className="h-4 w-4 mr-2" />
              导出数据
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 用户分布表格 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            用户地理分布
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>地区</TableHead>
                <TableHead>总用户数</TableHead>
                <TableHead>活跃用户</TableHead>
                <TableHead>新增用户</TableHead>
                <TableHead>活跃率</TableHead>
                <TableHead>增长趋势</TableHead>
                <TableHead>坐标位置</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {distributionList.map((item, index) => {
                const trend = getGrowthTrend(item.growthRate)
                const TrendIcon = trend.icon
                
                return (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{item.region}</div>
                          <div className="text-sm text-muted-foreground">{item.city}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{item.userCount.toLocaleString()}</div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.activeUsers.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">
                          {getActiveRate(item.activeUsers, item.userCount)}% 活跃
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <UserPlus className="h-3 w-3 text-green-600" />
                        <span className="font-medium">{item.newUsers}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getActiveRate(item.activeUsers, item.userCount)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-1 ${trend.color}`}>
                        <TrendIcon className="h-3 w-3" />
                        <span className="text-sm font-medium">{trend.label}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-mono">
                        {item.coordinates.latitude.toFixed(4)},<br />
                        {item.coordinates.longitude.toFixed(4)}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 用户分布可视化图表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            分布可视化
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* 图表占位区域 */}
          <div className="relative h-80 bg-muted rounded-lg flex items-center justify-center mb-6">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">用户分布图表占位</p>
              <p className="text-sm text-muted-foreground">
                可集成 ECharts、Chart.js 等图表库
              </p>
            </div>
          </div>

          {/* 排行榜 */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-3">用户数量排行</h4>
              <div className="space-y-2">
                {distributionList
                  .sort((a, b) => b.userCount - a.userCount)
                  .slice(0, 5)
                  .map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <span className="text-sm">{item.region} {item.city}</span>
                      </div>
                      <span className="font-medium">{item.userCount.toLocaleString()}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">增长率排行</h4>
              <div className="space-y-2">
                {distributionList
                  .sort((a, b) => b.growthRate - a.growthRate)
                  .slice(0, 5)
                  .map((item, index) => {
                    const trend = getGrowthTrend(item.growthRate)
                    const TrendIcon = trend.icon
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                            {index + 1}
                          </Badge>
                          <span className="text-sm">{item.region} {item.city}</span>
                        </div>
                        <div className={`flex items-center gap-1 ${trend.color}`}>
                          <TrendIcon className="h-3 w-3" />
                          <span className="text-sm font-medium">{trend.label}</span>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}