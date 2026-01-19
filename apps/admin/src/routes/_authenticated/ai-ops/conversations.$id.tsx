import { createFileRoute } from '@tanstack/react-router'
import { ConversationDetail } from '@/features/ai-ops/conversation-detail'

export const Route = createFileRoute('/_authenticated/ai-ops/conversations/$id')({
  component: ConversationDetail,
})
