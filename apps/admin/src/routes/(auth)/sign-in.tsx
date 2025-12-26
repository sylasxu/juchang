import { Type, type Static } from '@sinclair/typebox'
import { createFileRoute } from '@tanstack/react-router'
import { SignIn } from '@/features/auth/sign-in'

const searchSchema = Type.Object({
  redirect: Type.Optional(Type.String()),
})

type SearchParams = Static<typeof searchSchema>

export const Route = createFileRoute('/(auth)/sign-in')({
  component: SignIn,
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
})
