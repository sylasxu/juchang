import {
  LayoutDashboard,
  Settings,
  Users,
  Calendar,
  UserCog,
  Wrench,
  Palette,
  Command,
  MessageSquare,
  Play,
  Bell,
  Shield,
  FileCode,
  TrendingUp,
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
          title: 'Playground',
          url: '/ai-ops',
          icon: Play,
        },
        {
          title: 'Token 统计',
          url: '/ai-ops/token-usage',
          icon: TrendingUp,
        },
        {
          title: 'Prompt 查看',
          url: '/ai-ops/prompt-viewer',
          icon: FileCode,
        },
        {
          title: '对话审计',
          url: '/ai-ops/conversations',
          icon: MessageSquare,
        },
      ],
    },
    {
      title: '运营管理',
      items: [
        {
          title: '内容审核',
          url: '/reports',
          icon: Shield,
        },
        {
          title: '通知管理',
          url: '/notifications',
          icon: Bell,
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
