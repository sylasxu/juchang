import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Activity, 
  Zap, 
  Clock, 
  Cpu, 
  HardDrive, 
  Wifi,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface PerformanceMetrics {
  // 页面性能指标
  fcp: number // First Contentful Paint
  lcp: number // Largest Contentful Paint
  fid: number // First Input Delay
  cls: number // Cumulative Layout Shift
  ttfb: number // Time to First Byte

  // 资源使用情况
  memoryUsage: number
  jsHeapSize: number
  domNodes: number
  
  // 网络状态
  connectionType: string
  effectiveType: string
  downlink: number
  rtt: number
}

interface PerformanceThresholds {
  fcp: { good: number; poor: number }
  lcp: { good: number; poor: number }
  fid: { good: number; poor: number }
  cls: { good: number; poor: number }
  ttfb: { good: number; poor: number }
}

const thresholds: PerformanceThresholds = {
  fcp: { good: 1800, poor: 3000 },
  lcp: { good: 2500, poor: 4000 },
  fid: { good: 100, poor: 300 },
  cls: { good: 0.1, poor: 0.25 },
  ttfb: { good: 800, poor: 1800 },
}

/**
 * 性能监控组件
 * 实时监控页面性能指标
 */
export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  // 获取性能指标
  const collectMetrics = useCallback(() => {
    if (!window.performance) return

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const paint = performance.getEntriesByType('paint')
    
    // Web Vitals 指标
    const fcp = paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0
    
    // 内存使用情况
    const memory = (performance as any).memory
    const memoryUsage = memory ? (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100 : 0
    const jsHeapSize = memory ? memory.usedJSHeapSize / 1024 / 1024 : 0 // MB
    
    // DOM 节点数量
    const domNodes = document.querySelectorAll('*').length
    
    // 网络信息
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    
    setMetrics({
      fcp,
      lcp: 0, // 需要通过 PerformanceObserver 获取
      fid: 0, // 需要通过 PerformanceObserver 获取
      cls: 0, // 需要通过 PerformanceObserver 获取
      ttfb: navigation?.responseStart - navigation?.requestStart || 0,
      memoryUsage,
      jsHeapSize,
      domNodes,
      connectionType: connection?.type || 'unknown',
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0,
    })
  }, [])

  // 获取性能等级
  const getPerformanceGrade = (value: number, metric: keyof PerformanceThresholds): 'good' | 'needs-improvement' | 'poor' => {
    const threshold = thresholds[metric]
    if (value <= threshold.good) return 'good'
    if (value <= threshold.poor) return 'needs-improvement'
    return 'poor'
  }

  // 格式化数值
  const formatValue = (value: number, unit: string): string => {
    if (unit === 'ms') {
      return `${Math.round(value)}ms`
    }
    if (unit === 'MB') {
      return `${value.toFixed(1)}MB`
    }
    if (unit === '%') {
      return `${Math.round(value)}%`
    }
    return value.toString()
  }

  // 获取状态图标
  const getStatusIcon = (grade: string) => {
    switch (grade) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'needs-improvement':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'poor':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  // 获取状态颜色
  const getStatusColor = (grade: string) => {
    switch (grade) {
      case 'good':
        return 'bg-green-500'
      case 'needs-improvement':
        return 'bg-yellow-500'
      case 'poor':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  useEffect(() => {
    // 页面加载完成后收集指标
    if (document.readyState === 'complete') {
      collectMetrics()
    } else {
      window.addEventListener('load', collectMetrics)
    }

    // 定期更新指标
    const interval = setInterval(collectMetrics, 5000)

    return () => {
      window.removeEventListener('load', collectMetrics)
      clearInterval(interval)
    }
  }, [collectMetrics])

  if (!metrics) return null

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${isVisible ? 'translate-x-0' : 'translate-x-full'}`}>
      {/* 切换按钮 */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="absolute -left-12 top-4 bg-blue-500 text-white p-2 rounded-l-lg shadow-lg hover:bg-blue-600 transition-colors"
        title="性能监控"
      >
        <Activity className="h-4 w-4" />
      </button>

      {/* 性能面板 */}
      <Card className="w-80 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4" />
            性能监控
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Core Web Vitals */}
          <div>
            <h4 className="text-sm font-medium mb-2">Core Web Vitals</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(getPerformanceGrade(metrics.fcp, 'fcp'))}
                  <span className="text-sm">FCP</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {formatValue(metrics.fcp, 'ms')}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(getPerformanceGrade(metrics.ttfb, 'ttfb'))}
                  <span className="text-sm">TTFB</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {formatValue(metrics.ttfb, 'ms')}
                </Badge>
              </div>
            </div>
          </div>

          {/* 资源使用 */}
          <div>
            <h4 className="text-sm font-medium mb-2">资源使用</h4>
            <div className="space-y-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-3 w-3" />
                    <span className="text-xs">内存使用</span>
                  </div>
                  <span className="text-xs">{formatValue(metrics.memoryUsage, '%')}</span>
                </div>
                <Progress value={metrics.memoryUsage} className="h-1" />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-3 w-3" />
                  <span className="text-xs">JS 堆大小</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {formatValue(metrics.jsHeapSize, 'MB')}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  <span className="text-xs">DOM 节点</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {metrics.domNodes}
                </Badge>
              </div>
            </div>
          </div>

          {/* 网络状态 */}
          <div>
            <h4 className="text-sm font-medium mb-2">网络状态</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wifi className="h-3 w-3" />
                  <span className="text-xs">连接类型</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {metrics.effectiveType}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs">下行速度</span>
                <Badge variant="outline" className="text-xs">
                  {metrics.downlink} Mbps
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs">RTT</span>
                <Badge variant="outline" className="text-xs">
                  {metrics.rtt}ms
                </Badge>
              </div>
            </div>
          </div>

          {/* 性能建议 */}
          {(metrics.memoryUsage > 80 || metrics.domNodes > 3000) && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                {metrics.memoryUsage > 80 && '内存使用率过高，建议优化组件渲染。'}
                {metrics.domNodes > 3000 && 'DOM 节点过多，建议使用虚拟滚动。'}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * 性能监控 Hook
 * 用于在组件中监控性能
 */
export function usePerformanceMonitor() {
  const [renderTime, setRenderTime] = useState(0)
  const [renderCount, setRenderCount] = useState(0)

  useEffect(() => {
    const startTime = performance.now()
    setRenderCount(prev => prev + 1)
    
    return () => {
      const endTime = performance.now()
      setRenderTime(endTime - startTime)
    }
  })

  const logPerformance = useCallback((componentName: string) => {
    console.log(`[Performance] ${componentName} - Render #${renderCount} took ${renderTime.toFixed(2)}ms`)
  }, [renderTime, renderCount])

  return { renderTime, renderCount, logPerformance }
}