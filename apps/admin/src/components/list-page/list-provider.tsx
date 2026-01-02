import React, { useState, createContext, useContext } from 'react'
import useDialogState from '@/hooks/use-dialog-state'

interface ListContextValue<TData, TDialogType extends string> {
  open: TDialogType | null
  setOpen: (type: TDialogType | null) => void
  currentRow: TData | null
  setCurrentRow: React.Dispatch<React.SetStateAction<TData | null>>
}

const ListContext = createContext<ListContextValue<unknown, string> | null>(null)

interface ListProviderProps {
  children: React.ReactNode
}

export function ListProvider<TData, TDialogType extends string>({
  children,
}: ListProviderProps) {
  const [open, setOpen] = useDialogState<TDialogType>(null)
  const [currentRow, setCurrentRow] = useState<TData | null>(null)

  return (
    <ListContext.Provider
      value={{
        open,
        setOpen,
        currentRow,
        setCurrentRow,
      } as ListContextValue<unknown, string>}
    >
      {children}
    </ListContext.Provider>
  )
}

export function useListContext<TData, TDialogType extends string>() {
  const context = useContext(ListContext)

  if (!context) {
    throw new Error('useListContext must be used within ListProvider')
  }

  // Use unknown first to avoid type narrowing issues
  return context as unknown as ListContextValue<TData, TDialogType>
}
