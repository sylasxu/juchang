import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { CalendarIcon, Filter, X } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { ModerationQueueFilters } from '@/hooks/use-moderation'

interface ModerationFiltersProps {
  filters: ModerationQueueFilters
  onFiltersChange: (filters: Partial<ModerationQueueFilters>) => void
}

export function ModerationFilters({ filters, onFiltersChange }: ModerationFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [tempFilters, setTempFilters] = useState<ModerationQueueFilters>(filters)

  const handleApplyFilters = () => {
    onFiltersChange(tempFilters)
    setIsOpen(false)
  }

  const handleResetFilters = () => {
    const resetFilters: ModerationQueueFilters = {
      page: 1,
      limit: 20,
      sortBy: 'reportedAt',
      sortOrder: 'desc'
    }
    setTempFilters(resetFilters)
    onFiltersChange(resetFilters)
    setIsOpen(false)
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.type?.length) count++
    if (filters.status?.length) count++
    if (filters.priority?.length) count++
    if (filters.assignedTo) count++
    if (filters.dateRange) count++
    if (filters.riskScoreRange) count++
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <div className="flex items-center gap-4">
      {/* 快速搜索 */}
      <div className="flex-1 max-w-sm">
        <Input
          placeholder="搜索内容、用户或原因..."
          value={filters.search || ''}
          onChange={(e) => onFiltersChange({ search: e.target.value })}
        />
      </div>

      {/* 快速状态筛选 */}
      <Select
        value={filters.status?.[0] || 'all'}
        onValueChange={(value) => 
          onFiltersChange({ 
            status: value === 'all' ? undefined : [value] 
          })
        }
      >
        <SelectTrigger className="w-32">
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
        <SelectTrigger className="w-32">
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
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="relative">
            <Filter className="h-4 w-4 mr-2" />
            高级筛选
            {activeFiltersCount > 0 && (
              <Badge 
                variant="secondary" 
                className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-4" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">高级筛选</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* 内容类型 */}
            <div className="space-y-2">
              <Label>内容类型</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'user', label: '用户' },
                  { value: 'activity', label: '活动' },
                  { value: 'message', label: '消息' },
                  { value: 'report', label: '举报' },
                ].map((type) => (
                  <div key={type.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={type.value}
                      checked={tempFilters.type?.includes(type.value) || false}
                      onCheckedChange={(checked) => {
                        const currentTypes = tempFilters.type || []
                        const newTypes = checked
                          ? [...currentTypes, type.value]
                          : currentTypes.filter(t => t !== type.value)
                        setTempFilters(prev => ({
                          ...prev,
                          type: newTypes.length > 0 ? newTypes : undefined
                        }))
                      }}
                    />
                    <Label htmlFor={type.value} className="text-sm">
                      {type.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* 风险评分范围 */}
            <div className="space-y-2">
              <Label>风险评分范围</Label>
              <div className="px-2">
                <Slider
                  value={tempFilters.riskScoreRange || [0, 100]}
                  onValueChange={(value) => 
                    setTempFilters(prev => ({
                      ...prev,
                      riskScoreRange: value as [number, number]
                    }))
                  }
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{tempFilters.riskScoreRange?.[0] || 0}</span>
                  <span>{tempFilters.riskScoreRange?.[1] || 100}</span>
                </div>
              </div>
            </div>

            {/* 日期范围 */}
            <div className="space-y-2">
              <Label>举报时间范围</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {tempFilters.dateRange ? (
                      `${format(new Date(tempFilters.dateRange[0]), 'yyyy-MM-dd', { locale: zhCN })} - ${format(new Date(tempFilters.dateRange[1]), 'yyyy-MM-dd', { locale: zhCN })}`
                    ) : (
                      '选择日期范围'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{
                      from: tempFilters.dateRange ? new Date(tempFilters.dateRange[0]) : undefined,
                      to: tempFilters.dateRange ? new Date(tempFilters.dateRange[1]) : undefined,
                    }}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setTempFilters(prev => ({
                          ...prev,
                          dateRange: [
                            range.from!.toISOString(),
                            range.to!.toISOString()
                          ]
                        }))
                      } else {
                        setTempFilters(prev => ({
                          ...prev,
                          dateRange: undefined
                        }))
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleResetFilters}>
                重置
              </Button>
              <Button onClick={handleApplyFilters}>
                应用筛选
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* 排序 */}
      <Select
        value={`${filters.sortBy}-${filters.sortOrder}`}
        onValueChange={(value) => {
          const [sortBy, sortOrder] = value.split('-')
          onFiltersChange({ sortBy, sortOrder: sortOrder as 'asc' | 'desc' })
        }}
      >
        <SelectTrigger className="w-40">
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