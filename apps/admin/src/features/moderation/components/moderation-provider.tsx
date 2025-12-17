import { createContext, useContext, useState, type ReactNode } from 'react'
import type { ModerationQueueItem, ModerationQueueFilters } from '@/hooks/use-moderation'

interface ModerationContextType {
  // 筛选状态
  filters: ModerationQueueFilters
  setFilters: (filters: ModerationQueueFilters) => void
  
  // 选择状态
  selectedItems: string[]
  setSelectedItems: (items: string[]) => void
  
  // 对话框状态
  actionDialogOpen: boolean
  setActionDialogOpen: (open: boolean) => void
  detailDialogOpen: boolean
  setDetailDialogOpen: (open: boolean) => void
  statsDialogOpen: boolean
  setStatsDialogOpen: (open: boolean) => void
  
  // 当前选中项
  selectedItem: ModerationQueueItem | null
  setSelectedItem: (item: ModerationQueueItem | null) => void
}

const ModerationContext = createContext<ModerationContextType | null>(null)

export function ModerationProvider({ children }: { children: ReactNode }) {
  // 筛选状态
  const [filters, setFilters] = useState<ModerationQueueFilters>({
    page: 1,
    limit: 20,
    sortBy: 'reportedAt',
    sortOrder: 'desc'
  })
  
  // 选择状态
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  
  // 对话框状态
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [statsDialogOpen, setStatsDialogOpen] = useState(false)
  
  // 当前选中项
  const [selectedItem, setSelectedItem] = useState<ModerationQueueItem | null>(null)

  const value: ModerationContextType = {
    filters,
    setFilters,
    selectedItems,
    setSelectedItems,
    actionDialogOpen,
    setActionDialogOpen,
    detailDialogOpen,
    setDetailDialogOpen,
    statsDialogOpen,
    setStatsDialogOpen,
    selectedItem,
    setSelectedItem,
  }

  return (
    <ModerationContext.Provider value={value}>
      {children}
    </ModerationContext.Provider>
  )
}

export function useModerationContext() {
  const context = useContext(ModerationContext)
  if (!context) {
    throw new Error('useModerationContext must be used within ModerationProvider')
  }
  return context
}