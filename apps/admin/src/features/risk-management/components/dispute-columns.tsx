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
  ArrowUp,
  CreditCard,
  Activity,
  User,
  MessageSquare,
  ArrowUpDown
} from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { DisputeRecord } from '@/hooks/use-risk-management'

export const disputeColumns: ColumnDef<DisputeRecord>[] = [
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
    header: '争议ID',
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
    accessorKey: 'type',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-8 px-2"
      >
        争议类型
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const type = row.getValue('type') as string
      const icons = {
        payment: <CreditCard className="h-4 w-4" />,
        activity: <Activity className="h-4 w-4" />,
        behavior: <User className="h-4 w-4" />,
        content: <MessageSquare className="h-4 w-4" />
      }
      const labels = {
        payment: '支付争议',
        activity: '活动争议',
        behavior: '行为争议',
        content: '内容争议'
      }
      
      return (
        <div className="flex items-center gap-2">
          {icons[type as keyof typeof icons]}
          <span className="font-medium">
            {labels[type as keyof typeof labels] || type}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: 'status',
    header: '状态',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      const statusConfig = {
        open: { label: '待处理', variant: 'destructive' as const },
        investigating: { label: '调查中', variant: 'secondary' as const },
        resolved: { label: '已解决', variant: 'default' as const },
        escalated: { label: '已升级', variant: 'outline' as const },
        closed: { label: '已关闭', variant: 'secondary' as const }
      }[status] || { label: status, variant: 'outline' as const }
      
      return (
        <Badge variant={statusConfig.variant}>
          {statusConfig.label}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'priority',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-8 px-2"
      >
        优先级
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const priority = row.getValue('priority') as string
      const priorityConfig = {
        low: { label: '低', variant: 'secondary' as const, color: 'text-green-600' },
        medium: { label: '中', variant: 'secondary' as const, color: 'text-yellow-600' },
        high: { label: '高', variant: 'destructive' as const, color: 'text-orange-600' },
        urgent: { label: '紧急', variant: 'destructive' as const, color: 'text-red-600' }
      }[priority] || { label: priority, variant: 'outline' as const, color: 'text-gray-600' }
      
      return (
        <Badge variant={priorityConfig.variant} className={priorityConfig.color}>
          {priorityConfig.label}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'reporterInfo',
    header: '举报人',
    cell: ({ row }) => {
      const reporterInfo = row.getValue('reporterInfo') as any
      
      if (!reporterInfo) {
        return <span className="text-muted-foreground">匿名</span>
      }
      
      return (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-medium">
              {reporterInfo.nickname?.charAt(0) || 'U'}
            </span>
          </div>
          <span className="text-sm">{reporterInfo.nickname}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'description',
    header: '争议描述',
    cell: ({ row }) => {
      const description = row.getValue('description') as string
      return (
        <div className="max-w-xs">
          <p className="text-sm truncate" title={description}>
            {description}
          </p>
        </div>
      )
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-8 px-2"
      >
        创建时间
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.getValue('createdAt') as string
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
              {assignedTo.nickname?.charAt(0) || 'A'}
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
      const dispute = row.original
      
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
              onClick={() => navigator.clipboard.writeText(dispute.id)}
            >
              复制争议ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" />
              查看详情
            </DropdownMenuItem>
            <DropdownMenuItem>
              <CheckCircle className="mr-2 h-4 w-4" />
              处理争议
            </DropdownMenuItem>
            <DropdownMenuItem>
              <ArrowUp className="mr-2 h-4 w-4" />
              升级处理
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]