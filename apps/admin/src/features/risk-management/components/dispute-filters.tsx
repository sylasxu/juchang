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
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { 
  Filter, 
  X, 
  Calendar as CalendarIcon,
  Search,
  RotateCcw
} from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useDisputeContext } from './dispute-provider'

export function DisputeFilters() {
  const { filters, setFilters } = useDisputeContext()
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [tempFilters, setTempFilters] = useState(filters)

  const handleApplyFilters = () => {
    setFilters(tempFilters)
  }

  const handleResetFilters = () => {
    const defaultFilters = {
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc' as const
    }
    setTempFilters(defaultFilters)
    setFilters(defaultFilters)
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (tempFilters.type?.length) count++
    if (tempFilters.status?.length) count++
    if (tempFilters.priority?.length) count++
    if (tempFilters.assignedTo) count++
    if (tempFilters.dateRange?.length === 2) count++
    return count
  }

  const removeFilter = (filterKey: string) => {
    const newFilters = { ...tempFilters }
    delete (newFilters as any)[filterKey]
    setTempFilters(newFilters)
    setFilters(newFilters)
  }

  return (
    <div className="space-y-4">
      {/* 基础筛选器 */}
      <div className="flex flex-wrap items-center gap-4">
        {/* 搜索 */}
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索争议ID或描述..."
            value={tempFilters.search || ''}
            onChange={(e) => setTempFilters({ ...tempFilters, search: e.target.value })}
            className="w-64"
          />
        </div>

        {/* 争议类型 */}
        <Select
          value={tempFilters.type?.[0] || ''}
          onValueChange={(value) => 
            setTempFilters({ 
              ...tempFilters, 
              type: value ? [value] : undefined 
            })
          }
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="争议类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">全部类型</SelectItem>
            <SelectItem value="payment">支付争议</SelectItem>
            <SelectItem value="activity">活动争议</SelectItem>
            <SelectItem value="behavior">行为争议</SelectItem>
            <SelectItem value="content">内容争议</SelectItem>
          </SelectContent>
        </Select>

        {/* 状态 */}
        <Select
          value={tempFilters.status?.[0] || ''}
          onValueChange={(value) => 
            setTempFilters({ 
              ...tempFilters, 
              status: value ? [value] : undefined 
            })
          }
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">全部状态</SelectItem>
            <SelectItem value="open">待处理</SelectItem>
            <SelectItem value="investigating">调查中</SelectItem>
            <SelectItem value="resolved">已解决</SelectItem>
            <SelectItem value="escalated">已升级</SelectItem>
            <SelectItem value="closed">已关闭</SelectItem>
          </SelectContent>
        </Select>

        {/* 优先级 */}
        <Select
          value={tempFilters.priority?.[0] || ''}
          onValueChange={(value) => 
            setTempFilters({ 
              ...tempFilters, 
              priority: value ? [value] : undefined 
            })
          }
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="优先级" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">全部优先级</SelectItem>
            <SelectItem value="low">低</SelectItem>
            <SelectItem value="medium">中</SelectItem>
            <SelectItem value="high">高</SelectItem>
            <SelectItem value="urgent">紧急</SelectItem>
          </SelectContent>
        </Select>

        {/* 高级筛选器切换 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          高级筛选
          {getActiveFiltersCount() > 0 && (
            <Badge variant="secondary" className="ml-1">
              {getActiveFiltersCount()}
            </Badge>
          )}
        </Button>

        {/* 重置按钮 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleResetFilters}
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          重置
        </Button>
      </div>

      {/* 高级筛选器 */}
      {showAdvanced && (
        <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 日期范围 */}
            <div className="space-y-2">
              <Label>创建日期范围</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {tempFilters.dateRange?.[0] 
                        ? format(new Date(tempFilters.dateRange[0]), 'MM-dd', { locale: zhCN })
                        : '开始日期'
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={tempFilters.dateRange?.[0] ? new Date(tempFilters.dateRange[0]) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          const dateStr = date.toISOString().split('T')[0]
                          setTempFilters({
                            ...tempFilters,
                            dateRange: [dateStr, tempFilters.dateRange?.[1] || dateStr]
                          })
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {tempFilters.dateRange?.[1] 
                        ? format(new Date(tempFilters.dateRange[1]), 'MM-dd', { locale: zhCN })
                        : '结束日期'
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={tempFilters.dateRange?.[1] ? new Date(tempFilters.dateRange[1]) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          const dateStr = date.toISOString().split('T')[0]
                          setTempFilters({
                            ...tempFilters,
                            dateRange: [tempFilters.dateRange?.[0] || dateStr, dateStr]
                          })
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* 分配给 */}
            <div className="space-y-2">
              <Label>分配给</Label>
              <Input
                placeholder="输入处理员ID或姓名"
                value={tempFilters.assignedTo || ''}
                onChange={(e) => setTempFilters({ ...tempFilters, assignedTo: e.target.value })}
              />
            </div>
          </div>

          {/* 应用按钮 */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAdvanced(false)}>
              取消
            </Button>
            <Button onClick={handleApplyFilters}>
              应用筛选
            </Button>
          </div>
        </div>
      )}

      {/* 活跃筛选器标签 */}
      {getActiveFiltersCount() > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">活跃筛选器:</span>
          
          {tempFilters.type?.length && (
            <Badge variant="secondary" className="flex items-center gap-1">
              类型: {tempFilters.type.join(', ')}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => removeFilter('type')}
              />
            </Badge>
          )}
          
          {tempFilters.status?.length && (
            <Badge variant="secondary" className="flex items-center gap-1">
              状态: {tempFilters.status.join(', ')}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => removeFilter('status')}
              />
            </Badge>
          )}
          
          {tempFilters.priority?.length && (
            <Badge variant="secondary" className="flex items-center gap-1">
              优先级: {tempFilters.priority.join(', ')}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => removeFilter('priority')}
              />
            </Badge>
          )}
          
          {tempFilters.dateRange?.length === 2 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              日期: {format(new Date(tempFilters.dateRange[0]), 'MM-dd', { locale: zhCN })} - {format(new Date(tempFilters.dateRange[1]), 'MM-dd', { locale: zhCN })}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => removeFilter('dateRange')}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}