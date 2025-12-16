import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { 
  MapPin,
  Plus,
  Eye,
  Trash2,
  MoreHorizontal,
  Filter,
  Search,
  Lightbulb,
  Target
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

// 模拟 API 调用
const fetchGhostActivities = async (filters: any) => {
  return {
    data: [
      {
        id: '1',
        title: '美食热门区域',
        locationName: '解放碑商圈',
        address: '重庆市渝中区解放碑步行街',
        ghostAnchorType: 'demand',
        ghostSuggestedType: 'food',
        location: [106.5516, 29.5239] as [number, number],
        createdAt: new Date('2024-01-15T10:00:00'),
        // 统计信息
        triggeredActivities: 12,
        lastTriggered: new Date('2024-01-19T15:30:00')
      },
      {
        id: '2',
        title: '运动推广锚点',
        locationName: '奥体中心',
        address: '重庆市九龙坡区奥体中心',
        ghostAnchorType: 'promotion',
        ghostSuggestedType: 'sports',
        location: [106.4516, 29.5139] as [number, number],
        createdAt: new Date('2024-01-16T14:00:00'),
        triggeredActivities: 8,
        lastTriggered: new Date('2024-01-18T09:00:00')
      }
    ],
    total: 2,
    page: 1,
    limit: 20,
    hasMore: false
  }
}

const getAnchorTypeBadge = (type: string) => {
  const variants = {
    demand: 'default',
    promotion: 'secondary'
  } as const

  const labels = {
    demand: '需求引导',
    promotion: '推广锚点'
  }

  return (
    <Badge variant={variants[type as keyof typeof variants] || 'default'}>
      {labels[type as keyof typeof labels] || type}
    </Badge>
  )
}

const getSuggestedTypeBadge = (type: string) => {
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

export function GhostActivityPage() {
  const [filters, setFilters] = useState({
    search: '',
    anchorType: '',
    suggestedType: '',
    page: 1,
    limit: 20
  })
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newGhost, setNewGhost] = useState({
    title: '',
    locationName: '',
    address: '',
    locationHint: '',
    ghostAnchorType: 'demand',
    ghostSuggestedType: 'food',
    description: ''
  })

  const { data: ghostData, isLoading, refetch } = useQuery({
    queryKey: ['ghost-activities', filters],
    queryFn: () => fetchGhostActivities(filters)
  })

  const handleCreateGhost = async () => {
    try {
      // TODO: 实现创建锚点 API 调用
      console.log('创建锚点:', newGhost)
      toast.success('锚点活动创建成功')
      setIsCreateDialogOpen(false)
      setNewGhost({
        title: '',
        locationName: '',
        address: '',
        locationHint: '',
        ghostAnchorType: 'demand',
        ghostSuggestedType: 'food',
        description: ''
      })
      refetch()
    } catch (error) {
      toast.error('创建失败')
    }
  }

  const handleDeleteGhost = async (id: string) => {
    try {
      // TODO: 实现删除锚点 API 调用
      console.log('删除锚点:', id)
      toast.success('锚点活动删除成功')
      refetch()
    } catch (error) {
      toast.error('删除失败')
    }
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">锚点活动管理</h1>
          <p className="text-muted-foreground">
            管理幽灵锚点，引导用户在特定区域创建活动
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              创建锚点
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>创建锚点活动</DialogTitle>
              <DialogDescription>
                在地图上创建幽灵锚点，引导用户在特定区域创建活动
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  标题
                </Label>
                <Input
                  id="title"
                  value={newGhost.title}
                  onChange={(e) => setNewGhost(prev => ({ ...prev, title: e.target.value }))}
                  className="col-span-3"
                  placeholder="锚点标题"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="locationName" className="text-right">
                  地点名称
                </Label>
                <Input
                  id="locationName"
                  value={newGhost.locationName}
                  onChange={(e) => setNewGhost(prev => ({ ...prev, locationName: e.target.value }))}
                  className="col-span-3"
                  placeholder="地点名称"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right">
                  详细地址
                </Label>
                <Input
                  id="address"
                  value={newGhost.address}
                  onChange={(e) => setNewGhost(prev => ({ ...prev, address: e.target.value }))}
                  className="col-span-3"
                  placeholder="详细地址"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="anchorType" className="text-right">
                  锚点类型
                </Label>
                <Select
                  value={newGhost.ghostAnchorType}
                  onValueChange={(value) => setNewGhost(prev => ({ ...prev, ghostAnchorType: value }))}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="demand">需求引导</SelectItem>
                    <SelectItem value="promotion">推广锚点</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="suggestedType" className="text-right">
                  建议类型
                </Label>
                <Select
                  value={newGhost.ghostSuggestedType}
                  onValueChange={(value) => setNewGhost(prev => ({ ...prev, ghostSuggestedType: value }))}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="food">美食</SelectItem>
                    <SelectItem value="sports">运动</SelectItem>
                    <SelectItem value="entertainment">娱乐</SelectItem>
                    <SelectItem value="study">学习</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  描述
                </Label>
                <Textarea
                  id="description"
                  value={newGhost.description}
                  onChange={(e) => setNewGhost(prev => ({ ...prev, description: e.target.value }))}
                  className="col-span-3"
                  placeholder="锚点描述"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleCreateGhost}>
                创建锚点
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总锚点数</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              活跃锚点
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">触发活动</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">
              本月触发
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">需求引导</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground">
              需求类锚点
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">推广锚点</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6</div>
            <p className="text-xs text-muted-foreground">
              推广类锚点
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
          <div className="grid gap-4 md:grid-cols-5">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索锚点标题、地点..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-8"
                />
              </div>
            </div>
            <Select
              value={filters.anchorType}
              onValueChange={(value) => setFilters(prev => ({ ...prev, anchorType: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="锚点类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部类型</SelectItem>
                <SelectItem value="demand">需求引导</SelectItem>
                <SelectItem value="promotion">推广锚点</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.suggestedType}
              onValueChange={(value) => setFilters(prev => ({ ...prev, suggestedType: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="建议类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部建议</SelectItem>
                <SelectItem value="food">美食</SelectItem>
                <SelectItem value="sports">运动</SelectItem>
                <SelectItem value="entertainment">娱乐</SelectItem>
                <SelectItem value="study">学习</SelectItem>
                <SelectItem value="other">其他</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => setFilters({
                search: '',
                anchorType: '',
                suggestedType: '',
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

      {/* 锚点列表 */}
      <Card>
        <CardHeader>
          <CardTitle>锚点列表</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>锚点信息</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>建议活动</TableHead>
                <TableHead>触发统计</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="w-12">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    加载中...
                  </TableCell>
                </TableRow>
              ) : ghostData?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    暂无锚点数据
                  </TableCell>
                </TableRow>
              ) : (
                ghostData?.data.map((ghost) => (
                  <TableRow key={ghost.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{ghost.title}</div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {ghost.locationName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {ghost.address}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getAnchorTypeBadge(ghost.ghostAnchorType)}
                    </TableCell>
                    <TableCell>
                      {getSuggestedTypeBadge(ghost.ghostSuggestedType)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {ghost.triggeredActivities} 次触发
                        </div>
                        <div className="text-xs text-muted-foreground">
                          最后: {ghost.lastTriggered.toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {ghost.createdAt.toLocaleDateString()}
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
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            查看详情
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteGhost(ghost.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            删除锚点
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
    </div>
  )
}