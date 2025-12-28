import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { auth } from '@/lib/eden'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ location }) => {
    // 检查是否已登录
    if (!auth.isAuthenticated()) {
      // 未登录时重定向到登录页，并保存当前路径用于登录后跳转
      throw redirect({
        to: '/sign-in',
        search: {
          redirect: location.href,
        },
      })
    }
  },
  component: AuthenticatedLayout,
})
