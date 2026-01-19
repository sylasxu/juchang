import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/ai-ops/')({
  beforeLoad: () => {
    throw redirect({ to: '/ai-ops/playground' })
  },
  component: () => null,
})
