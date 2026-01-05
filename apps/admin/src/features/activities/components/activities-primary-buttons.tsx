import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useActivities } from './activities-provider'

export function ActivitiesPrimaryButtons() {
  const { setOpen } = useActivities()
  return (
    <Button className='space-x-1' onClick={() => setOpen('create')}>
      <span>创建</span> <Plus size={18} />
    </Button>
  )
}