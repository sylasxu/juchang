import { createFileRoute } from '@tanstack/react-router'
import { Type, type Static } from '@sinclair/typebox'
import { QuotaManagement } from '@/features/ai-ops/quota'

// URL 搜索参数 Schema
const searchSchema = Type.Object({
  page: Type.Optional(Type.Number({ minimum: 1 })),
  pageSize: Type.Optional(Type.Number({ minimum: 1, maximum: 100 })),
  filter: Type.Optional(Type.String()),
  status: Type.Optional(Type.Array(Type.String())),
})

export type QuotaSearchParams = Static<typeof searchSchema>

export const Route = createFileRoute('/_authenticated/ai-ops/quota')({
  component: QuotaManagement,
  validateSearch: (search: Record<string, unknown>): QuotaSearchParams => {
    return {
      page: search.page ? Number(search.page) : undefined,
      pageSize: search.pageSize ? Number(search.pageSize) : undefined,
      filter: search.filter as string | undefined,
      status: search.status as string[] | undefined,
    }
  },
})
