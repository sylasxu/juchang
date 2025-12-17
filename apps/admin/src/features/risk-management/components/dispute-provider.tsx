import { createContext, useContext, useState, type ReactNode } from 'react'

interface DisputeFilters {
  type?: string[]
  status?: string[]
  priority?: string[]
  assignedTo?: string
  dateRange?: [string, string]
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

interface DisputeContextType {
  // 筛选状态
  filters: DisputeFilters
  setFilters: (filters: DisputeFilters) => void
  
  // 选择状态
  selectedItems: string[]
  setSelectedItems: (items: string[]) => void
  
  // 对话框状态
  detailDialogOpen: boolean
  setDetailDialogOpen: (open: boolean) => void
  resolutionDialogOpen: boolean
  setResolutionDialogOpen: (open: boolean) => void
  escalationDialogOpen: boolean
  setEscalationDialogOpen: (open: boolean) => void
  
  // 当前选中项
  selectedDispute: any | null
  setSelectedDispute: (dispute: any | null) => void
}

const DisputeContext = createContext<DisputeContextType | null>(null)

export function DisputeProvider({ children }: { children: ReactNode }) {
  // 筛选状态
  const [filters, setFilters] = useState<DisputeFilters>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
  
  // 选择状态
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  
  // 对话框状态
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [resolutionDialogOpen, setResolutionDialogOpen] = useState(false)
  const [escalationDialogOpen, setEscalationDialogOpen] = useState(false)
  
  // 当前选中项
  const [selectedDispute, setSelectedDispute] = useState<any | null>(null)

  const value: DisputeContextType = {
    filters,
    setFilters,
    selectedItems,
    setSelectedItems,
    detailDialogOpen,
    setDetailDialogOpen,
    resolutionDialogOpen,
    setResolutionDialogOpen,
    escalationDialogOpen,
    setEscalationDialogOpen,
    selectedDispute,
    setSelectedDispute,
  }

  return (
    <DisputeContext.Provider value={value}>
      {children}
    </DisputeContext.Provider>
  )
}

export function useDisputeContext() {
  const context = useContext(DisputeContext)
  if (!context) {
    throw new Error('useDisputeContext must be used within DisputeProvider')
  }
  return context
}