import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { 
  Calendar,
  MapPin,
  Users,
  AlertTriangle,
  Eye,
  EyeOff,
  Flag,
  Trash2,
  MoreHorizontal,
  Filter,
  Search,
  Download
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { ModerationDialog } from './moderation-dialog'
import { useDebouncedSearch } from '@/hooks/use-debounced-search'

// 模拟 API 调用 - 实际应该使用 Eden Treaty
const fetchActivities = async (_filters: any) => {
  // TODO: 使用 Eden Treaty 调用 /admin/activities API
  return {
    data: [
      {
        id: '1',
        title: '周末爬山活动',
        type: 'sports',
        status: 'published',
        riskLevel: 'low',
        startAt: new Date('2024-01-20T09:00:00'),
        maxParticipants: 8,
        currentParticipants: 5,
        locationName: '南山公园',
        creatorInfo: {
          id: 'user1',
          nickname: '户外达人',
          avatarUrl: '/avatars/user1.jpg',
          phoneNumber: '138****1234'
        },
        participantCount: 5,
        reportCount: 0,
        riskScore: 15,
        isGhost: false,
        isBoosted: true,
        isPinPlus: false,
        createdAt: new Date('2024-01-15T10:00:00')
      },
      {
        id: '2',
        title: '美食探店聚会',
        type: 'food',
        status: 'published',
        riskLevel: 'medium',
        startAt: new Date('2024-01-21T18:00:00'),
        maxParticipants: 6,
        currentParticipants: 4,
        locationName: '解放碑商圈',
        creatorInfo: {
          id: 'user2',
          nickname: '美食家',
          avatarUrl: '/avatars/user2.jpg',
          phoneNumber: '139****5678'
        },
        participantCount: 4,
        reportCount: 1,
        riskScore: 45,
        isGhost: false,
        isBoosted: false,
        isPinPlus: true,
        createdAt: new Date('2024-01-16T14:30:00')
      }
    ],
    total: 2,
    page: 1,
    limit: 20,
    hasMore: false
  }
}

const getStatusBadge = (status: string) => {
  const variants = {
    published: 'default',
    hidden: 'secondary',
    removed: 'destructive',
    finished: 'outline'
  } as const

  const labels = {
    published: '已发布',
    hidden: '已隐藏',
    removed: '已删除',
    finished: '已完成'
  }

  return (
    <Badge variant={variants[status as keyof typeof variants] || 'default'}>
      {labels[status as keyof typeof labels] || status}
    </Badge>
  )
}

const getRiskBadge = (riskLevel: string, riskScore: number) => {
  const variants = {
    low: 'default',
    medium: 'secondary',
    high: 'destructive'
  } as const

  const labels = {
    low: '低风险',
    medium: '中风险',
    high: '高风险'
  }

  return (
    <Badge variant={variants[riskLevel as keyof typeof variants] || 'default'}>
      {labels[riskLevel as keyof typeof labels] || riskLevel} ({riskScore})
    </Badge>
  )
}

const getTypeBadge = (type: string) => {
  const labels = {
    food: '美食',
    sports: '运动',
    entertainment: '娱乐',
    study: '学习',
    other: '其他'
  }

  return (
    <Badge variant="outline">
      {labels[type as keyof typeof labels] || type}
    </Badge>
  )
}

export function ActivityListPage() {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [moderationDialog, setModerationDialog] = useState<{
    open: boolean
    activity?: any
  }>({ open: false })
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    riskLevel: '',
    isGhost: undefined as boolean | undefined,
    page: 1,
    limit: 20
  })

  // 使用防抖搜索 hook
  const { inputProps, debouncedValue: searchValue } = useDebouncedSearch({
    delay: 300,
  })

  const { data: activitiesData, isLoading, refetch } = useQuery({
    queryKey: ['admin-activities', { ...filters, search: searchValue }],
    queryFn: () => fetchActivities({ ...filters, search: searchValue })
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(activitiesData?.data.map(a => a.id) || [])
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id])
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id))
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedIds.length === 0) {
      toast.error('请先选择要操作的活动')
      return
    }

    // TODO: 实现批量操作 API 调用
    console.log('批量操作:', action, selectedIds)
    toast.success(`已对 ${selectedIds.length} 个活动执行${action}操作`)
    setSelectedIds([])
    refetch()
  }

  const handleSingleAction = async (activity: any, action: string) => {
    if (action === 'moderate') {
      setModerationDialog({ open: true, activity })
    } else {
      // TODO: 实现单个操作 API 调用
      console.log('单个操作:', action, activity.id)
      toast.success(`活动操作成功: ${action}`)
      refetch()
    }
  }

  const handleModerationConfirm = async (action: string, reason: string, notes?: string) => {
    // TODO: 实现审核 API 调用
    console.log('审核操作:', { action, reason, notes, activityId: moderationDialog.activity?.id })
    toast.success(`审核操作成功: ${action}`)
    refetch()
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">活动管理</h1>
          <p className="text-muted-foreground">
            管理平台上的所有活动，支持审核、筛选和批量操作
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            导出数据
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总活动数</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">
              +12% 较上月
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待审核</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">
              需要处理
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">高风险活动</CardTitle>
            <Flag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              需要关注
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日新增</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground">
              +5% 较昨日
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 筛选和搜索 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">筛选条件</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-6">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索活动标题、地点..."
                  {...inputProps}
                  className="pl-8"
                />
              </div>
            </div>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="活动状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部状态</SelectItem>
                <SelectItem value="published">已发布</SelectItem>
                <SelectItem value="hidden">已隐藏</SelectItem>
                <SelectItem value="removed">已删除</SelectItem>
                <SelectItem value="finished">已完成</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.type}
              onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="活动类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部类型</SelectItem>
                <SelectItem value="food">美食</SelectItem>
                <SelectItem value="sports">运动</SelectItem>
                <SelectItem value="entertainment">娱乐</SelectItem>
                <SelectItem value="study">学习</SelectItem>
                <SelectItem value="other">其他</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.riskLevel}
              onValueChange={(value) => setFilters(prev => ({ ...prev, riskLevel: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="风险等级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部风险</SelectItem>
                <SelectItem value="low">低风险</SelectItem>
                <SelectItem value="medium">中风险</SelectItem>
                <SelectItem value="high">高风险</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => setFilters({
                status: '',
                type: '',
                riskLevel: '',
                isGhost: undefined,
                page: 1,
                limit: 20
              })}
            >
              <Filter className="h-4 w-4 mr-2" />
              重置
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 批量操作 */}
      {selectedIds.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                已选择 {selectedIds.length} 个活动
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction('approve')}
              >
                批量批准
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction('hide')}
              >
                批量隐藏
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleBulkAction('remove')}
              >
                批量删除
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 活动列表 */}
      <Card>
        <CardHeader>
          <CardTitle>活动列表</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedIds.length === activitiesData?.data.length && activitiesData?.data.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>活动标题</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>地点</TableHead>
                <TableHead>创建者</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>风险等级</TableHead>
                <TableHead>参与情况</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="w-12">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    加载中...
                  </TableCell>
                </TableRow>
              ) : activitiesData?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    暂无数据
                  </TableCell>
                </TableRow>
              ) : (
                activitiesData?.data.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(activity.id)}
                        onCheckedChange={(checked) => handleSelectItem(activity.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => window.location.href = `/activities/${activity.id}`}
                        className="font-medium hover:underline text-left"
                      >
                        {activity.title}
                      </button>
                    </TableCell>
                    <TableCell>
                      {getTypeBadge(activity.type)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-3 w-3" />
                        {activity.locationName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{activity.creatorInfo.nickname}</div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(activity.status)}
                    </TableCell>
                    <TableCell>
                      {getRiskBadge(activity.riskLevel, activity.riskScore)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {activity.currentParticipants}/{activity.maxParticipants}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {activity.createdAt.toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>操作</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => window.location.href = `/activities/${activity.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            查看详情
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleSingleAction(activity, 'moderate')}>
                            <Flag className="h-4 w-4 mr-2" />
                            审核操作
                          </DropdownMenuItem>
                          {activity.status === 'published' ? (
                            <DropdownMenuItem onClick={() => handleSingleAction(activity, 'hide')}>
                              <EyeOff className="h-4 w-4 mr-2" />
                              快速隐藏
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleSingleAction(activity, 'approve')}>
                              <Eye className="h-4 w-4 mr-2" />
                              快速恢复
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleSingleAction(activity, 'remove')}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            删除活动
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 审核对话框 */}
      <ModerationDialog
        open={moderationDialog.open}
        onOpenChange={(open) => setModerationDialog({ open, activity: open ? moderationDialog.activity : undefined })}
        activity={moderationDialog.activity}
        onConfirm={handleModerationConfirm}
      />
    </div>
  )
}