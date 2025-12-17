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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  useLocationData, 
  useLocationVerifications, 
  useVerifyLocation,
  useBatchVerifyLocations 
} from '@/hooks/use-geography-management'
import { 
  MapPin, 
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Eye,
  Satellite,
  Navigation,
  Calendar
} from 'lucide-react'

interface LocationFilters {
  status?: string
  source?: string
  accuracy?: number
  region?: string
  page?: number
  limit?: number
}

export function LocationManagement() {
  const [filters, setFilters] = useState<LocationFilters>({
    page: 1,
    limit: 20,
  })
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  
  const { data: locationData, isLoading: locationsLoading } = useLocationData(filters)
  const { data: verificationData, isLoading: verificationsLoading } = useLocationVerifications(filters)
  const verifyLocation = useVerifyLocation()
  const batchVerify = useBatchVerifyLocations()
  
  // Mock data for demonstration
  const mockLocationData = [
    {
      id: '1',
      latitude: 39.9042,
      longitude: 116.4074,
      address: '北京市朝阳区建国门外大街1号',
      city: '北京市',
      district: '朝阳区',
      province: '北京市',
      country: '中国',
      isVerified: true,
      accuracy: 95.6,
      source: 'gps' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      latitude: 31.2304,
      longitude: 121.4737,
      address: '上海市浦东新区陆家嘴环路1000号',
      city: '上海市',
      district: '浦东新区',
      province: '上海市',
      country: '中国',
      isVerified: false,
      accuracy: 78.3,
      source: 'ip' as const,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '3',
      latitude: 22.3193,
      longitude: 114.1694,
      address: '深圳市南山区深南大道9988号',
      city: '深圳市',
      district: '南山区',
      province: '广东省',
      country: '中国',
      isVerified: true,
      accuracy: 89.2,
      source: 'gps' as const,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString(),
    }
  ]

  const mockVerificationData = [
    {
      id: '1',
      originalLocation: mockLocationData[1],
      status: 'pending' as const,
      confidence: 78.3,
      issues: ['IP定位精度较低', '地址信息不完整'],
      verifiedBy: undefined,
      verifiedAt: undefined,
    },
    {
      id: '2',
      originalLocation: mockLocationData[0],
      verifiedLocation: mockLocationData[0],
      status: 'verified' as const,
      confidence: 95.6,
      issues: [],
      verifiedBy: 'admin_001',
      verifiedAt: new Date(Date.now() - 1800000).toISOString(),
    }
  ]

  const locations = (locationData && Array.isArray(locationData)) ? locationData : mockLocationData
  const verifications = (verificationData && Array.isArray(verificationData)) ? verificationData : mockVerificationData

  const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'pending', label: '待验证' },
    { value: 'verified', label: '已验证' },
    { value: 'rejected', label: '已拒绝' },
    { value: 'suspicious', label: '可疑' },
  ]

  const sourceOptions = [
    { value: '', label: '全部来源' },
    { value: 'gps', label: 'GPS定位' },
    { value: 'ip', label: 'IP定位' },
    { value: 'manual', label: '手动输入' },
  ]

  const handleFilterChange = (key: keyof LocationFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  const handleVerifyLocation = async (id: string, status: 'verified' | 'rejected', issues?: string[]) => {
    try {
      await verifyLocation.mutateAsync({
        id,
        verification: { status, issues }
      })
    } catch (error) {
      console.error('验证位置失败:', error)
    }
  }

  const handleBatchVerify = async (action: 'verify' | 'reject') => {
    if (selectedLocations.length === 0) return
    
    try {
      await batchVerify.mutateAsync({
        locationIds: selectedLocations,
        action
      })
      setSelectedLocations([])
    } catch (error) {
      console.error('批量处理失败:', error)
    }
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'gps': return Satellite
      case 'ip': return Navigation
      case 'manual': return MapPin
      default: return MapPin
    }
  }

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'gps': return 'text-green-600'
      case 'ip': return 'text-blue-600'
      case 'manual': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }



  const getAccuracyLevel = (accuracy: number) => {
    if (accuracy >= 90) return { label: '高精度', color: 'bg-green-500' }
    if (accuracy >= 70) return { label: '中精度', color: 'bg-yellow-500' }
    return { label: '低精度', color: 'bg-red-500' }
  }

  if (locationsLoading || verificationsLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
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
      {/* 位置数据统计概览 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总位置数</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{locations.length}</div>
            <p className="text-xs text-muted-foreground">
              位置数据总数
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已验证</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {locations.filter(l => l.isVerified).length}
            </div>
            <p className="text-xs text-muted-foreground">
              验证通过的位置
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待验证</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {verifications.filter(v => v.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">
              等待验证的位置
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">高精度</CardTitle>
            <Satellite className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {locations.filter(l => l.accuracy >= 90).length}
            </div>
            <p className="text-xs text-muted-foreground">
              精度≥90%的位置
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
              <Label htmlFor="status-filter">验证状态</Label>
              <Select
                value={filters.status || ''}
                onValueChange={(value) => handleFilterChange('status', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="source-filter">位置来源</Label>
              <Select
                value={filters.source || ''}
                onValueChange={(value) => handleFilterChange('source', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择来源" />
                </SelectTrigger>
                <SelectContent>
                  {sourceOptions.map((source) => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="accuracy-filter">最小精度</Label>
              <Input
                id="accuracy-filter"
                type="number"
                min="0"
                max="100"
                placeholder="输入最小精度"
                value={filters.accuracy || ''}
                onChange={(e) => handleFilterChange('accuracy', e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </div>

            <div>
              <Label htmlFor="region-filter">地区筛选</Label>
              <Input
                id="region-filter"
                placeholder="输入地区名称"
                value={filters.region || ''}
                onChange={(e) => handleFilterChange('region', e.target.value || undefined)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters({ page: 1, limit: 20 })}
            >
              重置筛选
            </Button>
            {selectedLocations.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBatchVerify('verify')}
                  disabled={batchVerify.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  批量验证 ({selectedLocations.length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBatchVerify('reject')}
                  disabled={batchVerify.isPending}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  批量拒绝 ({selectedLocations.length})
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 位置数据表格 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            位置数据管理
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedLocations.length === locations.length}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedLocations(locations.map(l => l.id))
                      } else {
                        setSelectedLocations([])
                      }
                    }}
                  />
                </TableHead>
                <TableHead>位置信息</TableHead>
                <TableHead>坐标</TableHead>
                <TableHead>精度</TableHead>
                <TableHead>来源</TableHead>
                <TableHead>验证状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map((location) => {
                const SourceIcon = getSourceIcon(location.source)
                const accuracyLevel = getAccuracyLevel(location.accuracy)
                
                return (
                  <TableRow key={location.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedLocations.includes(location.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedLocations([...selectedLocations, location.id])
                          } else {
                            setSelectedLocations(selectedLocations.filter(id => id !== location.id))
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{location.address}</div>
                        <div className="text-sm text-muted-foreground">
                          {location.province} {location.city} {location.district}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm">
                        <div>{location.latitude.toFixed(6)}</div>
                        <div>{location.longitude.toFixed(6)}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`${accuracyLevel.color} text-white border-0`}>
                          {accuracyLevel.label}
                        </Badge>
                        <span className="text-sm">{location.accuracy.toFixed(1)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-1 ${getSourceColor(location.source)}`}>
                        <SourceIcon className="h-4 w-4" />
                        <span className="text-sm capitalize">{location.source}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={location.isVerified ? 'default' : 'secondary'}>
                        {location.isVerified ? '已验证' : '未验证'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(location.createdAt).toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>位置详情</DialogTitle>
                              <DialogDescription>
                                查看位置的详细信息和验证状态
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium">完整地址</Label>
                                  <div className="text-sm text-muted-foreground">
                                    {location.address}
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">行政区划</Label>
                                  <div className="text-sm text-muted-foreground">
                                    {location.country} / {location.province} / {location.city} / {location.district}
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">坐标信息</Label>
                                  <div className="text-sm text-muted-foreground font-mono">
                                    纬度: {location.latitude}<br />
                                    经度: {location.longitude}
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">精度信息</Label>
                                  <div className="text-sm text-muted-foreground">
                                    {location.accuracy.toFixed(2)}% ({accuracyLevel.label})
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">位置来源</Label>
                                  <div className="text-sm text-muted-foreground">
                                    {location.source === 'gps' ? 'GPS定位' : 
                                     location.source === 'ip' ? 'IP定位' : '手动输入'}
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">验证状态</Label>
                                  <div className="text-sm text-muted-foreground">
                                    {location.isVerified ? '已验证' : '未验证'}
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <Label className="text-sm font-medium">时间信息</Label>
                                <div className="text-sm text-muted-foreground">
                                  创建时间: {new Date(location.createdAt).toLocaleString()}<br />
                                  更新时间: {new Date(location.updatedAt).toLocaleString()}
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        {!location.isVerified && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleVerifyLocation(location.id, 'verified')}
                              disabled={verifyLocation.isPending}
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleVerifyLocation(location.id, 'rejected', ['位置信息不准确'])}
                              disabled={verifyLocation.isPending}
                            >
                              <XCircle className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}