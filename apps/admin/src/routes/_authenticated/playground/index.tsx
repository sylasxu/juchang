import { createFileRoute } from '@tanstack/react-router'
import { AIPlayground } from '@/features/ai-playground'

export const Route = createFileRoute('/_authenticated/playground/')({
  component: AIPlayground,
})
