import { Plus, BarChart3 } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export function HotKeywordsPrimaryButtons() {
  const navigate = useNavigate()

  return (
    <div className='flex gap-2'>
      <Button
        variant='outline'
        onClick={() => navigate({ to: '/hot-keywords/analytics' })}
      >
        <BarChart3 className='mr-2 h-4 w-4' />
        数据分析
      </Button>
      <Button onClick={() => navigate({ to: '/hot-keywords/create' })}>
        <Plus className='mr-2 h-4 w-4' />
        创建热词
      </Button>
    </div>
  )
}
