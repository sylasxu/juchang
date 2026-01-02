import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/ai-ops/playground')({
  beforeLoad: () => {
    throw redirect({ to: '/ai-ops' })
  },
  component: () => null,
})
