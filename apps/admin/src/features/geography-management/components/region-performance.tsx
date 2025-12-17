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
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useRegionPerformance, useExportGeographyData } from '@/hooks/use-geography-management'
import { 
  TrendingUp, 
  Filter,
  Download,
  MapPin,
  Activity,
  Users,
  Target,
  DollarSign,
  BarChart3,
  TrendingDown,
  Calendar
} from 'lucide-react'

interface PerformanceFilters {
  region?: string
  city?: string
  dateRange?: [string, string]
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export function RegionPerformance() {
  const [filters, setFilters] = useState<PerformanceFilters>({
    sortBy: 'completionRate',
    sortOrder: 'desc',
  })
  
  const { data: performanceData, isLoading } = useRegionPerformance(filters)
  const exportData = useExportGeographyData()
  
  // Mock data for demonstration
  const mockPerformanceData = [
    {
      id: '1',
      region: '北京市',
      city: '朝阳区',
      metrics: {
        totalActivities: 456,
        completedActivities: 389,
        averageParticipants: 12.5,
        completionRate: 85.3,
        userEngagement: 78.9,
        revenuePerUser: 156.78,
      },
      trends: {
        activityGrowth: 15.6,
        userGrowth: 12.3,
        engagementChange: 8.7,
      },
      coordinates: { latitude: 39.9042, longitude: 116.4074 },
      lastUpdated: new Date().toISOString(),
    },
    {
      id: '2',
      region: '上海市',
      city: '浦东新区',
      metrics: {
        totalActivities: 567,
        completedActivities: 498,
        averageParticipants: 14.2,
        completionRate: 87.8,
        userEngagement: 82.1,
        revenuePerUser: 189.45,
      },
      trends: {
        activityGrowth: 18.2,
        userGrowth: 16.7,
        engagementChange: 11.4,
      },
      coordinates: { latitude: 31.2304, longitude: 121.4737 },
      lastUpdated: new Date().toISOString(),
    },
    {
      id: '3',
      region: '深圳市',
      city: '南山区',
      metrics: {
        totalActivities: 398,
        completedActivities: 321,
        averageParticipants: 11.8,
        completionRate: 80.7,
        userEngagement: 75.6,
        revenuePerUser: 142.33,
      },
      trends: {
        activityGrowth: 12.4,
        userGrowth: 9.8,
        engagementChange: 5.2,
      },
      coordinates: { latitude: 22.3193, longitude: 114.1694 },
      lastUpdated: new Date().toISOString(),
    },
    {
      id: '4',
      region: '广州市',
      city: '天河区',
      metrics: {
        totalActivities: 334,
        completedActivities: 267,
        averageParticipants: 10.9,
        completionRate: 79.9,
        userEngagement: 73.2,
        revenuePerUser: 128.67,
      },
      trends: {
        activityGrowth: 9.8,
        userGrowth: 7.5,
        engagementChange: 3.1,
      },
      coordinates: { latitude: 23.1291, longitude: 113.2644 },
      lastUpdated: new Date().toISOString(),
    },
    {
      id: '5',
      region: '成都市',
      city: '锦江区',
      metrics: {
        totalActivities: 289,
        completedActivities: 234,
        averageParticipants: 9.7,
        completionRate: 81.0,
        userEngagement: 76.8,
        revenuePerUser: 134.22,
      },
      trends: {
        activityGrowth: 14.3,
        userGrowth: 11.9,
        engagementChange: 6.8,
      },
      coordinates: { latitude: 30.5728, longitude: 104.0668 },
      lastUpdated: new Date().toISOString(),
    },
    {
      id: '6',
      region: '杭州市',
      city: '西湖区',
      metrics: {
        totalActivities: 245,
        completedActivities: 198,
        averageParticipants: 8.9,
        completionRate: 80.8,
        userEngagement: 74.5,
        revenuePerUser: 119.88,
      },
      trends: {
        activityGrowth: 11.7,
        userGrowth: 8.9,
        engagementChange: 4.3,
      },
      coordinates: { latitude: 30.2741, longitude: 120.1551 },
      lastUpdated: new Date().toISOString(),
    }
  ]

  const performanceList = (performanceData && Array.isArray(performanceData)) ? performanceData : mockPerformanceData

  const regionOptions = [
    { value: '', label: '全部地区' },
    { value: 'beijing', label: '北京市' },
    { value: 'shanghai', label: '上海市' },
    { value: 'shenzhen', label: '深圳市' },
    { value: 'guangzhou', label: '广州市' },
    { value: 'chengdu', label: '成都市' },
    { value: 'hangzhou', label: '杭州市' },
  ]

  const sortOptions = [
    { value: 'completionRate', label: '完成率' },
    { value: 'userEngagement', label: '用户参与度' },
    { value: 'revenuePerUser', label: '人均收入' },
    { value: 'totalActivities', label: '活动总数' },
    { value: 'activityGrowth', label: '活动增长率' },
  ]

  const handleFilterChange = (key: keyof PerformanceFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleExport = () => {
    exportData.mutate({
      type: 'performance',
      filters
    })
  }

  const getTrendIcon = (value: number) => {
    return value >= 0 ? TrendingUp : TrendingDown
  }

  const getTrendColor = (value: number) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600'
  }

  const getPerformanceLevel = (rate: number) => {
    if (rate >= 85) return { label: '优秀', color: 'bg-green-500' }
    if (rate >= 75) return { label: '良好', color: 'bg-blue-500' }
    if (rate >= 65) return { label: '一般', color: 'bg-yellow-500' }
    return { label: '待改进', color: 'bg-red-500' }
  }

  // 计算总体指标
  const totalActivities = performanceList.reduce((sum, item) => sum + item.metrics.totalActivities, 0)
  const totalCompleted = performanceList.reduce((sum, item) => sum + item.metrics.completedActivities, 0)
  const avgCompletionRate = performanceList.reduce((sum, item) => sum + item.metrics.completionRate, 0) / performanceList.length
  const avgEngagement = performanceList.reduce((sum, item) => sum + item.metrics.userEngagement, 0) / performanceList.length
  const avgRevenue = performanceList.reduce((sum, item) => sum + item.metrics.revenuePerUser, 0) / performanceList.length

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
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
      {/* 区域性能统计概览 */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总活动数</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActivities.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              所有区域活动总数
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">完成活动</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCompleted.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              已完成活动数量
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均完成率</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgCompletionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              活动完成率平均值
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均参与度</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgEngagement.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              用户参与度平均值
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均收入</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{avgRevenue.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">
              人均收入平均值
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
              <Label htmlFor="sort-by">排序字段</Label>
              <Select
                value={filters.sortBy || 'completionRate'}
                onValueChange={(value) => handleFilterChange('sortBy', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="sort-order">排序方式</Label>
              <Select
                value={filters.sortOrder || 'desc'}
                onValueChange={(value: 'asc' | 'desc') => handleFilterChange('sortOrder', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">降序</SelectItem>
                  <SelectItem value="asc">升序</SelectItem>
                </SelectContent>
              </Select>
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
              onClick={() => setFilters({ sortBy: 'completionRate', sortOrder: 'desc' })}
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

      {/* 区域性能表格 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            区域性能分析
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>地区</TableHead>
                <TableHead>活动指标</TableHead>
                <TableHead>完成率</TableHead>
                <TableHead>参与度</TableHead>
                <TableHead>人均收入</TableHead>
                <TableHead>增长趋势</TableHead>
                <TableHead>更新时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {performanceList.map((item) => {
                const completionLevel = getPerformanceLevel(item.metrics.completionRate)
                const engagementLevel = getPerformanceLevel(item.metrics.userEngagement)
                const ActivityTrendIcon = getTrendIcon(item.trends.activityGrowth)
                const UserTrendIcon = getTrendIcon(item.trends.userGrowth)
                const EngagementTrendIcon = getTrendIcon(item.trends.engagementChange)
                
                return (
                  <TableRow key={item.id}>
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
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>总数:</span>
                          <span className="font-medium">{item.metrics.totalActivities}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>完成:</span>
                          <span className="font-medium">{item.metrics.completedActivities}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>平均参与:</span>
                          <span className="font-medium">{item.metrics.averageParticipants}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{item.metrics.completionRate.toFixed(1)}%</span>
                          <Badge variant="outline" className={`${completionLevel.color} text-white border-0 text-xs`}>
                            {completionLevel.label}
                          </Badge>
                        </div>
                        <Progress value={item.metrics.completionRate} className="h-2" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{item.metrics.userEngagement.toFixed(1)}%</span>
                          <Badge variant="outline" className={`${engagementLevel.color} text-white border-0 text-xs`}>
                            {engagementLevel.label}
                          </Badge>
                        </div>
                        <Progress value={item.metrics.userEngagement} className="h-2" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">¥{item.metrics.revenuePerUser.toFixed(2)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className={`flex items-center gap-1 text-xs ${getTrendColor(item.trends.activityGrowth)}`}>
                          <ActivityTrendIcon className="h-3 w-3" />
                          <span>活动 {item.trends.activityGrowth > 0 ? '+' : ''}{item.trends.activityGrowth.toFixed(1)}%</span>
                        </div>
                        <div className={`flex items-center gap-1 text-xs ${getTrendColor(item.trends.userGrowth)}`}>
                          <UserTrendIcon className="h-3 w-3" />
                          <span>用户 {item.trends.userGrowth > 0 ? '+' : ''}{item.trends.userGrowth.toFixed(1)}%</span>
                        </div>
                        <div className={`flex items-center gap-1 text-xs ${getTrendColor(item.trends.engagementChange)}`}>
                          <EngagementTrendIcon className="h-3 w-3" />
                          <span>参与 {item.trends.engagementChange > 0 ? '+' : ''}{item.trends.engagementChange.toFixed(1)}%</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(item.lastUpdated).toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 性能对比图表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            性能对比分析
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* 图表占位区域 */}
          <div className="relative h-80 bg-muted rounded-lg flex items-center justify-center mb-6">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">区域性能对比图表占位</p>
              <p className="text-sm text-muted-foreground">
                可集成雷达图、柱状图等多维度对比图表
              </p>
            </div>
          </div>

          {/* 性能排行榜 */}
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <h4 className="font-medium mb-3">完成率排行</h4>
              <div className="space-y-2">
                {performanceList
                  .sort((a, b) => b.metrics.completionRate - a.metrics.completionRate)
                  .slice(0, 5)
                  .map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <span className="text-sm">{item.region} {item.city}</span>
                      </div>
                      <span className="font-medium">{item.metrics.completionRate.toFixed(1)}%</span>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">参与度排行</h4>
              <div className="space-y-2">
                {performanceList
                  .sort((a, b) => b.metrics.userEngagement - a.metrics.userEngagement)
                  .slice(0, 5)
                  .map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <span className="text-sm">{item.region} {item.city}</span>
                      </div>
                      <span className="font-medium">{item.metrics.userEngagement.toFixed(1)}%</span>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">收入排行</h4>
              <div className="space-y-2">
                {performanceList
                  .sort((a, b) => b.metrics.revenuePerUser - a.metrics.revenuePerUser)
                  .slice(0, 5)
                  .map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <span className="text-sm">{item.region} {item.city}</span>
                      </div>
                      <span className="font-medium">¥{item.metrics.revenuePerUser.toFixed(0)}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}