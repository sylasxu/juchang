import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useListContext } from '@/components/list-page'
import { type Activity } from '../data/schema'
import { type ActivityDialogType } from './activities-columns'

export function ActivitiesPrimaryButtons() {
  const { setOpen } = useListContext<Activity, ActivityDialogType>()
  return (
    <Button className='space-x-1' onClick={() => setOpen('create')}>
      <span>创建</span> <Plus size={18} />
    </Button>
  )
}