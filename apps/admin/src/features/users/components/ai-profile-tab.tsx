/**
 * AI Profile Tab - 用户 AI 画像 Tab
 * 
 * 显示用户的 AI 提取画像，包括偏好和常去地点
 */
import { useQuery } from '@tanstack/react-query'
import { Brain, MapPin, ThumbsUp, ThumbsDown, Minus, RefreshCw } from 'lucide-react'
import { api, unwrap } from '@/lib/eden'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AIProfileTabProps {
  userId: string
}

// 偏好类别中文映射
const categoryLabels: Record<string, string> = {
  food: '美食',
  activity_type: '活动类型',
  time: '时间偏好',
  location: '地点偏好',
  social: '社交偏好',
  other: '其他',
}

// 情感图标
const sentimentIcons = {
  positive: ThumbsUp,
  negative: ThumbsDown,
  neutral: Minus,
}

const sentimentColors = {
  positive: 'text-green-600',
  negative: 'text-red-600',
  neutral: 'text-gray-500',
}

export function AIProfileTab({ userId }: AIProfileTabProps) {
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['users', userId, 'ai-profile'],
    queryFn: () => unwrap(api.users({ id: userId })['ai-profile'].get()),
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            加载失败: {error.message}
          </p>
        </CardContent>
      </Card>
    )
  }

  const hasPreferences = data?.preferences && data.preferences.length > 0
  const hasLocations = data?.frequentLocations && data.frequentLocations.length > 0
  const isEmpty = !hasPreferences && !hasLocations

  return (
    <div className="space-y-6">
      {/* 头部信息 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <span className="text-sm text-muted-foreground">
            最后更新: {data?.lastAnalyzedAt 
              ? new Date(data.lastAnalyzedAt).toLocaleString('zh-CN')
              : '暂无数据'}
          </span>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          <RefreshCw className={cn("h-4 w-4 mr-1", isRefetching && "animate-spin")} />
          刷新
        </Button>
      </div>

      {isEmpty ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Brain className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">暂无画像数据</p>
              <p className="text-sm text-muted-foreground mt-1">
                用户与 AI 对话后会自动生成画像
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* 偏好列表 */}
          {hasPreferences && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ThumbsUp className="h-5 w-5" />
                  用户偏好
                </CardTitle>
                <CardDescription>
                  AI 从对话中提取的用户偏好信息
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.preferences.map((pref, index) => {
                    const SentimentIcon = sentimentIcons[pref.sentiment as keyof typeof sentimentIcons] || Minus
                    const sentimentColor = sentimentColors[pref.sentiment as keyof typeof sentimentColors] || 'text-gray-500'
                    
                    return (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <SentimentIcon className={cn("h-4 w-4", sentimentColor)} />
                          <div>
                            <p className="font-medium">{pref.content}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {categoryLabels[pref.category] || pref.category}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                置信度: {Math.round(pref.confidence * 100)}%
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(pref.updatedAt).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 常去地点 */}
          {hasLocations && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  常去地点
                </CardTitle>
                <CardDescription>
                  用户经常提及或活动的地点
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {data.frequentLocations.map((loc, index) => (
                    <Badge key={index} variant="secondary" className="text-sm py-1 px-3">
                      <MapPin className="h-3 w-3 mr-1" />
                      {loc.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
