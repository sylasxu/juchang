import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useRecentActivities } from '@/hooks/use-dashboard'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

// 活动类型图标映射
const activityTypeIcons: Record<string, { icon: string; color: string }> = {
  sports: { icon: '运', color: 'blue' },
  food: { icon: '食', color: 'green' },
  entertainment: { icon: '娱', color: 'purple' },
  study: { icon: '学', color: 'orange' },
  travel: { icon: '游', color: 'red' },
  social: { icon: '社', color: 'pink' },
  business: { icon: '商', color: 'indigo' },
  other: { icon: '其', color: 'gray' },
}

// 状态映射
const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  draft: { label: '草稿', variant: 'secondary' },
  published: { label: '已发布', variant: 'default' },
  ongoing: { label: '进行中', variant: 'default' },
  completed: { label: '已完成', variant: 'outline' },
  cancelled: { label: '已取消', variant: 'destructive' },
  hidden: { label: '已隐藏', variant: 'secondary' },
  removed: { label: '已删除', variant: 'destructive' },
}

export function RecentActivities() {
  const { data: activities, isLoading, error } = useRecentActivities(8)

  if (isLoading) {
    return (
      <div className='space-y-6'>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className='flex items-center gap-4'>
            <Skeleton className='h-9 w-9 rounded-full' />
            <div className='flex-1 space-y-2'>
              <Skeleton className='h-4 w-32' />
              <Skeleton className='h-3 w-24' />
            </div>
            <Skeleton className='h-6 w-16' />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className='flex items-center justify-center py-8'>
        <p className='text-sm text-muted-foreground'>加载活动数据失败</p>
      </div>
    )
  }

  if (!activities || activities.length === 0) {
    return (
      <div className='flex items-center justify-center py-8'>
        <p className='text-sm text-muted-foreground'>暂无最新活动</p>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {activities.map((activity) => {
        const typeConfig = activityTypeIcons[activity.type] || activityTypeIcons.other
        const statusConfig = statusMap[activity.status] || { label: activity.status, variant: 'secondary' as const }
        
        return (
          <div key={activity.id} className='flex items-center gap-4'>
            <div className={`flex h-9 w-9 items-center justify-center rounded-full bg-${typeConfig.color}-100 dark:bg-${typeConfig.color}-900`}>
              <span className={`text-sm font-medium text-${typeConfig.color}-600 dark:text-${typeConfig.color}-300`}>
                {typeConfig.icon}
              </span>
            </div>
            <div className='flex flex-1 flex-wrap items-center justify-between'>
              <div className='space-y-1 min-w-0 flex-1'>
                <p className='text-sm leading-none font-medium truncate' title={activity.title}>
                  {activity.title}
                </p>
                <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                  {activity.location && (
                    <span className='truncate' title={activity.location}>
                      {activity.location}
                    </span>
                  )}
                  <span>•</span>
                  <span>{activity.creatorName}</span>
                  <span>•</span>
                  <span>{activity.participantCount} 人参与</span>
                  <span>•</span>
                  <span>
                    {formatDistanceToNow(new Date(activity.createdAt), {
                      addSuffix: true,
                      locale: zhCN,
                    })}
                  </span>
                </div>
              </div>
              <Badge variant={statusConfig.variant} className='ml-2 shrink-0'>
                {statusConfig.label}
              </Badge>
            </div>
          </div>
        )
      })}
    </div>
  )
}