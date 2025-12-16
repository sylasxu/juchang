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

// 实名认证状态选项
export const verificationOptions = [
  { label: '已认证', value: true, icon: CheckCircle },
  { label: '未认证', value: false, icon: User },
] as const

// 排序选项
export const sortOptions = [
  { label: '注册时间', value: 'createdAt' },
  { label: '最后活跃', value: 'lastActiveAt' },
  { label: '参与次数', value: 'participationCount' },
  { label: '履约次数', value: 'fulfillmentCount' },
] as const

// 排序方向选项
export const sortOrderOptions = [
  { label: '降序', value: 'desc' },
  { label: '升序', value: 'asc' },
] as const
