import { createContext, useContext, useState, type ReactNode } from 'react'

interface FraudFilters {
  fraudType?: string[]
  status?: string[]
  confidence?: [number, number]
  detectionMethod?: string[]
  dateRange?: [string, string]
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

interface FraudContextType {
  // 筛选状态
  filters: FraudFilters
  setFilters: (filters: FraudFilters) => void
  
  // 选择状态
  selectedItems: string[]
  setSelectedItems: (items: string[]) => void
  
  // 对话框状态
  detailDialogOpen: boolean
  setDetailDialogOpen: (open: boolean) => void
  confirmDialogOpen: boolean
  setConfirmDialogOpen: (open: boolean) => void
  
  // 当前选中项
  selectedFraud: any | null
  setSelectedFraud: (fraud: any | null) => void
}

const FraudContext = createContext<FraudContextType | null>(null)

export function FraudProvider({ children }: { children: ReactNode }) {
  // 筛选状态
  const [filters, setFilters] = useState<FraudFilters>({
    page: 1,
    limit: 20,
    sortBy: 'detectedAt',
    sortOrder: 'desc'
  })
  
  // 选择状态
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  
  // 对话框状态
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  
  // 当前选中项
  const [selectedFraud, setSelectedFraud] = useState<any | null>(null)

  const value: FraudContextType = {
    filters,
    setFilters,
    selectedItems,
    setSelectedItems,
    detailDialogOpen,
    setDetailDialogOpen,
    confirmDialogOpen,
    setConfirmDialogOpen,
    selectedFraud,
    setSelectedFraud,
  }

  return (
    <FraudContext.Provider value={value}>
      {children}
    </FraudContext.Provider>
  )
}

export function useFraudContext() {
  const context = useContext(FraudContext)
  if (!context) {
    throw new Error('useFraudContext must be used within FraudProvider')
  }
  return context
}