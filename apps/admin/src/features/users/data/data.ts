import {
  CheckCircledIcon,
  CrossCircledIcon,
  StopwatchIcon,
  QuestionMarkCircledIcon,
} from '@radix-ui/react-icons'

export const statuses = [
  {
    value: 'active',
    label: '正常',
    icon: CheckCircledIcon,
  },
  {
    value: 'blocked',
    label: '封禁',
    icon: CrossCircledIcon,
  },
  {
    value: 'pending',
    label: '待审核',
    icon: StopwatchIcon,
  },
  {
    value: 'unknown',
    label: '未知',
    icon: QuestionMarkCircledIcon,
  },
]

export const membershipTypes = [
  {
    value: 'free',
    label: '免费用户',
  },
  {
    value: 'pro',
    label: 'Pro用户',
  },
]

export const verificationStatus = [
  {
    value: 'verified',
    label: '已认证',
  },
  {
    value: 'unverified',
    label: '未认证',
  },
]

// Export options for form components
export const genderOptions = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
  { value: 'other', label: '其他' },
]

export const membershipOptions = membershipTypes

export const statusOptions = statuses

// Gender labels mapping
export const genderLabels = {
  male: '男',
  female: '女',
  other: '其他',
  unknown: '未知',
}