import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useServiceConfigs, useUpdateServiceConfig, useBatchUpdateServiceStatus } from '@/hooks/use-premium-services'
import { 
  Settings, 
  Edit, 
  Zap, 
  Crown, 
  Rocket, 
  Bot,
  DollarSign,
  Users,
  Calendar
} from 'lucide-react'
import { toast } from 'sonner'

interface ServiceConfigFormData {
  name: string
  pricing: {
    monthly: number
    quarterly: number
    yearly: number
  }
  quotas: {
    daily?: number
    monthly?: number
    total?: number
  }
  features: string[]
  description: string
  isActive: boolean
}

export function ServiceConfigTable() {
  const { data: configs, isLoading } = useServiceConfigs()
  const updateServiceConfig = useUpdateServiceConfig()
  const batchUpdateStatus = useBatchUpdateServiceStatus()
  
  const [selectedConfigs, setSelectedConfigs] = useState<string[]>([])
  const [editingConfig, setEditingConfig] = useState<any>(null)
  const [formData, setFormData] = useState<ServiceConfigFormData>({
    name: '',
    pricing: { monthly: 0, quarterly: 0, yearly: 0 },
    quotas: {},
    features: [],
    description: '',
    isActive: true,
  })

  const serviceIcons = {
    boost: Zap,
    pin_plus: Crown,
    fast_pass: Rocket,
    ai_services: Bot,
  }

  const handleEdit = (config: any) => {
    setEditingConfig(config)
    setFormData({
      name: config.name,
      pricing: config.pricing,
      quotas: config.quotas,
      features: config.features,
      description: config.description,
      isActive: config.isActive,
    })
  }

  const handleSave = async () => {
    if (!editingConfig) return

    try {
      await updateServiceConfig.mutateAsync({
        id: editingConfig.id,
        config: formData,
      })
      setEditingConfig(null)
    } catch (error) {
      console.error('保存配置失败:', error)
    }
  }

  const handleBatchStatusUpdate = async (isActive: boolean) => {
    if (selectedConfigs.length === 0) {
      toast.error('请选择要操作的服务')
      return
    }

    try {
      await batchUpdateStatus.mutateAsync({
        serviceIds: selectedConfigs,
        isActive,
        reason: isActive ? '批量启用服务' : '批量禁用服务',
      })
      setSelectedConfigs([])
    } catch (error) {
      console.error('批量更新状态失败:', error)
    }
  }

  const handleSelectConfig = (configId: string, checked: boolean) => {
    if (checked) {
      setSelectedConfigs([...selectedConfigs, configId])
    } else {
      setSelectedConfigs(selectedConfigs.filter(id => id !== configId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked && configs) {
      setSelectedConfigs(configs.map(config => config.id))
    } else {
      setSelectedConfigs([])
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
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!configs) return null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            服务配置管理
          </CardTitle>
          <div className="flex items-center gap-2">
            {selectedConfigs.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBatchStatusUpdate(true)}
                  disabled={batchUpdateStatus.isPending}
                >
                  批量启用
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBatchStatusUpdate(false)}
                  disabled={batchUpdateStatus.isPending}
                >
                  批量禁用
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={selectedConfigs.length === configs.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300"
                />
              </TableHead>
              <TableHead>服务</TableHead>
              <TableHead>定价</TableHead>
              <TableHead>配额</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>更新时间</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {configs.map((config) => {
              const IconComponent = serviceIcons[config.type as keyof typeof serviceIcons] || Settings
              
              return (
                <TableRow key={config.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedConfigs.includes(config.id)}
                      onChange={(e) => handleSelectConfig(config.id, e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{config.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {config.description}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <DollarSign className="h-3 w-3" />
                        月: ¥{config.pricing.monthly}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        季: ¥{config.pricing.quarterly} | 年: ¥{config.pricing.yearly}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {config.quotas.daily && (
                        <Badge variant="outline" className="text-xs">
                          日: {config.quotas.daily}
                        </Badge>
                      )}
                      {config.quotas.monthly && (
                        <Badge variant="outline" className="text-xs">
                          月: {config.quotas.monthly}
                        </Badge>
                      )}
                      {config.quotas.total && (
                        <Badge variant="outline" className="text-xs">
                          总: {config.quotas.total}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={config.isActive ? 'default' : 'secondary'}>
                      {config.isActive ? '启用' : '禁用'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(config.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(config)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>编辑服务配置</DialogTitle>
                          <DialogDescription>
                            修改 {config.name} 的配置参数
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                              服务名称
                            </Label>
                            <Input
                              id="name"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              className="col-span-3"
                            />
                          </div>
                          
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">定价</Label>
                            <div className="col-span-3 grid grid-cols-3 gap-2">
                              <div>
                                <Label htmlFor="monthly" className="text-xs">月度 (¥)</Label>
                                <Input
                                  id="monthly"
                                  type="number"
                                  value={formData.pricing.monthly}
                                  onChange={(e) => setFormData({
                                    ...formData,
                                    pricing: { ...formData.pricing, monthly: Number(e.target.value) }
                                  })}
                                />
                              </div>
                              <div>
                                <Label htmlFor="quarterly" className="text-xs">季度 (¥)</Label>
                                <Input
                                  id="quarterly"
                                  type="number"
                                  value={formData.pricing.quarterly}
                                  onChange={(e) => setFormData({
                                    ...formData,
                                    pricing: { ...formData.pricing, quarterly: Number(e.target.value) }
                                  })}
                                />
                              </div>
                              <div>
                                <Label htmlFor="yearly" className="text-xs">年度 (¥)</Label>
                                <Input
                                  id="yearly"
                                  type="number"
                                  value={formData.pricing.yearly}
                                  onChange={(e) => setFormData({
                                    ...formData,
                                    pricing: { ...formData.pricing, yearly: Number(e.target.value) }
                                  })}
                                />
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">配额</Label>
                            <div className="col-span-3 grid grid-cols-3 gap-2">
                              <div>
                                <Label htmlFor="daily" className="text-xs">日配额</Label>
                                <Input
                                  id="daily"
                                  type="number"
                                  value={formData.quotas.daily || ''}
                                  onChange={(e) => setFormData({
                                    ...formData,
                                    quotas: { ...formData.quotas, daily: e.target.value ? Number(e.target.value) : undefined }
                                  })}
                                />
                              </div>
                              <div>
                                <Label htmlFor="monthly-quota" className="text-xs">月配额</Label>
                                <Input
                                  id="monthly-quota"
                                  type="number"
                                  value={formData.quotas.monthly || ''}
                                  onChange={(e) => setFormData({
                                    ...formData,
                                    quotas: { ...formData.quotas, monthly: e.target.value ? Number(e.target.value) : undefined }
                                  })}
                                />
                              </div>
                              <div>
                                <Label htmlFor="total" className="text-xs">总配额</Label>
                                <Input
                                  id="total"
                                  type="number"
                                  value={formData.quotas.total || ''}
                                  onChange={(e) => setFormData({
                                    ...formData,
                                    quotas: { ...formData.quotas, total: e.target.value ? Number(e.target.value) : undefined }
                                  })}
                                />
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="description" className="text-right">
                              描述
                            </Label>
                            <Textarea
                              id="description"
                              value={formData.description}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                              className="col-span-3"
                              rows={3}
                            />
                          </div>
                          
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="active" className="text-right">
                              启用状态
                            </Label>
                            <Switch
                              id="active"
                              checked={formData.isActive}
                              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                            />
                          </div>
                        </div>
                        
                        <DialogFooter>
                          <Button
                            type="submit"
                            onClick={handleSave}
                            disabled={updateServiceConfig.isPending}
                          >
                            保存配置
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
  )
}