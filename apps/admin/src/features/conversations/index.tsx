// Conversations - 对话审计页面
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConversationsList } from './components/conversations-list'

export function Conversations() {
  return (
    <>
      <Header fixed>
        <div className='flex items-center gap-2'>
          <h1 className='text-lg font-semibold'>对话审计</h1>
          <span className='rounded-md bg-orange-500/10 px-2 py-0.5 text-xs text-orange-500'>
            AI Ops
          </span>
        </div>
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>对话历史</h2>
          <p className='text-muted-foreground'>
            查看和审计所有用户与 AI 的对话记录，识别问题并优化 AI 响应
          </p>
        </div>
        <ConversationsList />
      </Main>
    </>
  )
}
