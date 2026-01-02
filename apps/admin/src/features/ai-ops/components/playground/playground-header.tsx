/**
 * PlaygroundHeader Component
 * 
 * Playground 顶部工具栏。
 * 参考 Requirements R6, R7, R23
 */

import { useState, useCallback, useEffect } from 'react'
import { 
  PanelRightOpen, 
  PanelRightClose, 
  Wallet, 
  RefreshCw, 
  FlaskConical,
  AlertTriangle,
  Loader2,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

/** 预设测试用例 */
const PRESET_TEST_CASES = [
  { label: '创建活动', prompt: '明晚观音桥打麻将，3缺1' },
  { label: '探索附近', prompt: '附近有什么活动' },
  { label: '修改草稿', prompt: '换个地方' },
  { label: '发布活动', prompt: '发布' },
]

interface PlaygroundHeaderProps {
  /** 追踪面板是否可见 */
  tracePanelVisible: boolean
  /** 切换追踪面板 */
  onToggleTracePanel: () => void
  /** 选择测试用例回调 */
  onSelectTestCase?: (prompt: string) => void
  /** 是否正在流式输出 */
  isStreaming?: boolean
}

export function PlaygroundHeader({
  tracePanelVisible,
  onToggleTracePanel,
  onSelectTestCase,
  isStreaming,
}: PlaygroundHeaderProps) {
  const [balance, setBalance] = useState<{ total: number; isAvailable: boolean } | null>(null)
  const [balanceLoading, setBalanceLoading] = useState(false)

  // 获取余额
  const fetchBalance = useCallback(async () => {
    setBalanceLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/ai/balance`)
      if (response.ok) {
        const data = await response.json()
        setBalance({
          total: parseFloat(data.balance_infos?.[0]?.total_balance || '0'),
          isAvailable: data.is_available,
        })
      }
    } catch (err) {
      console.error('获取余额失败:', err)
    } finally {
      setBalanceLoading(false)
    }
  }, [])

  // 初始加载余额
  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  const isLowBalance = balance && balance.total <= 0

  return (
    <div className='flex h-14 items-center justify-between border-b px-4'>
      {/* 左侧: Sidebar 收起按钮 + 标题 + 状态 */}
      <div className='flex items-center gap-3'>
        <SidebarTrigger variant='outline' className='max-md:scale-125' />
        <Separator orientation='vertical' className='h-6' />
        <h1 className='text-lg font-semibold'>AI Playground</h1>
        
        {/* 流式状态指示 */}
        {isStreaming && (
          <div className='flex items-center gap-1.5 text-xs text-primary'>
            <Loader2 className='h-3 w-3 animate-spin' />
            正在生成...
          </div>
        )}
      </div>

      {/* 右侧: 工具栏 */}
      <div className='flex items-center gap-2'>
        {/* 余额显示 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className='flex items-center gap-1.5'>
              <Wallet className='h-4 w-4 text-muted-foreground' />
              {balanceLoading ? (
                <Loader2 className='h-3 w-3 animate-spin' />
              ) : balance ? (
                <Badge 
                  variant={isLowBalance ? 'destructive' : 'secondary'}
                  className='font-mono text-xs'
                >
                  ¥{balance.total.toFixed(2)}
                </Badge>
              ) : (
                <span className='text-xs text-muted-foreground'>--</span>
              )}
              <Button
                variant='ghost'
                size='icon'
                className='h-6 w-6'
                onClick={fetchBalance}
                disabled={balanceLoading}
              >
                <RefreshCw className={cn('h-3 w-3', balanceLoading && 'animate-spin')} />
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>DeepSeek 余额</p>
            {isLowBalance && (
              <p className='text-destructive'>余额不足，请及时充值</p>
            )}
          </TooltipContent>
        </Tooltip>

        {/* 低余额警告 */}
        {isLowBalance && (
          <AlertTriangle className='h-4 w-4 text-destructive' />
        )}

        {/* 测试用例下拉 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline' size='sm' className='gap-1'>
              <FlaskConical className='h-3.5 w-3.5' />
              测试用例
              <ChevronDown className='h-3 w-3' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuLabel>预设用例</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {PRESET_TEST_CASES.map((testCase) => (
              <DropdownMenuItem
                key={testCase.label}
                onClick={() => onSelectTestCase?.(testCase.prompt)}
              >
                <span className='font-medium'>{testCase.label}</span>
                <span className='ml-2 text-xs text-muted-foreground'>
                  {testCase.prompt}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 追踪面板切换 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='icon'
              onClick={onToggleTracePanel}
            >
              {tracePanelVisible ? (
                <PanelRightClose className='h-4 w-4' />
              ) : (
                <PanelRightOpen className='h-4 w-4' />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tracePanelVisible ? '隐藏' : '显示'}执行追踪</p>
            <p className='text-xs text-muted-foreground'>⌘E</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
