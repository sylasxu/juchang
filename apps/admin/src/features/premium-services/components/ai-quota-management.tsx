import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useAIQuotaUsage, useAdjustAIQuota, useResetUserQuota } from '@/hooks/use-premium-services'
import { 
  Bot, 
  MessageSquare, 
  Lightbulb, 
  Languages, 
  Shield,
  Clock,
  TrendingUp,
  Users,
  Settings,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import type { AIQuotaData } from '@/types/api'

interface QuotaAdjustmentData {
  userId?: string
  serviceType: string
  quotaChange: number
  reason: string
}

export function AIQuotaManagement() {
  const { data: quotaUsage, isLoading } = useAIQuotaUsage()
  const adjustQuota = useAdjustAIQuota()
  const resetQuota = useResetUserQuota()
  
  const [adjustmentData, setAdjustmentData] = useState<QuotaAdjustmentData>({
    serviceType: '',
    quotaChange: 0,
    reason: '',
  })
  const [resetData, setResetData] = useState({
    userId: '',
    serviceType: '',
    reason: '',
  })

  const serviceIcons = {
    chatbot: MessageSquare,
    recommendation: Lightbulb,
    translation: Languages,
    moderation: Shield,
  }

  const serviceNames = {
    chatbot: 'AI聊天助手',
    recommendation: '智能推荐',
    translation: '翻译服务',
    moderation: '内容审核',
  }

  const handleAdjustQuota = async () => {
    if (!adjustmentData.serviceType || !adjustmentData.reason) {
      toast.error('请填写完整的调整信息')
      return
    }

    try {
      await adjustQuota.mutateAsync(adjustmentData)
      setAdjustmentData({
        serviceType: '',
        quotaChange: 0,
        reason: '',
      })
    } catch (error) {
      console.error('调整配额失败:', error)
    }
  }

  const handleResetQuota = async () => {
    if (!resetData.userId || !resetData.serviceType || !resetData.reason) {
      toast.error('请填写完整的重置信息')
      return
    }

    try {
      await resetQuota.mutateAsync(resetData)
      setResetData({
        userId: '',
        serviceType: '',
        reason: '',
      })
    } catch (error) {
      console.error('重置配额失败:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!quotaUsage) return null

  const quotaData = quotaUsage as AIQuotaData
  const usagePercentage = (quotaData.usedQuota / quotaData.totalQuota) * 100

  return (
    <div className="space-y-6">
      {/* 总体配额概览 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总配额</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quotaData.totalQuota.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              AI服务总配额
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已使用</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quotaData.usedQuota.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              使用率 {usagePercentage.toFixed(1)}%
            </div>
            <Progress value={usagePercentage} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">剩余配额</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quotaData.remainingQuota.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              可用配额
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 各服务使用情况 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            各服务使用情况
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(quotaData.usageByService).map(([service, usage]) => {
              const IconComponent = serviceIcons[service as keyof typeof serviceIcons]
              const serviceName = serviceNames[service as keyof typeof serviceNames]
              const usageNumber = typeof usage === 'number' ? usage : 0
              const percentage = (usageNumber / quotaData.totalQuota) * 100
              
              return (
                <div key={service} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{serviceName}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {usageNumber.toLocaleString()}
                    </Badge>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  <div className="text-xs text-muted-foreground text-right">
                    {percentage.toFixed(1)}% of total
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 使用模式分析 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              每日使用模式
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {quotaData.usagePatterns.slice(-7).map((day, index) => {
                const maxUsage = Math.max(...quotaData.usagePatterns.map(d => d.usage))
                const percentage = (day.usage / maxUsage) * 100
                
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {new Date(day.date).toLocaleDateString()}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {day.usage.toLocaleString()}
                      </Badge>
                    </div>
                    <Progress value={percentage} className="h-1" />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              高使用量用户
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {quotaUsage.topUsers.slice(0, 5).map((user, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium">{user.nickname}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {user.usage.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {user.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 配额管理操作 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              调整配额
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="user-id">用户ID (可选)</Label>
                  <Input
                    id="user-id"
                    placeholder="留空为全局调整"
                    value={adjustmentData.userId || ''}
                    onChange={(e) => setAdjustmentData({ 
                      ...adjustmentData, 
                      userId: e.target.value || undefined 
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="service-type">服务类型</Label>
                  <Select
                    value={adjustmentData.serviceType}
                    onValueChange={(value) => setAdjustmentData({ 
                      ...adjustmentData, 
                      serviceType: value 
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择服务" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(serviceNames).map(([key, name]) => (
                        <SelectItem key={key} value={key}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="quota-change">配额变更</Label>
                <Input
                  id="quota-change"
                  type="number"
                  placeholder="正数增加，负数减少"
                  value={adjustmentData.quotaChange}
                  onChange={(e) => setAdjustmentData({ 
                    ...adjustmentData, 
                    quotaChange: Number(e.target.value) 
                  })}
                />
              </div>
              
              <div>
                <Label htmlFor="adjust-reason">调整原因</Label>
                <Textarea
                  id="adjust-reason"
                  placeholder="请说明调整原因"
                  value={adjustmentData.reason}
                  onChange={(e) => setAdjustmentData({ 
                    ...adjustmentData, 
                    reason: e.target.value 
                  })}
                  rows={3}
                />
              </div>
              
              <Button
                onClick={handleAdjustQuota}
                disabled={adjustQuota.isPending}
                className="w-full"
              >
                <Settings className="h-4 w-4 mr-2" />
                调整配额
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              重置用户配额
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="reset-user-id">用户ID</Label>
                <Input
                  id="reset-user-id"
                  placeholder="输入用户ID"
                  value={resetData.userId}
                  onChange={(e) => setResetData({ 
                    ...resetData, 
                    userId: e.target.value 
                  })}
                />
              </div>
              
              <div>
                <Label htmlFor="reset-service-type">服务类型</Label>
                <Select
                  value={resetData.serviceType}
                  onValueChange={(value) => setResetData({ 
                    ...resetData, 
                    serviceType: value 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择服务" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(serviceNames).map(([key, name]) => (
                      <SelectItem key={key} value={key}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="reset-reason">重置原因</Label>
                <Textarea
                  id="reset-reason"
                  placeholder="请说明重置原因"
                  value={resetData.reason}
                  onChange={(e) => setResetData({ 
                    ...resetData, 
                    reason: e.target.value 
                  })}
                  rows={3}
                />
              </div>
              
              <Button
                onClick={handleResetQuota}
                disabled={resetQuota.isPending}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                重置配额
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}