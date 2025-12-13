import { Crown, User, Ban, CheckCircle } from 'lucide-react'
import { type UserStatus, type MembershipType, type Gender } from './schema'

// 用户状态样式
export const statusStyles = new Map<UserStatus, string>([
  ['active', 'bg-teal-100/30 text-teal-900 dark:text-teal-200 border-teal-200'],
  ['blocked', 'bg-destructive/10 dark:bg-destructive/50 text-destructive dark:text-primary border-destructive/10'],
])

// 用户状态选项
export const statusOptions = [
  { label: '正常', value: 'active', icon: CheckCircle },
  { label: '封禁', value: 'blocked', icon: Ban },
] as const

// 会员类型样式
export const membershipStyles = new Map<MembershipType, string>([
  ['free', 'bg-neutral-300/40 border-neutral-300'],
  ['pro', 'bg-amber-100/50 text-amber-900 dark:text-amber-200 border-amber-300'],
])

// 会员类型选项
export const membershipOptions = [
  { label: '免费用户', value: 'free', icon: User },
  { label: 'Pro 会员', value: 'pro', icon: Crown },
] as const

// 性别选项
export const genderOptions = [
  { label: '男', value: 'male' },
  { label: '女', value: 'female' },
  { label: '未知', value: 'unknown' },
] as const

// 性别显示
export const genderLabels: Record<Gender, string> = {
  male: '男',
  female: '女',
  unknown: '未知',
}
