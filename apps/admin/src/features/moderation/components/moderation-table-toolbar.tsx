import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { X, Filter } from 'lucide-react'
import { ModerationAdvancedFilters } from './moderation-advanced-filters'
import type { ModerationQueueFilters } from '@/hooks/use-moderation'

interface ModerationTableToolbarProps {
  filters: ModerationQueueFilters
  onFiltersChange: (filters: Partial<ModerationQueueFilters>) => void
}

export function ModerationTableToolbar({ 
  filters, 
  onFiltersChange 
}: ModerationTableToolbarProps) {
  const isFiltered = !!(
    filters.search ||
    filters.type?.length ||
    filters.status?.length ||
    filters.priority?.length ||
    filters.assignedTo ||
    filters.dateRange ||
    filters.riskScoreRange
  )

  const handleReset = () => {
    onFiltersChange({
      search: undefined,
      type: undefined,
      status: undefined,
      priority: undefined,
      assignedTo: undefined,
      dateRange: undefined,
      riskScoreRange: undefined,
    })
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {/* 搜索 */}
        <Input
          placeholder="搜索内容、用户或原因..."
          value={filters.search || ''}
          onChange={(e) => onFiltersChange({ search: e.target.value || undefined })}
          className="h-8 w-[150px] lg:w-[250px]"
        />

        {/* 状态筛选 */}
        <Select
          value={filters.status?.[0] || 'all'}
          onValueChange={(value) => 
            onFiltersChange({ 
              status: value === 'all' ? undefined : [value] 
            })
          }
        >
          <SelectTrigger className="h-8 w-[120px]">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="pending">待审核</SelectItem>
            <SelectItem value="in_review">审核中</SelectItem>
            <SelectItem value="approved">已批准</SelectItem>
            <SelectItem value="rejected">已拒绝</SelectItem>
            <SelectItem value="escalated">已升级</SelectItem>
          </SelectContent>
        </Select>

        {/* 优先级筛选 */}
        <Select
          value={filters.priority?.[0] || 'all'}
          onValueChange={(value) => 
            onFiltersChange({ 
              priority: value === 'all' ? undefined : [value] 
            })
          }
        >
          <SelectTrigger className="h-8 w-[120px]">
            <SelectValue placeholder="优先级" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部优先级</SelectItem>
            <SelectItem value="urgent">紧急</SelectItem>
            <SelectItem value="high">高</SelectItem>
            <SelectItem value="medium">中</SelectItem>
            <SelectItem value="low">低</SelectItem>
          </SelectContent>
        </Select>

        {/* 高级筛选 */}
        <ModerationAdvancedFilters 
          filters={filters}
          onFiltersChange={onFiltersChange}
        />

        {/* 重置按钮 */}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={handleReset}
            className="h-8 px-2 lg:px-3"
          >
            重置
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      {/* 排序 */}
      <Select
        value={`${filters.sortBy}-${filters.sortOrder}`}
        onValueChange={(value) => {
          const [sortBy, sortOrder] = value.split('-')
          onFiltersChange({ sortBy, sortOrder: sortOrder as 'asc' | 'desc' })
        }}
      >
        <SelectTrigger className="h-8 w-[140px]">
          <SelectValue placeholder="排序" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="reportedAt-desc">最新举报</SelectItem>
          <SelectItem value="reportedAt-asc">最早举报</SelectItem>
          <SelectItem value="riskScore-desc">风险评分高</SelectItem>
          <SelectItem value="riskScore-asc">风险评分低</SelectItem>
          <SelectItem value="priority-desc">优先级高</SelectItem>
          <SelectItem value="priority-asc">优先级低</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}