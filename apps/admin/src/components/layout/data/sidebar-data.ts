import {
  Construction,
  LayoutDashboard,
  Monitor,
  Bug,
  ListTodo,
  FileX,
  HelpCircle,
  Lock,
  Bell,
  Package,
  Palette,
  ServerOff,
  Settings,
  Wrench,
  UserCog,
  UserX,
  Users,
  MessagesSquare,
  ShieldCheck,
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
  Calendar,
  CreditCard,
  Shield,
  AlertTriangle,
  Crown,
  MapPin,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: '管理员',
    email: 'admin@juchang.app',
    avatar: '/avatars/admin.png',
  },
  teams: [
    {
      name: '聚场',
      logo: Command,
      plan: 'AI碎片化社交',
    },
  ],
  navGroups: [
    {
      title: '概览',
      items: [
        {
          title: '仪表盘',
          url: '/',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: '平台管理',
      items: [
        {
          title: '用户管理',
          url: '/users',
          icon: Users,
        },
        {
          title: '活动管理',
          icon: Calendar,
          items: [
            {
              title: '活动列表',
              url: '/activities',
            },
            {
              title: '幽灵锚点',
              url: '/activities/ghost',
            },
          ],
        },
        {
          title: '交易管理',
          icon: CreditCard,
          items: [
            {
              title: '交易记录',
              url: '/transactions',
            },
          ],
        },
      ],
    },
    {
      title: '内容安全',
      items: [
        {
          title: '内容审核',
          icon: Shield,
          items: [
            {
              title: '审核队列',
              url: '/moderation',
            },
          ],
        },
        {
          title: '风险管理',
          icon: AlertTriangle,
          items: [
            {
              title: '风险评估',
              url: '/risk',
            },
            {
              title: '争议处理',
              url: '/risk/disputes',
            },
            {
              title: '欺诈检测',
              url: '/risk/fraud',
            },
          ],
        },
        {
          title: '沟通管理',
          url: '/communication',
          icon: MessagesSquare,
        },
      ],
    },
    {
      title: '商业分析',
      items: [
        {
          title: '增值服务',
          icon: Crown,
          items: [
            {
              title: '服务统计',
              url: '/premium',
            },
            {
              title: '服务分析',
              url: '/premium/analysis',
            },
          ],
        },
        {
          title: '地理分析',
          url: '/geography',
          icon: MapPin,
        },
      ],
    },
    {
      title: '系统管理',
      items: [
        {
          title: '系统设置',
          url: '/system',
          icon: Settings,
        },
      ],
    },
    {
      title: '其他',
      items: [
        {
          title: '设置',
          icon: Settings,
          items: [
            {
              title: '个人资料',
              url: '/settings',
              icon: UserCog,
            },
            {
              title: '账户设置',
              url: '/settings/account',
              icon: Wrench,
            },
            {
              title: '外观设置',
              url: '/settings/appearance',
              icon: Palette,
            },
          ],
        },
        {
          title: '帮助中心',
          url: '/help-center',
          icon: HelpCircle,
        },
      ],
    },
  ],
}
