import {
  CheckCircledIcon,
  CrossCircledIcon,
  StopwatchIcon,
  QuestionMarkCircledIcon,
} from '@radix-ui/react-icons'

export const statuses = [
  {
    value: 'completed',
    label: '已完成',
    icon: CheckCircledIcon,
  },
  {
    value: 'pending',
    label: '处理中',
    icon: StopwatchIcon,
  },
  {
    value: 'failed',
    label: '失败',
    icon: CrossCircledIcon,
  },
  {
    value: 'cancelled',
    label: '已取消',
    icon: QuestionMarkCircledIcon,
  },
]

export const types = [
  {
    value: 'payment',
    label: '支付',
  },
  {
    value: 'refund',
    label: '退款',
  },
  {
    value: 'reward',
    label: '奖励',
  },
  {
    value: 'withdrawal',
    label: '提现',
  },
]

export const methods = [
  {
    value: 'wechat',
    label: '微信支付',
  },
  {
    value: 'alipay',
    label: '支付宝',
  },
  {
    value: 'balance',
    label: '余额',
  },
  {
    value: 'bank',
    label: '银行卡',
  },
]