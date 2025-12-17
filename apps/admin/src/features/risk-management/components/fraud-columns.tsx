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
  CheckCircle, 
  XCircle,
  User,
  Activity,
  CreditCard,
  MessageSquare,
  ArrowUpDown,
  Brain,
  Settings,
  UserCheck
} from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { FraudDetection } from '@/hooks/use-risk-management'

export const fraudColumns: ColumnDef<FraudDetection>[] = [
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
    accessorKey: 'id',
    header: '检测ID',
    cell: ({ row }) => {
      const id = row.getValue('id') as string
      return (
        <div className="font-mono text-sm">
          #{id.slice(0, 8)}
        </div>
      )
    },
  },
  {
    accessorKey: 'fraudType',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-8 px-2"
      >
        欺诈类型
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const fraudType = row.getValue('fraudType') as string
      const icons = {
        fake_profile: <User className="h-4 w-4" />,
        payment_fraud: <CreditCard className="h-4 w-4" />,
        activity_manipulation: <Activity className="h-4 w-4" />,
        review_fraud: <MessageSquare className="h-4 w-4" />
      }
      const labels = {
        fake_profile: '虚假档案',
        payment_fraud: '支付欺诈',
        activity_manipulation: '活动操控',
        review_fraud: '评价欺诈'
      }
      
      return (
        <div className="flex items-center gap-2">
          {icons[fraudType as keyof typeof icons]}
          <span className="font-medium">
            {labels[fraudType as keyof typeof labels] || fraudType}
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
      const targetType = row.original.targetType
      
      return (
        <div className="space-y-1">
          <div className="font-mono text-sm">
            {targetId.slice(0, 8)}...
          </div>
          <div className="text-xs text-muted-foreground">
            {targetType}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'confidence',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-8 px-2"
      >
        置信度
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const confidence = row.getValue('confidence') as number
      
      const getConfidenceColor = (conf: number) => {
        if (conf >= 90) return 'text-red-600 bg-red-50 border-red-200'
        if (conf >= 70) return 'text-orange-600 bg-orange-50 border-orange-200'
        if (conf >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
        return 'text-gray-600 bg-gray-50 border-gray-200'
      }
      
      return (
        <div className={`px-2 py-1 rounded-md border text-center font-bold ${getConfidenceColor(confidence)}`}>
          {confidence}%
        </div>
      )
    },
  },
  {
    accessorKey: 'detectionMethod',
    header: '检测方法',
    cell: ({ row }) => {
      const method = row.getValue('detectionMethod') as string
      const methodConfig = {
        rule_based: { label: '规则引擎', icon: <Settings className="h-3 w-3" />, color: 'text-blue-600' },
        ml_model: { label: '机器学习', icon: <Brain className="h-3 w-3" />, color: 'text-purple-600' },
        manual_review: { label: '人工审核', icon: <UserCheck className="h-3 w-3" />, color: 'text-green-600' }
      }[method] || { label: method, icon: null, color: 'text-gray-600' }
      
      return (
        <Badge variant="outline" className={`${methodConfig.color} flex items-center gap-1 w-fit`}>
          {methodConfig.icon}
          {methodConfig.label}
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
        detected: { label: '已检测', variant: 'secondary' as const },
        confirmed: { label: '已确认', variant: 'destructive' as const },
        false_positive: { label: '误报', variant: 'outline' as const },
        investigating: { label: '调查中', variant: 'default' as const }
      }[status] || { label: status, variant: 'outline' as const }
      
      return (
        <Badge variant={statusConfig.variant}>
          {statusConfig.label}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'indicators',
    header: '欺诈指标',
    cell: ({ row }) => {
      const indicators = row.getValue('indicators') as any[]
      
      if (!indicators || indicators.length === 0) {
        return <span className="text-muted-foreground">无</span>
      }
      
      return (
        <div className="flex flex-wrap gap-1">
          {indicators.slice(0, 2).map((indicator, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {indicator.type}
            </Badge>
          ))}
          {indicators.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{indicators.length - 2}
            </Badge>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'detectedAt',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-8 px-2"
      >
        检测时间
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.getValue('detectedAt') as string
      return (
        <div className="text-sm">
          {format(new Date(date), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
        </div>
      )
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const fraud = row.original
      
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
              onClick={() => navigator.clipboard.writeText(fraud.id)}
            >
              复制检测ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" />
              查看详情
            </DropdownMenuItem>
            <DropdownMenuItem>
              <CheckCircle className="mr-2 h-4 w-4" />
              确认欺诈
            </DropdownMenuItem>
            <DropdownMenuItem>
              <XCircle className="mr-2 h-4 w-4" />
              标记误报
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]