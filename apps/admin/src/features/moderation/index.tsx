import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ModerationDialogs } from './components/moderation-dialogs'
import { ModerationPrimaryButtons } from './components/moderation-primary-buttons'
import { ModerationProvider } from './components/moderation-provider'
import { ModerationTable } from './components/moderation-table'

export function ModerationQueue() {
  return (
    <ModerationProvider>
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
            <h2 className='text-2xl font-bold tracking-tight'>内容审核</h2>
            <p className='text-muted-foreground'>
              管理平台内容审核队列和审核工作流
            </p>
          </div>
          <ModerationPrimaryButtons />
        </div>
        <ModerationTable />
      </Main>

      <ModerationDialogs />
    </ModerationProvider>
  )
}

// Export alias for backward compatibility
export { ModerationQueue as Moderation }