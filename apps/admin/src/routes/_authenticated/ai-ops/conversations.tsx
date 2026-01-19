import { createFileRoute } from '@tanstack/react-router'
import { Type, type Static } from '@sinclair/typebox'
import { Conversations } from '@/features/conversations'

// URL 搜索参数 Schema
const searchSchema = Type.Object({
  page: Type.Optional(Type.Number({ minimum: 1 })),
  pageSize: Type.Optional(Type.Number({ minimum: 1, maximum: 100 })),
  search: Type.Optional(Type.String()),
  hasError: Type.Optional(Type.Array(Type.String())),
})

export type ConversationsSearchParams = Static<typeof searchSchema>

export const Route = createFileRoute('/_authenticated/ai-ops/conversations')({
  component: Conversations,
  validateSearch: (search: Record<string, unknown>): ConversationsSearchParams => {
    const pageSize = search.pageSize ? Number(search.pageSize) : undefined
    return {
      page: search.page ? Number(search.page) : undefined,
      pageSize: pageSize && pageSize <= 100 ? pageSize : undefined,
      search: search.search as string | undefined,
      hasError: search.hasError as string[] | undefined,
    }
  },
})
