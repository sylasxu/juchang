import {
  LayoutDashboard,
  Settings,
  Users,
  Calendar,
  CreditCard,
  UserCog,
  Wrench,
  Palette,
  Command,
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
          url: '/transactions',
          icon: CreditCard,
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
      ],
    },
  ],
}
