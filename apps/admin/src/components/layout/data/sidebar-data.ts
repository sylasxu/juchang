import {
  LayoutDashboard,
  Settings,
  Users,
  Calendar,
  UserCog,
  Wrench,
  Palette,
  Command,
  Bot,
  MessageSquare,
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
      name: 'JC',
      logo: Command,
      plan: 'Admin',
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
      title: 'AI Ops',
      items: [
        {
          title: 'AI Playground',
          url: '/playground',
          icon: Bot,
        },
        {
          title: '对话审计',
          url: '/conversations',
          icon: MessageSquare,
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
          url: '/activities',
          icon: Calendar,
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
