import {
  CheckCircledIcon,
  CrossCircledIcon,
  StopwatchIcon,
  QuestionMarkCircledIcon,
} from '@radix-ui/react-icons'

export const statuses = [
  {
    value: 'published',
    label: '已发布',
    icon: CheckCircledIcon,
  },
  {
    value: 'draft',
    label: '草稿',
    icon: StopwatchIcon,
  },
  {
    value: 'archived',
    label: '已归档',
    icon: CrossCircledIcon,
  },
  {
    value: 'pending',
    label: '待审核',
    icon: QuestionMarkCircledIcon,
  },
]

export const contentTypes = [
  {
    value: 'privacy',
    label: '隐私协议',
  },
  {
    value: 'terms',
    label: '用户协议',
  },
  {
    value: 'help',
    label: '帮助文档',
  },
  {
    value: 'announcement',
    label: '系统公告',
  },
  {
    value: 'h5',
    label: 'H5页面',
  },
]