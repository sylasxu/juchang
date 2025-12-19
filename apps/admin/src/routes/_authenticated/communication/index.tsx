import { createFileRoute } from '@tanstack/react-router'
import { CommunicationManagement } from '@/features/communication-management'

export const Route = createFileRoute('/_authenticated/communication/')({
  component: CommunicationManagement,
})