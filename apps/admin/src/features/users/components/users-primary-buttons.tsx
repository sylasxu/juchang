import { RefreshCw } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { userKeys } from '../hooks/use-users'

export function UsersPrimaryButtons() {
  const queryClient = useQueryClient()

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: userKeys.all })
  }

  return (
    <div className='flex gap-2'>
      <Button
        variant='outline'
        className='space-x-1'
        onClick={handleRefresh}
      >
        <RefreshCw size={18} />
        <span>刷新</span>
      </Button>
    </div>
  )
}
