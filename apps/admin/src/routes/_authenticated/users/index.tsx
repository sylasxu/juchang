import { Type, type Static } from '@sinclair/typebox'
import { createFileRoute } from '@tanstack/react-router'
import { Users } from '@/features/users'

const usersSearchSchema = Type.Object({
  page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
  pageSize: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 10 })),
  status: Type.Optional(Type.Array(Type.Union([
    Type.Literal('active'),
    Type.Literal('blocked'),
    Type.Literal('pending'),
    Type.Literal('unknown'),
  ]))),
  membership: Type.Optional(Type.Array(Type.Union([
    Type.Literal('free'),
    Type.Literal('pro'),
  ]))),
  filter: Type.Optional(Type.String()),
})

type UsersSearchParams = Static<typeof usersSearchSchema>

export const Route = createFileRoute('/_authenticated/users/')({
  validateSearch: (search: Record<string, unknown>): UsersSearchParams => ({
    page: typeof search.page === 'number' ? search.page : 1,
    pageSize: typeof search.pageSize === 'number' ? search.pageSize : 10,
    status: Array.isArray(search.status) ? search.status as UsersSearchParams['status'] : undefined,
    membership: Array.isArray(search.membership) ? search.membership as UsersSearchParams['membership'] : undefined,
    filter: typeof search.filter === 'string' ? search.filter : undefined,
  }),
  component: Users,
})
