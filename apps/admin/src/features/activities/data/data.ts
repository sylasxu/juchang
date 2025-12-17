import {
  CheckCircledIcon,
  CrossCircledIcon,
  StopwatchIcon,
  QuestionMarkCircledIcon,
} from '@radix-ui/react-icons'

export const statuses = [
  {
    value: 'active',
    label: '进行中',
    icon: CheckCircledIcon,
  },
  {
    value: 'completed',
    label: '已完成',
    icon: CrossCircledIcon,
  },
  {
    value: 'cancelled',
    label: '已取消',
    icon: StopwatchIcon,
  },
  {
    value: 'draft',
    label: '草稿',
    icon: QuestionMarkCircledIcon,
  },
]

export const categories = [
  {
    value: 'sports',
    label: '运动健身',
  },
  {
    value: 'food',
    label: '美食聚餐',
  },
  {
    value: 'entertainment',
    label: '娱乐休闲',
  },
  {
    value: 'study',
    label: '学习交流',
  },
  {
    value: 'travel',
    label: '旅游出行',
  },
  {
    value: 'other',
    label: '其他',
  },
]