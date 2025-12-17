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
import { Slider } from '@/components/ui/slider'
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
import { useRiskAssessmentContext } from './risk-assessment-provider'
import type { RiskAssessmentFilters } from '@/hooks/use-risk-management'

export function RiskAssessmentFilters() {
  const { filters, setFilters } = useRiskAssessmentContext()
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [tempFilters, setTempFilters] = useState<RiskAssessmentFilters>(filters)

  const handleApplyFilters = () => {
    setFilters(tempFilters)
  }

  const handleResetFilters = () => {
    const defaultFilters: RiskAssessmentFilters = {
      page: 1,
      limit: 20,
      sortBy: 'assessmentDate',
      sortOrder: 'desc'
    }
    setTempFilters(defaultFilters)
    setFilters(defaultFilters)
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (tempFilters.targetType?.length) count++
    if (tempFilters.riskLevel?.length) count++
    if (tempFilters.status?.length) count++
    if (tempFilters.assignedTo) count++
    if (tempFilters.dateRange?.length === 2) count++
    if (tempFilters.riskScoreRange?.length === 2) count++
    return count
  }

  const removeFilter = (filterKey: keyof RiskAssessmentFilters) => {
    const newFilters = { ...tempFilters }
    delete newFilters[filterKey]
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
            placeholder="搜索目标ID或备注..."
            value={tempFilters.search || ''}
            onChange={(e) => setTempFilters({ ...tempFilters, search: e.target.value })}
            className="w-64"
          />
        </div>

        {/* 目标类型 */}
        <Select
          value={tempFilters.targetType?.[0] || ''}
          onValueChange={(value) => 
            setTempFilters({ 
              ...tempFilters, 
              targetType: value ? [value] : undefined 
            })
          }
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="目标类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">全部类型</SelectItem>
            <SelectItem value="user">用户</SelectItem>
            <SelectItem value="activity">活动</SelectItem>
            <SelectItem value="transaction">交易</SelectItem>
          </SelectContent>
        </Select>

        {/* 风险等级 */}
        <Select
          value={tempFilters.riskLevel?.[0] || ''}
          onValueChange={(value) => 
            setTempFilters({ 
              ...tempFilters, 
              riskLevel: value ? [value] : undefined 
            })
          }
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="风险等级" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">全部等级</SelectItem>
            <SelectItem value="low">低风险</SelectItem>
            <SelectItem value="medium">中风险</SelectItem>
            <SelectItem value="high">高风险</SelectItem>
            <SelectItem value="critical">严重风险</SelectItem>
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
            <SelectItem value="active">活跃</SelectItem>
            <SelectItem value="resolved">已解决</SelectItem>
            <SelectItem value="monitoring">监控中</SelectItem>
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
            {/* 风险评分范围 */}
            <div className="space-y-2">
              <Label>风险评分范围</Label>
              <div className="px-3">
                <Slider
                  value={tempFilters.riskScoreRange || [0, 100]}
                  onValueChange={(value) => 
                    setTempFilters({ ...tempFilters, riskScoreRange: value as [number, number] })
                  }
                  max={100}
                  min={0}
                  step={1}
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
              <Label>评估日期范围</Label>
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
                placeholder="输入审核员ID或姓名"
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
          
          {tempFilters.targetType?.length && (
            <Badge variant="secondary" className="flex items-center gap-1">
              目标类型: {tempFilters.targetType.join(', ')}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => removeFilter('targetType')}
              />
            </Badge>
          )}
          
          {tempFilters.riskLevel?.length && (
            <Badge variant="secondary" className="flex items-center gap-1">
              风险等级: {tempFilters.riskLevel.join(', ')}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => removeFilter('riskLevel')}
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
          
          {tempFilters.dateRange?.length === 2 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              日期: {format(new Date(tempFilters.dateRange[0]), 'MM-dd', { locale: zhCN })} - {format(new Date(tempFilters.dateRange[1]), 'MM-dd', { locale: zhCN })}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => removeFilter('dateRange')}
              />
            </Badge>
          )}
          
          {tempFilters.riskScoreRange?.length === 2 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              评分: {tempFilters.riskScoreRange[0]}-{tempFilters.riskScoreRange[1]}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => removeFilter('riskScoreRange')}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}