import { Type, type Static } from '@sinclair/typebox'
import { createFileRoute } from '@tanstack/react-router'
import { Reports } from '@/features/reports'

const reportsSearchSchema = Type.Object({
  page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
  pageSize: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 10 })),
  status: Type.Optional(
    Type.Array(
      Type.Union([
        Type.Literal('pending'),
        Type.Literal('resolved'),
        Type.Literal('ignored'),
      ])
    )
  ),
  type: Type.Optional(
    Type.Array(
      Type.Union([
        Type.Literal('activity'),
        Type.Literal('message'),
        Type.Literal('user'),
      ])
    )
  ),
  filter: Type.Optional(Type.String()),
})

export type ReportsSearchParams = Static<typeof reportsSearchSchema>

export const Route = createFileRoute('/_authenticated/reports/')({
  validateSearch: (search: Record<string, unknown>): ReportsSearchParams => ({
    page: typeof search.page === 'number' ? search.page : 1,
    pageSize: typeof search.pageSize === 'number' ? search.pageSize : 10,
    status: Array.isArray(search.status)
      ? (search.status as ReportsSearchParams['status'])
      : undefined,
    type: Array.isArray(search.type)
      ? (search.type as ReportsSearchParams['type'])
      : undefined,
    filter: typeof search.filter === 'string' ? search.filter : undefined,
  }),
  component: Reports,
})
