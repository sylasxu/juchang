import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  AlertTriangle, 
  User, 
  MessageSquare, 
  MapPin, 
  Flag,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  ArrowUp
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useModerationContext } from './moderation-provider'
import { useModerationAction } from '@/hooks/use-moderation'
import type { ModerationQueueItem } from '@/hooks/use-moderation'

export const moderationColumns: ColumnDef<ModerationQueueItem>[] = [
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
    accessorKey: 'type',
    header: '类型',
    cell: ({ row }) => {
      const type = row.getValue('type') as string
      const getTypeIcon = (type: string) => {
        switch (type) {
          case 'user': return <User className="h-4 w-4" />
          case 'activity': return <MapPin className="h-4 w-4" />
          case 'message': return <MessageSquare className="h-4 w-4" />
          case 'report': return <Flag className="h-4 w-4" />
          default: return <AlertTriangle className="h-4 w-4" />
        }
      }
      
      const getTypeLabel = (type: string) => {
        const labels = {
          user: '用户',
          activity: '活动',
          message: '消息',
          report: '举报'
        }
        return labels[type as keyof typeof labels] || type
      }

      return (
        <div className="flex items-center gap-2">
          {getTypeIcon(type)}
          <span className="text-sm">{getTypeLabel(type)}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'title',
    header: '内容',
    cell: ({ row }) => {
      const item = row.original
      return (
        <div className="max-w-[300px]">
          <p className="font-medium truncate" title={item.title}>
            {item.title}
          </p>
          {item.description && (
            <p className="text-sm text-muted-foreground truncate" title={item.description}>
              {item.description}
            </p>
          )}
          {item.reportReason && (
            <p className="text-xs text-red-600 truncate">
              举报原因: {item.reportReason}
            </p>
          )}
          {item.reportedBy && (
            <p className="text-xs text-muted-foreground">
              举报人: {item.reportedBy.nickname}
            </p>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'priority',
    header: '优先级',
    cell: ({ row }) => {
      const priority = row.getValue('priority') as string
      const variants = {
        urgent: 'destructive',
        high: 'destructive',
        medium: 'default',
        low: 'secondary'
      } as const

      const labels = {
        urgent: '紧急',
        high: '高',
        medium: '中',
        low: '低'
      }

      return (
        <Badge variant={variants[priority as keyof typeof variants] || 'secondary'}>
          {labels[priority as keyof typeof labels] || priority}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'riskScore',
    header: '风险评分',
    cell: ({ row }) => {
      const score = row.getValue('riskScore') as number
      const getRiskScoreColor = (score: number) => {
        if (score >= 80) return 'text-red-600'
        if (score >= 60) return 'text-orange-600'
        if (score >= 40) return 'text-yellow-600'
        return 'text-green-600'
      }

      return (
        <span className={`font-medium ${getRiskScoreColor(score)}`}>
          {score}
        </span>
      )
    },
  },
  {
    accessorKey: 'status',
    header: '状态',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      const variants = {
        pending: 'secondary',
        in_review: 'default',
        approved: 'default',
        rejected: 'destructive',
        escalated: 'destructive'
      } as const

      const labels = {
        pending: '待审核',
        in_review: '审核中',
        approved: '已批准',
        rejected: '已拒绝',
        escalated: '已升级'
      }

      return (
        <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
          {labels[status as keyof typeof labels] || status}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'reportedAt',
    header: '举报时间',
    cell: ({ row }) => {
      const date = row.getValue('reportedAt') as string
      return (
        <span className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(date), {
            addSuffix: true,
            locale: zhCN,
          })}
        </span>
      )
    },
  },
  {
    accessorKey: 'assignedTo',
    header: '分配给',
    cell: ({ row }) => {
      const assignedTo = row.original.assignedTo
      if (!assignedTo) {
        return <span className="text-sm text-muted-foreground">未分配</span>
      }

      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">
              {assignedTo.nickname.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">{assignedTo.nickname}</span>
        </div>
      )
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const item = row.original
      return <ModerationRowActions item={item} />
    },
  },
]

function ModerationRowActions({ item }: { item: ModerationQueueItem }) {
  const { setSelectedItem, setActionDialogOpen, setDetailDialogOpen } = useModerationContext()
  const moderationAction = useModerationAction()

  const handleQuickAction = (action: 'approve' | 'reject') => {
    moderationAction.mutate({
      itemId: item.id,
      action: {
        action,
        reason: action === 'approve' ? '内容符合平台规范' : '内容违反平台规范',
      }
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">打开菜单</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => {
            setSelectedItem(item)
            setDetailDialogOpen(true)
          }}
        >
          <Eye className="h-4 w-4 mr-2" />
          查看详情
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => handleQuickAction('approve')}
          disabled={item.status !== 'pending'}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          快速批准
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleQuickAction('reject')}
          disabled={item.status !== 'pending'}
        >
          <XCircle className="h-4 w-4 mr-2" />
          快速拒绝
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => {
            setSelectedItem(item)
            setActionDialogOpen(true)
          }}
        >
          <ArrowUp className="h-4 w-4 mr-2" />
          更多操作
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}