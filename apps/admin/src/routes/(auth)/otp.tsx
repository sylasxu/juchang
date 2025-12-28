import { createFileRoute, redirect } from '@tanstack/react-router'
import { Otp } from '@/features/auth/otp'
import { auth } from '@/lib/eden'

export const Route = createFileRoute('/(auth)/otp')({
  beforeLoad: () => {
    // 已登录用户访问 OTP 页时，重定向到首页
    if (auth.isAuthenticated()) {
      throw redirect({ to: '/' })
    }
  },
  component: Otp,
})
