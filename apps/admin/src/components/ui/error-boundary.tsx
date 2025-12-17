import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  AlertTriangle, 
  RefreshCw, 
  Bug, 
  Home,
  ChevronDown,
  ChevronUp,
  Copy,
  CheckCircle
} from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  showDetails: boolean
}

/**
 * 错误边界组件
 * 捕获并处理 React 组件树中的错误
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    })

    // 调用错误回调
    this.props.onError?.(error, errorInfo)

    // 记录错误到控制台
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    })
  }

  handleToggleDetails = () => {
    this.setState(prev => ({
      showDetails: !prev.showDetails,
    }))
  }

  handleCopyError = async () => {
    const { error, errorInfo } = this.state
    const errorText = `
Error: ${error?.message}
Stack: ${error?.stack}
Component Stack: ${errorInfo?.componentStack}
    `.trim()

    try {
      await navigator.clipboard.writeText(errorText)
      // 可以添加成功提示
    } catch (err) {
      console.error('Failed to copy error details:', err)
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                出现了一个错误
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <Bug className="h-4 w-4" />
                <AlertDescription>
                  {this.state.error?.message || '未知错误'}
                </AlertDescription>
              </Alert>

              <div className="flex flex-wrap gap-2">
                <Button onClick={this.handleRetry} size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  重试
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.href = '/'}
                >
                  <Home className="h-4 w-4 mr-2" />
                  返回首页
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={this.handleToggleDetails}
                >
                  {this.state.showDetails ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-2" />
                      隐藏详情
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-2" />
                      显示详情
                    </>
                  )}
                </Button>

                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={this.handleCopyError}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  复制错误信息
                </Button>
              </div>

              {this.state.showDetails && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">错误堆栈</h4>
                    <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-40">
                      {this.state.error?.stack}
                    </pre>
                  </div>
                  
                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">组件堆栈</h4>
                      <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-40">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * 异步错误边界 Hook
 * 用于捕获异步操作中的错误
 */
export function useAsyncError() {
  const [, setError] = React.useState()
  
  return React.useCallback((error: Error) => {
    setError(() => {
      throw error
    })
  }, [])
}

/**
 * 网络错误组件
 */
interface NetworkErrorProps {
  error: Error
  onRetry?: () => void
  showRetry?: boolean
}

export function NetworkError({ error, onRetry, showRetry = true }: NetworkErrorProps) {
  const getErrorMessage = (error: Error) => {
    if (error.message.includes('fetch')) {
      return '网络连接失败，请检查您的网络连接'
    }
    if (error.message.includes('timeout')) {
      return '请求超时，请稍后重试'
    }
    if (error.message.includes('404')) {
      return '请求的资源不存在'
    }
    if (error.message.includes('500')) {
      return '服务器内部错误，请稍后重试'
    }
    return error.message || '网络请求失败'
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">网络错误</h3>
        <p className="text-muted-foreground mb-4">
          {getErrorMessage(error)}
        </p>
      </div>
      
      {showRetry && onRetry && (
        <Button onClick={onRetry} size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          重试
        </Button>
      )}
    </div>
  )
}

/**
 * 空状态组件
 */
interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
      {icon && (
        <div className="text-muted-foreground">
          {icon}
        </div>
      )}
      <div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
      {action && action}
    </div>
  )
}

/**
 * 权限错误组件
 */
export function PermissionError() {
  return (
    <EmptyState
      icon={<AlertTriangle className="h-12 w-12" />}
      title="访问被拒绝"
      description="您没有访问此页面的权限，请联系管理员"
      action={
        <Button variant="outline" onClick={() => window.history.back()}>
          返回上一页
        </Button>
      }
    />
  )
}

/**
 * 404 错误组件
 */
export function NotFoundError() {
  return (
    <EmptyState
      icon={<AlertTriangle className="h-12 w-12" />}
      title="页面不存在"
      description="您访问的页面不存在或已被删除"
      action={
        <Button onClick={() => window.location.href = '/'}>
          <Home className="h-4 w-4 mr-2" />
          返回首页
        </Button>
      }
    />
  )
}

/**
 * 成功状态组件
 */
interface SuccessStateProps {
  title: string
  description?: string
  action?: React.ReactNode
}

export function SuccessState({ title, description, action }: SuccessStateProps) {
  return (
    <EmptyState
      icon={<CheckCircle className="h-12 w-12 text-green-500" />}
      title={title}
      description={description}
      action={action}
    />
  )
}