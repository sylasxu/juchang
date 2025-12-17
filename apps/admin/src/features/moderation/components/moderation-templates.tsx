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
import { Separator } from '@/components/ui/separator'
import { 
  CheckCircle, 
  XCircle, 
  Flag, 
  ArrowUp,
  FileText,
  Star
} from 'lucide-react'

interface ModerationTemplate {
  id: string
  name: string
  action: 'approve' | 'reject' | 'escalate' | 'flag'
  reason: string
  notes?: string
  category: string
  isPopular?: boolean
  useCount?: number
}

interface ModerationTemplatesProps {
  itemType: string
  onTemplateSelect: (template: ModerationTemplate) => void
}

export function ModerationTemplates({ 
  itemType, 
  onTemplateSelect 
}: ModerationTemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // 模拟模板数据 - 实际应该从 API 获取
  const templates: ModerationTemplate[] = [
    // 批准模板
    {
      id: '1',
      name: '内容合规通过',
      action: 'approve',
      reason: '内容符合平台规范',
      notes: '经审核，内容健康正面，符合社区准则',
      category: 'approve',
      isPopular: true,
      useCount: 156
    },
    {
      id: '2',
      name: '误报处理',
      action: 'approve',
      reason: '误报，内容正常',
      notes: '经核实为误报，内容无违规行为',
      category: 'approve',
      useCount: 89
    },
    {
      id: '3',
      name: '已整改通过',
      action: 'approve',
      reason: '用户已整改完成',
      notes: '用户已按要求整改，现符合平台规范',
      category: 'approve',
      useCount: 67
    },

    // 拒绝模板
    {
      id: '4',
      name: '违规内容拒绝',
      action: 'reject',
      reason: '违反社区准则',
      notes: '内容包含违规信息，不符合平台规范',
      category: 'reject',
      isPopular: true,
      useCount: 234
    },
    {
      id: '5',
      name: '垃圾信息处理',
      action: 'reject',
      reason: '垃圾信息',
      notes: '内容为垃圾信息或广告，影响用户体验',
      category: 'reject',
      useCount: 178
    },
    {
      id: '6',
      name: '不当内容拒绝',
      action: 'reject',
      reason: '包含不当内容',
      notes: '内容包含不适宜信息，不符合平台价值观',
      category: 'reject',
      useCount: 145
    },

    // 升级模板
    {
      id: '7',
      name: '复杂案例升级',
      action: 'escalate',
      reason: '复杂案例需高级审核',
      notes: '案例较为复杂，需要高级审核员进一步判断',
      category: 'escalate',
      useCount: 45
    },
    {
      id: '8',
      name: '法律问题升级',
      action: 'escalate',
      reason: '涉及法律问题',
      notes: '内容可能涉及法律风险，需要专业人员评估',
      category: 'escalate',
      useCount: 23
    },

    // 标记模板
    {
      id: '9',
      name: '持续监控',
      action: 'flag',
      reason: '需要持续监控',
      notes: '用户行为需要持续关注，建议加强监控',
      category: 'flag',
      useCount: 78
    },
    {
      id: '10',
      name: '潜在风险标记',
      action: 'flag',
      reason: '存在潜在风险',
      notes: '内容存在潜在风险，需要定期复查',
      category: 'flag',
      useCount: 56
    }
  ]

  const categories = [
    { value: 'all', label: '全部模板', count: templates.length },
    { value: 'approve', label: '批准模板', count: templates.filter(t => t.action === 'approve').length },
    { value: 'reject', label: '拒绝模板', count: templates.filter(t => t.action === 'reject').length },
    { value: 'escalate', label: '升级模板', count: templates.filter(t => t.action === 'escalate').length },
    { value: 'flag', label: '标记模板', count: templates.filter(t => t.action === 'flag').length },
  ]

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.action === selectedCategory)

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'approve': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'reject': return <XCircle className="h-4 w-4 text-red-600" />
      case 'escalate': return <ArrowUp className="h-4 w-4 text-orange-600" />
      case 'flag': return <Flag className="h-4 w-4 text-yellow-600" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getActionLabel = (action: string) => {
    const labels = {
      approve: '批准',
      reject: '拒绝',
      escalate: '升级',
      flag: '标记'
    }
    return labels[action as keyof typeof labels] || action
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'approve': return 'bg-green-50 border-green-200'
      case 'reject': return 'bg-red-50 border-red-200'
      case 'escalate': return 'bg-orange-50 border-orange-200'
      case 'flag': return 'bg-yellow-50 border-yellow-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          审核模板
        </CardTitle>
        <CardDescription>
          使用预设模板快速完成审核决策
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 分类筛选 */}
        <div className="space-y-2">
          {categories.map((category) => (
            <Button
              key={category.value}
              variant={selectedCategory === category.value ? 'default' : 'ghost'}
              size="sm"
              className="w-full justify-between"
              onClick={() => setSelectedCategory(category.value)}
            >
              <span>{category.label}</span>
              <Badge variant="secondary" className="ml-2">
                {category.count}
              </Badge>
            </Button>
          ))}
        </div>

        <Separator />

        {/* 模板列表 */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredTemplates.map((template) => (
            <Card 
              key={template.id}
              className={`cursor-pointer transition-colors hover:bg-muted/50 ${getActionColor(template.action)}`}
              onClick={() => onTemplateSelect(template)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getActionIcon(template.action)}
                    <span className="font-medium text-sm">{template.name}</span>
                    {template.isPopular && (
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {getActionLabel(template.action)}
                  </Badge>
                </div>
                
                <p className="text-xs text-muted-foreground mb-2">
                  {template.reason}
                </p>
                
                {template.notes && (
                  <p className="text-xs text-muted-foreground/80 mb-2">
                    备注: {template.notes}
                  </p>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    使用 {template.useCount} 次
                  </span>
                  <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
                    使用模板
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-6">
            <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              暂无该类型的模板
            </p>
          </div>
        )}

        <Separator />

        {/* 快速操作 */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">快速操作</p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => onTemplateSelect({
                id: 'quick-approve',
                name: '快速批准',
                action: 'approve',
                reason: '内容符合平台规范',
                category: 'approve'
              })}
            >
              <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
              快速批准
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => onTemplateSelect({
                id: 'quick-reject',
                name: '快速拒绝',
                action: 'reject',
                reason: '违反社区准则',
                category: 'reject'
              })}
            >
              <XCircle className="h-3 w-3 mr-1 text-red-600" />
              快速拒绝
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}