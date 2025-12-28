import { Type, type Static } from '@sinclair/typebox'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { SignIn } from '@/features/auth/sign-in'
import { auth } from '@/lib/eden'

const searchSchema = Type.Object({
  redirect: Type.Optional(Type.String()),
})

type SearchParams = Static<typeof searchSchema>

export const Route = createFileRoute('/(auth)/sign-in')({
  beforeLoad: ({ search }) => {
    // 已登录用户访问登录页时，重定向到首页或指定页面
    if (auth.isAuthenticated()) {
      throw redirect({
        to: search.redirect || '/',
      })
    }
  },
  component: SignIn,
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
})
