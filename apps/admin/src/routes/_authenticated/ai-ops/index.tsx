import { createFileRoute } from '@tanstack/react-router'
import { PlaygroundLayout } from '@/features/ai-ops/components/playground/playground-layout'

export const Route = createFileRoute('/_authenticated/ai-ops/')({
  component: PlaygroundLayout,
})
