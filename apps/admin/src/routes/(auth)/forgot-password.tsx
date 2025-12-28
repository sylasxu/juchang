import { createFileRoute, redirect } from '@tanstack/react-router'
import { ForgotPassword } from '@/features/auth/forgot-password'
import { auth } from '@/lib/eden'

export const Route = createFileRoute('/(auth)/forgot-password')({
  beforeLoad: () => {
    // 已登录用户访问忘记密码页时，重定向到首页
    if (auth.isAuthenticated()) {
      throw redirect({ to: '/' })
    }
  },
  component: ForgotPassword,
})
