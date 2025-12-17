import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  RefreshCw, 
  BarChart3, 
  Settings,
  Filter
} from 'lucide-react'
import { useModerationContext } from './moderation-provider'
import { useModerationStats, useRealTimeModerationUpdates } from '@/hooks/use-moderation'

export function ModerationPrimaryButtons() {
  const { 
    setStatsDialogOpen,
    selectedItems,
    filters,
    setFilters
  } = useModerationContext()
  
  const { data: stats } = useModerationStats()
  const { refreshQueue } = useRealTimeModerationUpdates()

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.type?.length) count++
    if (filters.status?.length) count++
    if (filters.priority?.length) count++
    if (filters.assignedTo) count++
    if (filters.dateRange) count++
    if (filters.riskScoreRange) count++
    if (filters.search) count++
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <div className='flex items-center gap-2'>
      {/* 筛选指示器 */}
      {activeFiltersCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setFilters({
              page: 1,
              limit: 20,
              sortBy: 'reportedAt',
              sortOrder: 'desc'
            })
          }}
        >
          <Filter className='h-4 w-4 mr-2' />
          清除筛选
          <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
            {activeFiltersCount}
          </Badge>
        </Button>
      )}

      {/* 选择指示器 */}
      {selectedItems.length > 0 && (
        <Badge variant="secondary" className="px-2 py-1">
          已选择 {selectedItems.length} 项
        </Badge>
      )}

      {/* 待审核数量指示器 */}
      {stats?.pending && stats.pending > 0 && (
        <Badge variant="destructive" className="px-2 py-1">
          {stats.pending} 待审核
        </Badge>
      )}

      {/* 刷新按钮 */}
      <Button
        variant="outline"
        size="sm"
        onClick={refreshQueue}
      >
        <RefreshCw className='h-4 w-4 mr-2' />
        刷新
      </Button>

      {/* 统计分析按钮 */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setStatsDialogOpen(true)}
      >
        <BarChart3 className='h-4 w-4 mr-2' />
        统计分析
      </Button>

      {/* 设置按钮 */}
      <Button
        variant="outline"
        size="sm"
      >
        <Settings className='h-4 w-4 mr-2' />
        设置
      </Button>
    </div>
  )
}