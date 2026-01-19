import { createFileRoute } from '@tanstack/react-router'
import { TokenUsage } from '@/features/ai-ops/token-usage'

export const Route = createFileRoute('/_authenticated/ai-ops/usage')({
  component: TokenUsage,
})
