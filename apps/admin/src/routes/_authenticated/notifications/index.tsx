import { createFileRoute } from '@tanstack/react-router'
import { Type, type Static } from '@sinclair/typebox'
import { NotificationsManagement } from '@/features/notifications'

// URL 搜索参数 Schema
const searchSchema = Type.Object({
  page: Type.Optional(Type.Number({ minimum: 1 })),
  pageSize: Type.Optional(Type.Number({ minimum: 1, maximum: 100 })),
  filter: Type.Optional(Type.String()),
  type: Type.Optional(Type.Array(Type.String())),
})

export type NotificationsSearchParams = Static<typeof searchSchema>

export const Route = createFileRoute('/_authenticated/notifications/')({
  component: NotificationsManagement,
  validateSearch: (search: Record<string, unknown>): NotificationsSearchParams => {
    return {
      page: search.page ? Number(search.page) : undefined,
      pageSize: search.pageSize ? Number(search.pageSize) : undefined,
      filter: search.filter as string | undefined,
      type: search.type as string[] | undefined,
    }
  },
})
