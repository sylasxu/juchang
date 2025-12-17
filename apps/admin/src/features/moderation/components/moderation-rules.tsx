import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { Separator } from '@/components/ui/separator'
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react'

interface ModerationRule {
  id: string
  name: string
  description: string
  type: 'auto' | 'manual' | 'hybrid'
  category: 'content' | 'user' | 'activity' | 'message'
  conditions: {
    keywords?: string[]
    riskScoreThreshold?: number
    reportCountThreshold?: number
    userLevelRestriction?: string[]
  }
  actions: {
    autoAction?: 'approve' | 'reject' | 'flag' | 'escalate'
    notifyModerators?: boolean
    assignToLevel?: 'junior' | 'senior' | 'supervisor'
    priority?: 'low' | 'medium' | 'high' | 'urgent'
  }
  isActive: boolean
  createdAt: string
  lastModified: string
  triggerCount: number
}

export function ModerationRules() {
  const [rules, setRules] = useState<ModerationRule[]>([
    {
      id: '1',
      name: '高风险内容自动标记',
      description: '风险评分超过80分的内容自动标记为高风险并分配给高级审核员',
      type: 'auto',
      category: 'content',
      conditions: {
        riskScoreThreshold: 80
      },
      actions: {
        autoAction: 'flag',
        assignToLevel: 'senior',
        priority: 'high',
        notifyModerators: true
      },
      isActive: true,
      createdAt: '2024-01-15',
      lastModified: '2024-01-20',
      triggerCount: 156
    },
    {
      id: '2',
      name: '垃圾信息关键词检测',
      description: '包含特定关键词的内容自动拒绝',
      type: 'auto',
      category: 'content',
      conditions: {
        keywords: ['广告', '推广', '加微信', '刷单']
      },
      actions: {
        autoAction: 'reject',
        notifyModerators: false,
        priority: 'medium'
      },
      isActive: true,
      createdAt: '2024-01-10',
      lastModified: '2024-01-18',
      triggerCount: 89
    },
    {
      id: '3',
      name: '多次举报用户升级',
      description: '被举报次数超过5次的用户内容自动升级处理',
      type: 'hybrid',
      category: 'user',
      conditions: {
        reportCountThreshold: 5
      },
      actions: {
        autoAction: 'escalate',
        assignToLevel: 'supervisor',
        priority: 'urgent',
        notifyModerators: true
      },
      isActive: true,
      createdAt: '2024-01-12',
      lastModified: '2024-01-19',
      triggerCount: 23
    }
  ])

  const [editingRule, setEditingRule] = useState<ModerationRule | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleToggleRule = (ruleId: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId 
        ? { ...rule, isActive: !rule.isActive }
        : rule
    ))
  }

  const handleEditRule = (rule: ModerationRule) => {
    setEditingRule(rule)
    setIsDialogOpen(true)
  }

  const handleDeleteRule = (ruleId: string) => {
    setRules(prev => prev.filter(rule => rule.id !== ruleId))
  }

  const getRuleTypeIcon = (type: string) => {
    switch (type) {
      case 'auto': return <Zap className="h-4 w-4 text-blue-600" />
      case 'manual': return <Settings className="h-4 w-4 text-gray-600" />
      case 'hybrid': return <CheckCircle className="h-4 w-4 text-green-600" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getRuleTypeLabel = (type: string) => {
    const labels = {
      auto: '自动',
      manual: '手动',
      hybrid: '混合'
    }
    return labels[type as keyof typeof labels] || type
  }

  const getCategoryLabel = (category: string) => {
    const labels = {
      content: '内容',
      user: '用户',
      activity: '活动',
      message: '消息'
    }
    return labels[category as keyof typeof labels] || category
  }

  const getActionLabel = (action: string) => {
    const labels = {
      approve: '批准',
      reject: '拒绝',
      flag: '标记',
      escalate: '升级'
    }
    return labels[action as keyof typeof labels] || action
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">审核规则</h2>
          <p className="text-muted-foreground">
            管理自动化审核规则和决策逻辑
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingRule(null)}>
              <Plus className="h-4 w-4 mr-2" />
              新建规则
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingRule ? '编辑规则' : '新建规则'}
              </DialogTitle>
              <DialogDescription>
                配置审核规则的条件和自动化操作
              </DialogDescription>
            </DialogHeader>
            {/* 这里可以添加规则编辑表单 */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>规则名称</Label>
                  <Input placeholder="输入规则名称" />
                </div>
                <div className="space-y-2">
                  <Label>规则类型</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="选择类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">自动</SelectItem>
                      <SelectItem value="manual">手动</SelectItem>
                      <SelectItem value="hybrid">混合</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>规则描述</Label>
                <Textarea placeholder="描述规则的作用和触发条件" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={() => setIsDialogOpen(false)}>
                {editingRule ? '更新规则' : '创建规则'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">总规则数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rules.length}</div>
            <p className="text-xs text-muted-foreground">
              活跃规则 {rules.filter(r => r.isActive).length} 个
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">自动化率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78.5%</div>
            <p className="text-xs text-muted-foreground">
              本周自动处理比例
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">规则触发</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rules.reduce((sum, rule) => sum + rule.triggerCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              总触发次数
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">准确率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.2%</div>
            <p className="text-xs text-muted-foreground">
              自动决策准确率
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 规则列表 */}
      <div className="space-y-4">
        {rules.map((rule) => (
          <Card key={rule.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getRuleTypeIcon(rule.type)}
                  <div>
                    <CardTitle className="text-lg">{rule.name}</CardTitle>
                    <CardDescription>{rule.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {getRuleTypeLabel(rule.type)}
                  </Badge>
                  <Badge variant="secondary">
                    {getCategoryLabel(rule.category)}
                  </Badge>
                  <Switch
                    checked={rule.isActive}
                    onCheckedChange={() => handleToggleRule(rule.id)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 规则条件 */}
              <div>
                <Label className="text-sm font-medium">触发条件</Label>
                <div className="mt-2 space-y-2">
                  {rule.conditions.riskScoreThreshold && (
                    <div className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <span>风险评分 ≥ {rule.conditions.riskScoreThreshold}</span>
                    </div>
                  )}
                  {rule.conditions.keywords && rule.conditions.keywords.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <span>关键词:</span>
                      <div className="flex gap-1">
                        {rule.conditions.keywords.map((keyword, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {rule.conditions.reportCountThreshold && (
                    <div className="flex items-center gap-2 text-sm">
                      <span>举报次数 ≥ {rule.conditions.reportCountThreshold}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* 自动操作 */}
              <div>
                <Label className="text-sm font-medium">自动操作</Label>
                <div className="mt-2 space-y-2">
                  {rule.actions.autoAction && (
                    <div className="flex items-center gap-2 text-sm">
                      <span>自动{getActionLabel(rule.actions.autoAction)}</span>
                      {rule.actions.priority && (
                        <Badge variant="outline" className="text-xs">
                          {rule.actions.priority}优先级
                        </Badge>
                      )}
                    </div>
                  )}
                  {rule.actions.assignToLevel && (
                    <div className="flex items-center gap-2 text-sm">
                      <span>分配给{rule.actions.assignToLevel}审核员</span>
                    </div>
                  )}
                  {rule.actions.notifyModerators && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>通知审核员</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* 统计信息和操作 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>触发 {rule.triggerCount} 次</span>
                  <span>最后修改: {rule.lastModified}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditRule(rule)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    编辑
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteRule(rule.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    删除
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {rules.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Settings className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">暂无审核规则</h3>
            <p className="text-muted-foreground text-center mb-4">
              创建自动化审核规则来提高审核效率
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              创建第一个规则
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}