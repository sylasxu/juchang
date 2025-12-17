import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { type Content } from '../data/schema'

type ContentDialogType = 'create' | 'update' | 'delete' | 'import'

type ContentContextType = {
  open: ContentDialogType | null
  setOpen: (str: ContentDialogType | null) => void
  currentRow: Content | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Content | null>>
}

const ContentContext = React.createContext<ContentContextType | null>(null)

export function ContentProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<ContentDialogType>(null)
  const [currentRow, setCurrentRow] = useState<Content | null>(null)

  return (
    <ContentContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </ContentContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useContent = () => {
  const contentContext = React.useContext(ContentContext)

  if (!contentContext) {
    throw new Error('useContent has to be used within <ContentContext>')
  }

  return contentContext
}