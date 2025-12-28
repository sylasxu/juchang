import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { type Activity } from '../data/schema'

type ActivitiesDialogType = 'create' | 'update' | 'delete' | 'import' | 'prompt'

type ActivitiesContextType = {
  open: ActivitiesDialogType | null
  setOpen: (str: ActivitiesDialogType | null) => void
  currentRow: Activity | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Activity | null>>
}

const ActivitiesContext = React.createContext<ActivitiesContextType | null>(null)

export function ActivitiesProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<ActivitiesDialogType>(null)
  const [currentRow, setCurrentRow] = useState<Activity | null>(null)

  return (
    <ActivitiesContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </ActivitiesContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useActivities = () => {
  const activitiesContext = React.useContext(ActivitiesContext)

  if (!activitiesContext) {
    throw new Error('useActivities has to be used within <ActivitiesContext>')
  }

  return activitiesContext
}