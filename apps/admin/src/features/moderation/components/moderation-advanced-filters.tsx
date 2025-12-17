import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { CalendarIcon, Filter, X } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { ModerationQueueFilters } from '@/hooks/use-moderation'

interface ModerationAdvancedFiltersProps {
  filters: ModerationQueueFilters
  onFiltersChange: (filters: Partial<ModerationQueueFilters>) => void
}

export function ModerationAdvancedFilters({ 
  filters, 
  onFiltersChange 
}: ModerationAdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [tempFilters, setTempFilters] = useState<ModerationQueueFilters>(filters)

  const handleApplyFilters = () => {
    onFiltersChange(tempFilters)
    setIsOpen(false)
  }

  const handleResetFilters = () => {
    const resetFilters: Partial<ModerationQueueFilters> = {
      type: undefined,
      dateRange: undefined,
      riskScoreRange: undefined,
    }
    setTempFilters(prev => ({ ...prev, ...resetFilters }))
    onFiltersChange(resetFilters)
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <Filter className="mr-2 h-4 w-4" />
          高级筛选
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
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
  )
}