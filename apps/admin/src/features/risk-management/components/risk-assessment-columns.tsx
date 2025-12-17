import { type ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  MoreHorizontal, 
  Eye, 
  Shield, 
  AlertTriangle,
  User,
  Activity,
  CreditCard,
  ArrowUpDown
} from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { RiskAssessment } from '@/hooks/use-risk-management'

export const riskAssessmentColumns: ColumnDef<RiskAssessment>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="选择全部"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="选择行"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'targetType',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-8 px-2"
      >
        目标类型
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const targetType = row.getValue('targetType') as string
      const icons = {
        user: <User className="h-4 w-4" />,
        activity: <Activity className="h-4 w-4" />,
        transaction: <CreditCard className="h-4 w-4" />
      }
      const labels = {
        user: '用户',
        activity: '活动',
        transaction: '交易'
      }
      
      return (
        <div className="flex items-center gap-2">
          {icons[targetType as keyof typeof icons]}
          <span className="font-medium">
            {labels[targetType as keyof typeof labels] || targetType}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: 'targetId',
    header: '目标ID',
    cell: ({ row }) => {
      const targetId = row.getValue('targetId') as string
      return (
        <div className="font-mono text-sm">
          {targetId.slice(0, 8)}...
        </div>
      )
    },
  },
  {
    accessorKey: 'riskScore',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-8 px-2"
      >
        风险评分
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const riskScore = row.getValue('riskScore') as number
      const riskLevel = row.original.riskLevel
      
      const levelConfig = {
        low: { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
        medium: { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
        high: { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
        critical: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' }
      }[riskLevel] || { color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' }
      
      return (
        <div className="flex items-center gap-2">
          <div className={`px-2 py-1 rounded-md border ${levelConfig.bg} ${levelConfig.border}`}>
            <span className={`font-bold ${levelConfig.color}`}>
              {riskScore}
            </span>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'riskLevel',
    header: '风险等级',
    cell: ({ row }) => {
      const riskLevel = row.getValue('riskLevel') as string
      const levelConfig = {
        low: { label: '低风险', variant: 'secondary' as const, color: 'text-green-600' },
        medium: { label: '中风险', variant: 'secondary' as const, color: 'text-yellow-600' },
        high: { label: '高风险', variant: 'destructive' as const, color: 'text-orange-600' },
        critical: { label: '严重风险', variant: 'destructive' as const, color: 'text-red-600' }
      }[riskLevel] || { label: riskLevel, variant: 'outline' as const, color: 'text-gray-600' }
      
      return (
        <Badge variant={levelConfig.variant} className={levelConfig.color}>
          {levelConfig.label}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'status',
    header: '状态',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      const statusConfig = {
        active: { label: '活跃', variant: 'default' as const },
        resolved: { label: '已解决', variant: 'secondary' as const },
        monitoring: { label: '监控中', variant: 'outline' as const }
      }[status] || { label: status, variant: 'outline' as const }
      
      return (
        <Badge variant={statusConfig.variant}>
          {statusConfig.label}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'riskFactors',
    header: '风险因子',
    cell: ({ row }) => {
      const riskFactors = row.getValue('riskFactors') as any[]
      const detectedFactors = riskFactors?.filter(f => f.detected) || []
      
      if (detectedFactors.length === 0) {
        return <span className="text-muted-foreground">无</span>
      }
      
      return (
        <div className="flex flex-wrap gap-1">
          {detectedFactors.slice(0, 2).map((factor, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {factor.category}
            </Badge>
          ))}
          {detectedFactors.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{detectedFactors.length - 2}
            </Badge>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'assessmentDate',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-8 px-2"
      >
        评估时间
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.getValue('assessmentDate') as string
      return (
        <div className="text-sm">
          {format(new Date(date), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
        </div>
      )
    },
  },
  {
    accessorKey: 'assignedTo',
    header: '分配给',
    cell: ({ row }) => {
      const assignedTo = row.getValue('assignedTo') as any
      
      if (!assignedTo) {
        return <span className="text-muted-foreground">未分配</span>
      }
      
      return (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-medium">
              {assignedTo.nickname?.charAt(0) || 'U'}
            </span>
          </div>
          <span className="text-sm">{assignedTo.nickname}</span>
        </div>
      )
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const assessment = row.original
      
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">打开菜单</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>操作</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(assessment.id)}
            >
              复制评估ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" />
              查看详情
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Shield className="mr-2 h-4 w-4" />
              应用缓解措施
            </DropdownMenuItem>
            <DropdownMenuItem>
              <AlertTriangle className="mr-2 h-4 w-4" />
              升级处理
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]