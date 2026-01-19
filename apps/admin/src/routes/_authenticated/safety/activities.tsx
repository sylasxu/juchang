import { Type, type Static } from '@sinclair/typebox'
import { createFileRoute } from '@tanstack/react-router'
import { SafetyActivities } from '@/features/activities/safety-activities'

const activitiesSearchSchema = Type.Object({
  page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
  pageSize: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 10 })),
  status: Type.Optional(Type.Array(Type.Union([
    Type.Literal('active'),
    Type.Literal('completed'),
    Type.Literal('cancelled'),
    Type.Literal('draft'),
  ]))),
  type: Type.Optional(Type.Array(Type.Union([
    Type.Literal('food'),
    Type.Literal('entertainment'),
    Type.Literal('sports'),
    Type.Literal('boardgame'),
    Type.Literal('other'),
  ]))),
  filter: Type.Optional(Type.String()),
})

type ActivitiesSearchParams = Static<typeof activitiesSearchSchema>

export const Route = createFileRoute('/_authenticated/safety/activities')({
  validateSearch: (search: Record<string, unknown>): ActivitiesSearchParams => ({
    page: typeof search.page === 'number' ? search.page : 1,
    pageSize: typeof search.pageSize === 'number' ? search.pageSize : 10,
    status: Array.isArray(search.status) ? search.status as ActivitiesSearchParams['status'] : undefined,
    type: Array.isArray(search.type) ? search.type as ActivitiesSearchParams['type'] : undefined,
    filter: typeof search.filter === 'string' ? search.filter : undefined,
  }),
  component: SafetyActivities,
})
