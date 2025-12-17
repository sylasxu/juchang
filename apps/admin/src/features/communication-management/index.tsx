import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChatModeration } from './components/chat-moderation'
import { NotificationManagement } from './components/notification-management'
import { SupportManagement } from './components/support-management'
import { 
  MessageSquare, 
  Bell, 
  HeadphonesIcon,
  RefreshCw
} from 'lucide-react'

export function CommunicationManagement() {
  return (
    <>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>沟通管理</h2>
            <p className='text-muted-foreground'>
              管理聊天审核、通知发送和用户支持服务
            </p>
          </div>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新数据
          </Button>
        </div>

        <Tabs defaultValue="chat" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              聊天审核
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              通知管理
            </TabsTrigger>
            <TabsTrigger value="support" className="flex items-center gap-2">
              <HeadphonesIcon className="h-4 w-4" />
              支持服务
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="space-y-6">
            <ChatModeration />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <NotificationManagement />
          </TabsContent>

          <TabsContent value="support" className="space-y-6">
            <SupportManagement />
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}