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
    name: 'satnaing',
    email: 'satnaingdev@gmail.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'Shadcn Admin',
      logo: Command,
      plan: 'Vite + ShadcnUI',
    },
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
  ],
  navGroups: [
    {
      title: 'Overview',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: 'JuChang Platform Management',
      items: [
        {
          title: 'Users',
          url: '/users',
          icon: Users,
        },
        {
          title: 'Activities',
          icon: Calendar,
          items: [
            {
              title: 'Activity List',
              url: '/activities',
            },
            {
              title: 'Ghost Activities',
              url: '/activities/ghost',
            },
          ],
        },
        {
          title: 'Transactions',
          icon: CreditCard,
          items: [
            {
              title: 'Transaction Records',
              url: '/transactions',
            },
            {
              title: 'Revenue Analytics',
              url: '/transactions/revenue',
            },
          ],
        },
      ],
    },
    {
      title: 'Content & Safety',
      items: [
        {
          title: 'Moderation',
          icon: Shield,
          items: [
            {
              title: 'Moderation Queue',
              url: '/moderation',
            },
            {
              title: 'Moderation Rules',
              url: '/moderation/rules',
            },
            {
              title: 'Moderation History',
              url: '/moderation/history',
            },
          ],
        },
        {
          title: 'Risk Management',
          icon: AlertTriangle,
          items: [
            {
              title: 'Risk Assessment',
              url: '/risk',
            },
            {
              title: 'Dispute Resolution',
              url: '/risk/disputes',
            },
            {
              title: 'Fraud Detection',
              url: '/risk/fraud',
            },
          ],
        },
        {
          title: 'Communication',
          url: '/communication',
          icon: MessagesSquare,
        },
      ],
    },
    {
      title: 'Business Intelligence',
      items: [
        {
          title: 'Premium Services',
          icon: Crown,
          items: [
            {
              title: 'Service Statistics',
              url: '/premium',
            },
            {
              title: 'Service Analysis',
              url: '/premium/analysis',
            },
          ],
        },
        {
          title: 'Geography Analysis',
          url: '/geography',
          icon: MapPin,
        },
      ],
    },
    {
      title: 'System Administration',
      items: [
        {
          title: 'System Management',
          url: '/system',
          icon: Settings,
        },
      ],
    },
    {
      title: 'General Tools',
      items: [
        {
          title: 'Tasks',
          url: '/tasks',
          icon: ListTodo,
        },
        {
          title: 'Apps',
          url: '/apps',
          icon: Package,
        },
        {
          title: 'Chats',
          url: '/chats',
          badge: '3',
          icon: MessagesSquare,
        },
      ],
    },
    {
      title: 'Pages',
      items: [
        {
          title: 'Auth',
          icon: ShieldCheck,
          items: [
            {
              title: 'Sign In',
              url: '/sign-in',
            },
            {
              title: 'Sign In (2 Col)',
              url: '/sign-in-2',
            },
            {
              title: 'Sign Up',
              url: '/sign-up',
            },
            {
              title: 'Forgot Password',
              url: '/forgot-password',
            },
            {
              title: 'OTP',
              url: '/otp',
            },
          ],
        },
        {
          title: 'Errors',
          icon: Bug,
          items: [
            {
              title: 'Unauthorized',
              url: '/errors/unauthorized',
              icon: Lock,
            },
            {
              title: 'Forbidden',
              url: '/errors/forbidden',
              icon: UserX,
            },
            {
              title: 'Not Found',
              url: '/errors/not-found',
              icon: FileX,
            },
            {
              title: 'Internal Server Error',
              url: '/errors/internal-server-error',
              icon: ServerOff,
            },
            {
              title: 'Maintenance Error',
              url: '/errors/maintenance-error',
              icon: Construction,
            },
          ],
        },
      ],
    },
    {
      title: 'Other',
      items: [
        {
          title: 'Settings',
          icon: Settings,
          items: [
            {
              title: 'Profile',
              url: '/settings',
              icon: UserCog,
            },
            {
              title: 'Account',
              url: '/settings/account',
              icon: Wrench,
            },
            {
              title: 'Appearance',
              url: '/settings/appearance',
              icon: Palette,
            },
            {
              title: 'Notifications',
              url: '/settings/notifications',
              icon: Bell,
            },
            {
              title: 'Display',
              url: '/settings/display',
              icon: Monitor,
            },
          ],
        },
        {
          title: 'Help Center',
          url: '/help-center',
          icon: HelpCircle,
        },
      ],
    },
  ],
}
