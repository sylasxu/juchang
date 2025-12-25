import {
  CheckCircledIcon,
  CrossCircledIcon,
} from '@radix-ui/react-icons'

// MVP 用户状态 (简化版)
export const statuses = [
  {
    value: 'active',
    label: '活跃',
    icon: CheckCircledIcon,
  },
  {
    value: 'inactive',
    label: '不活跃',
    icon: CrossCircledIcon,
  },
]

// MVP 手机号绑定状态
export const phoneBindStatus = [
  {
    value: 'bound',
    label: '已绑定',
  },
  {
    value: 'unbound',
    label: '未绑定',
  },
]

// Export options for form components
export const statusOptions = statuses
export const phoneBindOptions = phoneBindStatus
