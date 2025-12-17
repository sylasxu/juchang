import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * 表格加载骨架屏
 */
interface TableSkeletonProps {
  rows?: number
  columns?: number
}

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <div className="space-y-3">
      {/* 表头 */}
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      
      {/* 表格行 */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * 卡片加载骨架屏
 */
interface CardSkeletonProps {
  count?: number
  showHeader?: boolean
}

export function CardSkeleton({ count = 1, showHeader = true }: CardSkeletonProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          {showHeader && (
            <CardHeader>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </CardHeader>
          )}
          <CardContent className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/**
 * 统计卡片骨架屏
 */
export function StatCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/**
 * 图表加载骨架屏
 */
export function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-end space-x-1">
              {Array.from({ length: 12 }).map((_, j) => (
                <Skeleton 
                  key={j} 
                  className="flex-1" 
                  style={{ height: `${Math.random() * 100 + 20}px` }}
                />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * 列表项加载骨架屏
 */
export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  )
}

/**
 * 页面加载指示器
 */
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

export function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-muted-foreground`} />
      {text && (
        <p className="text-sm text-muted-foreground">{text}</p>
      )}
    </div>
  )
}

/**
 * 全屏加载遮罩
 */
interface LoadingOverlayProps {
  isVisible: boolean
  text?: string
}

export function LoadingOverlay({ isVisible, text = '加载中...' }: LoadingOverlayProps) {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  )
}

/**
 * 按钮加载状态
 */
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean
  loadingText?: string
  children: React.ReactNode
}

export function LoadingButton({ 
  isLoading, 
  loadingText, 
  children, 
  disabled,
  ...props 
}: LoadingButtonProps) {
  return (
    <Button disabled={isLoading || disabled} {...props}>
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isLoading ? (loadingText || '加载中...') : children}
    </Button>
  )
}

/**
 * 刷新按钮
 */
interface RefreshButtonProps {
  onRefresh: () => void
  isRefreshing: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function RefreshButton({ onRefresh, isRefreshing, size = 'md' }: RefreshButtonProps) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onRefresh}
      disabled={isRefreshing}
      className="p-2"
    >
      <RefreshCw className={`${sizeClasses[size]} ${isRefreshing ? 'animate-spin' : ''}`} />
    </Button>
  )
}

/**
 * 延迟加载组件
 */
interface LazyLoadProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  delay?: number
}

export function LazyLoad({ children, fallback, delay = 200 }: LazyLoadProps) {
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  if (!isVisible) {
    return <>{fallback || <LoadingSpinner />}</>
  }

  return <>{children}</>
}

/**
 * 分步加载组件
 */
interface ProgressiveLoadProps {
  steps: Array<{
    component: React.ReactNode
    delay: number
  }>
}

export function ProgressiveLoad({ steps }: ProgressiveLoadProps) {
  const [currentStep, setCurrentStep] = React.useState(0)

  React.useEffect(() => {
    if (currentStep < steps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1)
      }, steps[currentStep].delay)

      return () => clearTimeout(timer)
    }
  }, [currentStep, steps])

  return (
    <div>
      {steps.slice(0, currentStep + 1).map((step, index) => (
        <div key={index}>{step.component}</div>
      ))}
    </div>
  )
}