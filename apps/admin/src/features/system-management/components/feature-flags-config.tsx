import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
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
import { useFeatureFlags, useUpdateFeatureFlag } from '@/hooks/use-system-management'
import { 
  Flag, 
  Edit, 
  Plus,
  Users,
  Percent
} from 'lucide-react'

interface FeatureFlagFormData {
  name: string
  key: string
  isEnabled: boolean
  rolloutPercentage: number
  targetUsers: string[]
  targetGroups: string[]
  description: string
}

export function FeatureFlagsConfig() {
  const { data: flags, isLoading } = useFeatureFlags()

  // Mock data for demonstration
  const mockFlags = [
    {
      id: '1',
      name: 'AI智能推荐',
      key: 'ai_recommendation',
      isEnabled: true,
      rolloutPercentage: 80,
      targetUsers: [],
      targetGroups: ['premium_users'],
      description: 'AI驱动的活动推荐功能',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      name: '实时聊天',
      key: 'real_time_chat',
      isEnabled: false,
      rolloutPercentage: 0,
      targetUsers: [],
      targetGroups: [],
      description: '活动实时聊天功能',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ]

  const flagsData = (flags && Array.isArray(flags)) ? flags : mockFlags
  const updateFlag = useUpdateFeatureFlag()
  
  const [editingFlag, setEditingFlag] = useState<any>(null)
  const [formData, setFormData] = useState<FeatureFlagFormData>({
    name: '',
    key: '',
    isEnabled: false,
    rolloutPercentage: 0,
    targetUsers: [],
    targetGroups: [],
    description: '',
  })

  const handleEdit = (flag: any) => {
    setEditingFlag(flag)
    setFormData({
      name: flag.name,
      key: flag.key,
      isEnabled: flag.isEnabled,
      rolloutPercentage: flag.rolloutPercentage,
      targetUsers: flag.targetUsers || [],
      targetGroups: flag.targetGroups || [],
      description: flag.description,
    })
  }

  const handleSave = async () => {
    if (!editingFlag) return

    try {
      await updateFlag.mutateAsync({
        id: editingFlag.id,
        flag: formData,
      })
      setEditingFlag(null)
    } catch (error) {
      console.error('保存功能开关失败:', error)
    }
  }

  const handleToggleEnabled = async (flagId: string, isEnabled: boolean) => {
    try {
      await updateFlag.mutateAsync({
        id: flagId,
        flag: { isEnabled },
      })
    } catch (error) {
      console.error('切换功能开关失败:', error)
    }
  }

  const handleRolloutChange = async (flagId: string, percentage: number) => {
    try {
      await updateFlag.mutateAsync({
        id: flagId,
        flag: { rolloutPercentage: percentage },
      })
    } catch (error) {
      console.error('调整灰度比例失败:', error)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            功能开关配置
          </CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                新增开关
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>新增功能开关</DialogTitle>
                <DialogDescription>
                  创建新的功能开关来控制功能的发布和灰度
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    开关名称
                  </Label>
                  <Input
                    id="name"
                    placeholder="输入功能名称"
                    className="col-span-3"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="key" className="text-right">
                    开关标识
                  </Label>
                  <Input
                    id="key"
                    placeholder="feature_key"
                    className="col-span-3"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    功能描述
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="描述功能的作用和影响范围"
                    className="col-span-3"
                    rows={3}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button type="submit">创建开关</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>功能名称</TableHead>
              <TableHead>开关状态</TableHead>
              <TableHead>灰度比例</TableHead>
              <TableHead>目标用户</TableHead>
              <TableHead>更新时间</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {flagsData.map((flag) => (
              <TableRow key={flag.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{flag.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {flag.key}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {flag.description}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={flag.isEnabled}
                      onCheckedChange={(checked) => handleToggleEnabled(flag.id, checked)}
                    />
                    <Badge variant={flag.isEnabled ? 'default' : 'secondary'}>
                      {flag.isEnabled ? '启用' : '禁用'}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{flag.rolloutPercentage}%</span>
                    </div>
                    <div className="w-24">
                      <Slider
                        value={[flag.rolloutPercentage]}
                        onValueChange={([value]) => handleRolloutChange(flag.id, value)}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {flag.targetUsers && flag.targetUsers.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        {flag.targetUsers.length} 用户
                      </Badge>
                    )}
                    {flag.targetGroups && flag.targetGroups.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        <Flag className="h-3 w-3 mr-1" />
                        {flag.targetGroups.length} 群组
                      </Badge>
                    )}
                    {(!flag.targetUsers || flag.targetUsers.length === 0) && 
                     (!flag.targetGroups || flag.targetGroups.length === 0) && (
                      <Badge variant="secondary" className="text-xs">
                        全部用户
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(flag.updatedAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(flag)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>编辑功能开关</DialogTitle>
                        <DialogDescription>
                          修改 {flag.name} 的配置参数
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-name" className="text-right">
                            功能名称
                          </Label>
                          <Input
                            id="edit-name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="col-span-3"
                          />
                        </div>
                        
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-key" className="text-right">
                            开关标识
                          </Label>
                          <Input
                            id="edit-key"
                            value={formData.key}
                            onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                            className="col-span-3"
                          />
                        </div>
                        
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-enabled" className="text-right">
                            启用状态
                          </Label>
                          <Switch
                            id="edit-enabled"
                            checked={formData.isEnabled}
                            onCheckedChange={(checked) => setFormData({ ...formData, isEnabled: checked })}
                          />
                        </div>
                        
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-rollout" className="text-right">
                            灰度比例
                          </Label>
                          <div className="col-span-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <Slider
                                value={[formData.rolloutPercentage]}
                                onValueChange={([value]) => setFormData({ ...formData, rolloutPercentage: value })}
                                max={100}
                                step={5}
                                className="flex-1"
                              />
                              <span className="w-12 text-sm">{formData.rolloutPercentage}%</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-target-users" className="text-right">
                            目标用户
                          </Label>
                          <Input
                            id="edit-target-users"
                            placeholder="用户ID，用逗号分隔"
                            value={formData.targetUsers.join(', ')}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              targetUsers: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                            })}
                            className="col-span-3"
                          />
                        </div>
                        
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-target-groups" className="text-right">
                            目标群组
                          </Label>
                          <Input
                            id="edit-target-groups"
                            placeholder="群组名称，用逗号分隔"
                            value={formData.targetGroups.join(', ')}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              targetGroups: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                            })}
                            className="col-span-3"
                          />
                        </div>
                        
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-description" className="text-right">
                            功能描述
                          </Label>
                          <Textarea
                            id="edit-description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="col-span-3"
                            rows={3}
                          />
                        </div>
                      </div>
                      
                      <DialogFooter>
                        <Button
                          type="submit"
                          onClick={handleSave}
                          disabled={updateFlag.isPending}
                        >
                          保存开关
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}