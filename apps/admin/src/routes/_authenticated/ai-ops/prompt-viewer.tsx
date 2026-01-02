import { createFileRoute } from '@tanstack/react-router'
import { PromptViewer } from '@/features/ai-ops/prompt-viewer'

export const Route = createFileRoute('/_authenticated/ai-ops/prompt-viewer')({
  component: PromptViewer,
})
