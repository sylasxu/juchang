import {
  CheckCircledIcon,
  CrossCircledIcon,
  StopwatchIcon,
} from '@radix-ui/react-icons'
import { FileEdit } from 'lucide-react'

// MVP 活动状态 (v3.2 含 draft)
export const statuses = [
  {
    value: 'draft',
    label: '草稿',
    icon: FileEdit,
  },
  {
    value: 'active',
    label: '进行中',
    icon: CheckCircledIcon,
  },
  {
    value: 'completed',
    label: '已成局',
    icon: CrossCircledIcon,
  },
  {
    value: 'cancelled',
    label: '已取消',
    icon: StopwatchIcon,
  },
]

// MVP 活动类型 (简化版)
export const activityTypes = [
  {
    value: 'food',
    label: '美食聚餐',
    icon: '🍲',
  },
  {
    value: 'sports',
    label: '运动健身',
    icon: '⚽️',
  },
  {
    value: 'entertainment',
    label: '娱乐休闲',
    icon: '🎬',
  },
  {
    value: 'boardgame',
    label: '桌游棋牌',
    icon: '🎴',
  },
  {
    value: 'other',
    label: '其他',
    icon: '📍',
  },
]

// 活动类型标签映射
export const activityTypeLabels: Record<string, string> = {
  food: '美食聚餐',
  sports: '运动健身',
  entertainment: '娱乐休闲',
  boardgame: '桌游棋牌',
  other: '其他',
}

// 活动状态标签映射
export const activityStatusLabels: Record<string, string> = {
  draft: '草稿',
  active: '进行中',
  completed: '已成局',
  cancelled: '已取消',
}
