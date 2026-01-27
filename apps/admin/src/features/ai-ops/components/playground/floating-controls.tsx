/**
 * FloatingControls Component
 * 
 * 浮动控制按钮组，固定在右上角
 */

import { Settings, MessageSquare, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface FloatingControlsProps {
  onOpenSettings: () => void
  onOpenChat: () => void
  onClear: () => void
}

export function FloatingControls({
  onOpenSettings,
  onOpenChat,
  onClear,
}: FloatingControlsProps) {
  return (
    <TooltipProvider>
      <div className='fixed right-4 top-4 z-40 flex gap-2'>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='secondary'
              size='icon'
              className='h-10 w-10 rounded-full bg-background/80 shadow-lg backdrop-blur-sm hover:bg-background'
              onClick={onOpenSettings}
            >
              <Settings className='h-5 w-5' />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>设置</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='secondary'
              size='icon'
              className='h-10 w-10 rounded-full bg-background/80 shadow-lg backdrop-blur-sm hover:bg-background'
              onClick={onOpenChat}
            >
              <MessageSquare className='h-5 w-5' />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>发送消息</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='secondary'
              size='icon'
              className='h-10 w-10 rounded-full bg-background/80 shadow-lg backdrop-blur-sm hover:bg-background'
              onClick={onClear}
            >
              <Trash2 className='h-5 w-5' />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>清空</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
