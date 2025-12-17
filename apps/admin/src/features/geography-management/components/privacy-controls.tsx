import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { usePrivacyControls, useUpdatePrivacyControl } from '@/hooks/use-geography-management'
import { 
  Shield, 
  Edit,
  Eye,
  EyeOff,
  Users,
  Globe,
  Lock,
  MapPin,
  Calendar,
  Settings,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

interface PrivacyFormData {
  locationSharing: 'public' | 'friends' | 'private'
  precisionLevel: 'exact' | 'approximate' | 'city_only'
  allowAnalytics: boolean
  allowHeatmap: boolean
  dataRetentionDays: number
}

export function PrivacyControls() {
  const { data: privacyData, isLoading } = usePrivacyControls()
  const updatePrivacyControl = useUpdatePrivacyControl()
  
  const [editingUser, setEditingUser] = useState<any>(null)
  const [formData, setFormData] = useState<PrivacyFormData>({
    locationSharing: 'public',
    precisionLevel: 'exact',
    allowAnalytics: true,
    allowHeatmap: true,
    dataRetentionDays: 365,
  })

  // Mock data for demonstration
  const mockPrivacyData = [
    {
      id: '1',
      userId: 'user_001',
      userInfo: {
        id: 'user_001',
        nickname: '张三',
        phoneNumber: '138****1234',
        membershipLevel: 'premium'
      },
      locationSharing: 'public' as const,
      precisionLevel: 'exact' as const,
      allowAnalytics: true,
      allowHeatmap: true,
      dataRetentionDays: 365,
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      userId: 'user_002',
      userInfo: {
        id: 'user_002',
        nickname: '李四',
        phoneNumber: '139****5678',
        membershipLevel: 'basic'
      },
      locationSharing: 'friends' as const,
      precisionLevel: 'approximate' as const,
      allowAnalytics: false,
      allowHeatmap: false,
      dataRetentionDays: 90,
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '3',
      userId: 'user_003',
      userInfo: {
        id: 'user_003',
        nickname: '王五',
        phoneNumber: '137****9012',
        membershipLevel: 'basic'
      },
      locationSharing: 'private' as const,
      precisionLevel: 'city_only' as const,
      allowAnalytics: true,
      allowHeatmap: false,
      dataRetentionDays: 30,
      updatedAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: '4',
      userId: 'user_004',
      userInfo: {
        id: 'user_004',
        nickname: '赵六',
        phoneNumber: '136****3456',
        membershipLevel: 'premium'
      },
      locationSharing: 'public' as const,
      precisionLevel: 'approximate' as const,
      allowAnalytics: true,
      allowHeatmap: true,
      dataRetentionDays: 730,
      updatedAt: new Date(Date.now() - 10800000).toISOString(),
    }
  ]

  const privacyList = (privacyData && Array.isArray(privacyData)) ? privacyData : mockPrivacyData

  const sharingOptions = [
    { value: 'public', label: '公开', icon: Globe, color: 'text-green-600', description: '所有用户可见' },
    { value: 'friends', label: '好友', icon: Users, color: 'text-blue-600', description: '仅好友可见' },
    { value: 'private', label: '私密', icon: Lock, color: 'text-red-600', description: '仅自己可见' },
  ]

  const precisionOptions = [
    { value: 'exact', label: '精确位置', icon: MapPin, description: '显示准确坐标' },
    { value: 'approximate', label: '大致位置', icon: MapPin, description: '模糊化处理' },
    { value: 'city_only', label: '仅显示城市', icon: MapPin, description: '只显示城市信息' },
  ]

  const retentionOptions = [
    { value: 30, label: '30天' },
    { value: 90, label: '90天' },
    { value: 180, label: '180天' },
    { value: 365, label: '1年' },
    { value: 730, label: '2年' },
  ]

  const handleEdit = (privacy: any) => {
    setEditingUser(privacy)
    setFormData({
      locationSharing: privacy.locationSharing,
      precisionLevel: privacy.precisionLevel,
      allowAnalytics: privacy.allowAnalytics,
      allowHeatmap: privacy.allowHeatmap,
      dataRetentionDays: privacy.dataRetentionDays,
    })
  }

  const handleSave = async () => {
    if (!editingUser) return
    
    try {
      await updatePrivacyControl.mutateAsync({
        userId: editingUser.userId,
        settings: formData,
      })
      setEditingUser(null)
    } catch (error) {
      console.error('更新隐私设置失败:', error)
    }
  }

  const getSharingInfo = (sharing: string) => {
    return sharingOptions.find(s => s.value === sharing) || sharingOptions[0]
  }

  const getPrecisionInfo = (precision: string) => {
    return precisionOptions.find(p => p.value === precision) || precisionOptions[0]
  }

  const getPrivacyScore = (privacy: any) => {
    let score = 0
    if (privacy.locationSharing === 'private') score += 40
    else if (privacy.locationSharing === 'friends') score += 20
    
    if (privacy.precisionLevel === 'city_only') score += 30
    else if (privacy.precisionLevel === 'approximate') score += 15
    
    if (!privacy.allowAnalytics) score += 15
    if (!privacy.allowHeatmap) score += 15
    
    return Math.min(score, 100)
  }

  const getPrivacyLevel = (score: number) => {
    if (score >= 80) return { label: '高隐私', color: 'bg-green-500', icon: Shield }
    if (score >= 50) return { label: '中隐私', color: 'bg-yellow-500', icon: AlertTriangle }
    return { label: '低隐私', color: 'bg-red-500', icon: Eye }
  }

  // 统计数据
  const publicUsers = privacyList.filter(p => p.locationSharing === 'public').length
  const privateUsers = privacyList.filter(p => p.locationSharing === 'private').length
  const analyticsEnabled = privacyList.filter(p => p.allowAnalytics).length
  const heatmapEnabled = privacyList.filter(p => p.allowHeatmap).length

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
      {/* 隐私控制统计概览 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">公开位置</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publicUsers}</div>
            <p className="text-xs text-muted-foreground">
              {((publicUsers / privacyList.length) * 100).toFixed(1)}% 用户公开位置
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">私密位置</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{privateUsers}</div>
            <p className="text-xs text-muted-foreground">
              {((privateUsers / privacyList.length) * 100).toFixed(1)}% 用户私密设置
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">允许分析</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsEnabled}</div>
            <p className="text-xs text-muted-foreground">
              {((analyticsEnabled / privacyList.length) * 100).toFixed(1)}% 允许数据分析
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">允许热力图</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{heatmapEnabled}</div>
            <p className="text-xs text-muted-foreground">
              {((heatmapEnabled / privacyList.length) * 100).toFixed(1)}% 参与热力图
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 隐私设置管理 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            用户隐私控制
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>用户信息</TableHead>
                <TableHead>位置分享</TableHead>
                <TableHead>精度级别</TableHead>
                <TableHead>数据使用</TableHead>
                <TableHead>隐私等级</TableHead>
                <TableHead>数据保留</TableHead>
                <TableHead>更新时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {privacyList.map((privacy) => {
                const sharingInfo = getSharingInfo(privacy.locationSharing)
                const precisionInfo = getPrecisionInfo(privacy.precisionLevel)
                const privacyScore = getPrivacyScore(privacy)
                const privacyLevel = getPrivacyLevel(privacyScore)
                const SharingIcon = sharingInfo.icon
                const PrecisionIcon = precisionInfo.icon
                const PrivacyIcon = privacyLevel.icon
                
                return (
                  <TableRow key={privacy.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-medium">{privacy.userInfo.nickname}</div>
                          <div className="text-sm text-muted-foreground">
                            {privacy.userInfo.phoneNumber}
                          </div>
                          <Badge variant="outline" className="text-xs mt-1">
                            {privacy.userInfo.membershipLevel === 'premium' ? '高级会员' : '普通会员'}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-2 ${sharingInfo.color}`}>
                        <SharingIcon className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{sharingInfo.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {sharingInfo.description}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <PrecisionIcon className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{precisionInfo.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {precisionInfo.description}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {privacy.allowAnalytics ? (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          ) : (
                            <EyeOff className="h-3 w-3 text-red-600" />
                          )}
                          <span className="text-xs">数据分析</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {privacy.allowHeatmap ? (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          ) : (
                            <EyeOff className="h-3 w-3 text-red-600" />
                          )}
                          <span className="text-xs">热力图</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`${privacyLevel.color} text-white border-0`}>
                          <PrivacyIcon className="h-3 w-3 mr-1" />
                          {privacyLevel.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{privacyScore}分</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {privacy.dataRetentionDays}天
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(privacy.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(privacy)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>编辑隐私设置</DialogTitle>
                            <DialogDescription>
                              修改用户 {privacy.userInfo.nickname} 的隐私控制设置
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="location-sharing" className="text-right">
                                位置分享
                              </Label>
                              <Select
                                value={formData.locationSharing}
                                onValueChange={(value: any) => setFormData({ ...formData, locationSharing: value })}
                              >
                                <SelectTrigger className="col-span-3">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {sharingOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      <div className="flex items-center gap-2">
                                        <option.icon className="h-4 w-4" />
                                        <div>
                                          <div>{option.label}</div>
                                          <div className="text-xs text-muted-foreground">
                                            {option.description}
                                          </div>
                                        </div>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="precision-level" className="text-right">
                                精度级别
                              </Label>
                              <Select
                                value={formData.precisionLevel}
                                onValueChange={(value: any) => setFormData({ ...formData, precisionLevel: value })}
                              >
                                <SelectTrigger className="col-span-3">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {precisionOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      <div className="flex items-center gap-2">
                                        <option.icon className="h-4 w-4" />
                                        <div>
                                          <div>{option.label}</div>
                                          <div className="text-xs text-muted-foreground">
                                            {option.description}
                                          </div>
                                        </div>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="allow-analytics" className="text-right">
                                允许数据分析
                              </Label>
                              <Switch
                                id="allow-analytics"
                                checked={formData.allowAnalytics}
                                onCheckedChange={(checked) => setFormData({ ...formData, allowAnalytics: checked })}
                              />
                            </div>
                            
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="allow-heatmap" className="text-right">
                                参与热力图
                              </Label>
                              <Switch
                                id="allow-heatmap"
                                checked={formData.allowHeatmap}
                                onCheckedChange={(checked) => setFormData({ ...formData, allowHeatmap: checked })}
                              />
                            </div>
                            
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="retention-days" className="text-right">
                                数据保留期
                              </Label>
                              <Select
                                value={formData.dataRetentionDays.toString()}
                                onValueChange={(value) => setFormData({ ...formData, dataRetentionDays: parseInt(value) })}
                              >
                                <SelectTrigger className="col-span-3">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {retentionOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value.toString()}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <DialogFooter>
                            <Button
                              type="submit"
                              onClick={handleSave}
                              disabled={updatePrivacyControl.isPending}
                            >
                              保存设置
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 隐私统计图表 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              位置分享分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sharingOptions.map((option) => {
                const count = privacyList.filter(p => p.locationSharing === option.value).length
                const percentage = (count / privacyList.length) * 100
                const OptionIcon = option.icon
                
                return (
                  <div key={option.value} className="flex items-center justify-between">
                    <div className={`flex items-center gap-2 ${option.color}`}>
                      <OptionIcon className="h-4 w-4" />
                      <span className="text-sm">{option.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${option.color.replace('text-', 'bg-')}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">
                        {count} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              隐私等级分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: '高隐私', min: 80, color: 'bg-green-500' },
                { label: '中隐私', min: 50, color: 'bg-yellow-500' },
                { label: '低隐私', min: 0, color: 'bg-red-500' },
              ].map((level) => {
                const count = privacyList.filter(p => {
                  const score = getPrivacyScore(p)
                  return level.min === 80 ? score >= 80 : 
                         level.min === 50 ? score >= 50 && score < 80 : 
                         score < 50
                }).length
                const percentage = (count / privacyList.length) * 100
                
                return (
                  <div key={level.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${level.color}`}></div>
                      <span className="text-sm">{level.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${level.color}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">
                        {count} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}