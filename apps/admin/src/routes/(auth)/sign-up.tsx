import { createFileRoute, redirect } from '@tanstack/react-router'
import { SignUp } from '@/features/auth/sign-up'
import { auth } from '@/lib/eden'

export const Route = createFileRoute('/(auth)/sign-up')({
  beforeLoad: () => {
    // 已登录用户访问注册页时，重定向到首页
    if (auth.isAuthenticated()) {
      throw redirect({ to: '/' })
    }
  },
  component: SignUp,
})
