import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ModerationStats } from './moderation-stats'

interface ModerationStatsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ModerationStatsDialog({ 
  open, 
  onOpenChange 
}: ModerationStatsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>审核统计分析</DialogTitle>
          <DialogDescription>
            查看详细的审核数据统计和分析报告
          </DialogDescription>
        </DialogHeader>
        
        <ModerationStats />
      </DialogContent>
    </Dialog>
  )
}