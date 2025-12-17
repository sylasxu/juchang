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
import { useBusinessRules, useUpdateBusinessRule } from '@/hooks/use-system-management'
import { 
  Settings, 
  Edit, 
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown
} from 'lucide-react'

interface BusinessRuleFormData {
  name: string
  category: string
  rule: {
    conditions: any[]
    actions: any[]
  }
  isActive: boolean
  priority: number
  description: string
}

export function BusinessRulesConfig() {
  const { data: rules, isLoading } = useBusinessRules()

  // Mock data for demonstration
  const mockRules = [
    {
      id: '1',
      name: '用户注册审核规则',
      category: 'user_management',
      rule: { conditions: [], actions: [] },
      isActive: true,
      priority: 1,
      description: '新用户注册时的自动审核规则',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      name: '活动内容过滤规则',
      category: 'content_filtering',
      rule: { conditions: [], actions: [] },
      isActive: true,
      priority: 2,
      description: '自动检测和过滤不当活动内容',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ]

  const rulesData = (rules && Array.isArray(rules)) ? rules : mockRules
  const updateRule = useUpdateBusinessRule()
  
  const [editingRule, setEditingRule] = useState<any>(null)
  const [formData, setFormData] = useState<BusinessRuleFormData>({
    name: '',
    category: '',
    rule: { conditions: [], actions: [] },
    isActive: true,
    priority: 1,
    description: '',
  })

  const ruleCategories = [
    { value: 'user_management', label: '用户管理' },
    { value: 'activity_moderation', label: '活动审核' },
    { value: 'payment_processing', label: '支付处理' },
    { value: 'content_filtering', label: '内容过滤' },
    { value: 'risk_assessment', label: '风险评估' },
  ]

  const handleEdit = (rule: any) => {
    setEditingRule(rule)
    setFormData({
      name: rule.name,
      category: rule.category,
      rule: rule.rule,
      isActive: rule.isActive,
      priority: rule.priority,
      description: rule.description,
    })
  }

  const handleSave = async () => {
    if (!editingRule) return

    try {
      await updateRule.mutateAsync({
        id: editingRule.id,
        rule: formData,
      })
      setEditingRule(null)
    } catch (error) {
      console.error('保存业务规则失败:', error)
    }
  }

  const handleToggleActive = async (ruleId: string, isActive: boolean) => {
    try {
      await updateRule.mutateAsync({
        id: ruleId,
        rule: { isActive },
      })
    } catch (error) {
      console.error('切换规则状态失败:', error)
    }
  }

  const handlePriorityChange = async (ruleId: string, direction: 'up' | 'down') => {
    const rule = rulesData.find(r => r.id === ruleId)
    if (!rule) return

    const newPriority = direction === 'up' ? rule.priority + 1 : rule.priority - 1
    if (newPriority < 1) return

    try {
      await updateRule.mutateAsync({
        id: ruleId,
        rule: { priority: newPriority },
      })
    } catch (error) {
      console.error('调整规则优先级失败:', error)
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
            <Settings className="h-5 w-5" />
            业务规则配置
          </CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                新增规则
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>新增业务规则</DialogTitle>
                <DialogDescription>
                  创建新的业务规则来自动化平台管理流程
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    规则名称
                  </Label>
                  <Input
                    id="name"
                    placeholder="输入规则名称"
                    className="col-span-3"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">
                    规则分类
                  </Label>
                  <Select>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="选择规则分类" />
                    </SelectTrigger>
                    <SelectContent>
                      {ruleCategories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    规则描述
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="描述规则的作用和触发条件"
                    className="col-span-3"
                    rows={3}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button type="submit">创建规则</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>规则名称</TableHead>
              <TableHead>分类</TableHead>
              <TableHead>优先级</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>更新时间</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rulesData.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{rule.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {rule.description}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {ruleCategories.find(c => c.value === rule.category)?.label || rule.category}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{rule.priority}</span>
                    <div className="flex flex-col">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0"
                        onClick={() => handlePriorityChange(rule.id, 'up')}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0"
                        onClick={() => handlePriorityChange(rule.id, 'down')}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={rule.isActive}
                      onCheckedChange={(checked) => handleToggleActive(rule.id, checked)}
                    />
                    <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                      {rule.isActive ? '启用' : '禁用'}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(rule.updatedAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(rule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <DialogHeader>
                          <DialogTitle>编辑业务规则</DialogTitle>
                          <DialogDescription>
                            修改 {rule.name} 的配置参数
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-name" className="text-right">
                              规则名称
                            </Label>
                            <Input
                              id="edit-name"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              className="col-span-3"
                            />
                          </div>
                          
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-category" className="text-right">
                              规则分类
                            </Label>
                            <Select
                              value={formData.category}
                              onValueChange={(value) => setFormData({ ...formData, category: value })}
                            >
                              <SelectTrigger className="col-span-3">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ruleCategories.map((category) => (
                                  <SelectItem key={category.value} value={category.value}>
                                    {category.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-priority" className="text-right">
                              优先级
                            </Label>
                            <Input
                              id="edit-priority"
                              type="number"
                              min="1"
                              value={formData.priority}
                              onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                              className="col-span-3"
                            />
                          </div>
                          
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-description" className="text-right">
                              规则描述
                            </Label>
                            <Textarea
                              id="edit-description"
                              value={formData.description}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                              className="col-span-3"
                              rows={3}
                            />
                          </div>
                          
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-active" className="text-right">
                              启用状态
                            </Label>
                            <Switch
                              id="edit-active"
                              checked={formData.isActive}
                              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                            />
                          </div>
                          
                          <div className="col-span-4">
                            <Label className="text-sm font-medium">规则配置 (JSON)</Label>
                            <Textarea
                              value={JSON.stringify(formData.rule, null, 2)}
                              onChange={(e) => {
                                try {
                                  const rule = JSON.parse(e.target.value)
                                  setFormData({ ...formData, rule })
                                } catch (error) {
                                  // 忽略JSON解析错误，用户输入时可能不完整
                                }
                              }}
                              className="mt-2 font-mono text-sm"
                              rows={10}
                            />
                          </div>
                        </div>
                        
                        <DialogFooter>
                          <Button
                            type="submit"
                            onClick={handleSave}
                            disabled={updateRule.isPending}
                          >
                            保存规则
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}