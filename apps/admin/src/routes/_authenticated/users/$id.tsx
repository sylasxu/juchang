import { createFileRoute } from '@tanstack/react-router'
import { UserDetail } from '@/features/users/components/user-detail'

export const Route = createFileRoute('/_authenticated/users/$id')({
  component: UserDetail,
})