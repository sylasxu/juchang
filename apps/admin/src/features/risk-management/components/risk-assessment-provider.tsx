import { createContext, useContext, useState, type ReactNode } from 'react'
import type { RiskAssessmentFilters } from '@/hooks/use-risk-management'

interface RiskAssessmentContextType {
  // 筛选状态
  filters: RiskAssessmentFilters
  setFilters: (filters: RiskAssessmentFilters) => void
  
  // 选择状态
  selectedItems: string[]
  setSelectedItems: (items: string[]) => void
  
  // 对话框状态
  detailDialogOpen: boolean
  setDetailDialogOpen: (open: boolean) => void
  mitigationDialogOpen: boolean
  setMitigationDialogOpen: (open: boolean) => void
  
  // 当前选中项
  selectedAssessment: any | null
  setSelectedAssessment: (assessment: any | null) => void
  
  // 视图模式
  viewMode: 'table' | 'cards'
  setViewMode: (mode: 'table' | 'cards') => void
}

const RiskAssessmentContext = createContext<RiskAssessmentContextType | null>(null)

export function RiskAssessmentProvider({ children }: { children: ReactNode }) {
  // 筛选状态
  const [filters, setFilters] = useState<RiskAssessmentFilters>({
    page: 1,
    limit: 20,
    sortBy: 'assessmentDate',
    sortOrder: 'desc'
  })
  
  // 选择状态
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  
  // 对话框状态
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [mitigationDialogOpen, setMitigationDialogOpen] = useState(false)
  
  // 当前选中项
  const [selectedAssessment, setSelectedAssessment] = useState<any | null>(null)
  
  // 视图模式
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')

  const value: RiskAssessmentContextType = {
    filters,
    setFilters,
    selectedItems,
    setSelectedItems,
    detailDialogOpen,
    setDetailDialogOpen,
    mitigationDialogOpen,
    setMitigationDialogOpen,
    selectedAssessment,
    setSelectedAssessment,
    viewMode,
    setViewMode,
  }

  return (
    <RiskAssessmentContext.Provider value={value}>
      {children}
    </RiskAssessmentContext.Provider>
  )
}

export function useRiskAssessmentContext() {
  const context = useContext(RiskAssessmentContext)
  if (!context) {
    throw new Error('useRiskAssessmentContext must be used within RiskAssessmentProvider')
  }
  return context
}