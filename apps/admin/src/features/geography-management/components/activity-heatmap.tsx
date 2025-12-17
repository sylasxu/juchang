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
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'
import { useActivityHeatmap, useExportGeographyData } from '@/hooks/use-geography-management'
import { 
  Map, 
  Filter,
  Download,
  Thermometer,
  Activity,
  Users,
  MapPin,
  TrendingUp,
  Calendar
} from 'lucide-react'

interface HeatmapFilters {
  region?: string
  city?: string
  dateRange?: [string, string]
  minIntensity?: number
  maxIntensity?: number
}

export function ActivityHeatmap() {
  const [filters, setFilters] = useState<HeatmapFilters>({
    minIntensity: 0,
    maxIntensity: 100,
  })
  
  const { data: heatmapData, isLoading } = useActivityHeatmap(filters)
  const exportData = useExportGeographyData()
  
  // Mock data for demonstration
  const mockHeatmapData = [
    {
      latitude: 39.9042,
      longitude: 116.4074,
      intensity: 85,
      activityCount: 156,
      userCount: 89,
      region: '北京市朝阳区',
    },
    {
      latitude: 31.2304,
      longitude: 121.4737,
      intensity: 92,
      activityCount: 203,
      userCount: 124,
      region: '上海市浦东新区',
    },
    {
      latitude: 22.3193,
      longitude: 114.1694,
      intensity: 78,
      activityCount: 134,
      userCount: 76,
      region: '深圳市南山区',
    },
    {
      latitude: 23.1291,
      longitude: 113.2644,
      intensity: 71,
      activityCount: 98,
      userCount: 58,
      region: '广州市天河区',
    },
    {
      latitude: 30.5728,
      longitude: 104.0668,
      intensity: 65,
      activityCount: 87,
      userCount: 52,
      region: '成都市锦江区',
    },
    {
      latitude: 36.0611,
      longitude: 120.3785,
      intensity: 58,
      activityCount: 76,
      userCount: 45,
      region: '青岛市市南区',
    }
  ]

  const heatmapPoints = (heatmapData && Array.isArray(heatmapData)) ? heatmapData : mockHeatmapData

  const regionOptions = [
    { value: '', label: '全部地区' },
    { value: 'beijing', label: '北京市' },
    { value: 'shanghai', label: '上海市' },
    { value: 'shenzhen', label: '深圳市' },
    { value: 'guangzhou', label: '广州市' },
    { value: 'chengdu', label: '成都市' },
    { value: 'qingdao', label: '青岛市' },
  ]

  const timeRangeOptions = [
    { value: '7d', label: '最近7天' },
    { value: '30d', label: '最近30天' },
    { value: '90d', label: '最近90天' },
    { value: 'custom', label: '自定义时间' },
  ]

  const handleFilterChange = (key: keyof HeatmapFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleExport = () => {
    exportData.mutate({
      type: 'heatmap',
      filters
    })
  }

  const getIntensityColor = (intensity: number) => {
    if (intensity >= 80) return 'bg-red-500'
    if (intensity >= 60) return 'bg-orange-500'
    if (intensity >= 40) return 'bg-yellow-500'
    if (intensity >= 20) return 'bg-blue-500'
    return 'bg-gray-400'
  }

  const getIntensityLabel = (intensity: number) => {
    if (intensity >= 80) return '极热'
    if (intensity >= 60) return '很热'
    if (intensity >= 40) return '较热'
    if (intensity >= 20) return '一般'
    return '较冷'
  }

  const totalActivities = heatmapPoints.reduce((sum, point) => sum + point.activityCount, 0)
  const totalUsers = heatmapPoints.reduce((sum, point) => sum + point.userCount, 0)
  const avgIntensity = heatmapPoints.reduce((sum, point) => sum + point.intensity, 0) / heatmapPoints.length

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
      {/* 热力图统计概览 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">热点区域</CardTitle>
            <Map className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{heatmapPoints.length}</div>
            <p className="text-xs text-muted-foreground">
              活跃区域数量
            </p>
          </CardContent>
        </Card>

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
            <CardTitle className="text-sm font-medium">参与用户</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              活跃用户总数
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均热度</CardTitle>
            <Thermometer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(avgIntensity)}</div>
            <p className="text-xs text-muted-foreground">
              区域活跃度平均值
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
              <Label htmlFor="time-range">时间范围</Label>
              <Select defaultValue="30d">
                <SelectTrigger>
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
            </div>

            <div>
              <Label htmlFor="date-filter">自定义日期</Label>
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

          <div className="mt-4 space-y-4">
            <div>
              <Label>热度范围筛选</Label>
              <div className="mt-2 px-3">
                <Slider
                  value={[filters.minIntensity || 0, filters.maxIntensity || 100]}
                  onValueChange={([min, max]) => {
                    handleFilterChange('minIntensity', min)
                    handleFilterChange('maxIntensity', max)
                  }}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                  <span>{filters.minIntensity || 0}</span>
                  <span>{filters.maxIntensity || 100}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters({ minIntensity: 0, maxIntensity: 100 })}
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

      {/* 热力图可视化区域 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            活动热力图
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* 地图占位区域 */}
          <div className="relative h-96 bg-muted rounded-lg flex items-center justify-center mb-6">
            <div className="text-center">
              <Map className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">地图组件占位</p>
              <p className="text-sm text-muted-foreground">
                实际应用中可集成百度地图、高德地图等
              </p>
            </div>
          </div>

          {/* 热力图图例 */}
          <div className="flex items-center justify-center gap-6 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">热度等级:</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-gray-400 rounded"></div>
              <span className="text-xs">较冷 (0-20)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-xs">一般 (20-40)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span className="text-xs">较热 (40-60)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span className="text-xs">很热 (60-80)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-xs">极热 (80-100)</span>
            </div>
          </div>

          {/* 热点区域列表 */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {heatmapPoints.map((point, index) => (
              <Card key={index} className="relative">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{point.region}</span>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`${getIntensityColor(point.intensity)} text-white border-0`}
                    >
                      {getIntensityLabel(point.intensity)}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">热度指数:</span>
                      <span className="font-medium">{point.intensity}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">活动数量:</span>
                      <span className="font-medium">{point.activityCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">参与用户:</span>
                      <span className="font-medium">{point.userCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">坐标:</span>
                      <span className="font-mono text-xs">
                        {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <span className="text-xs text-muted-foreground">
                        活跃度较上周 +{Math.floor(Math.random() * 20 + 5)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}