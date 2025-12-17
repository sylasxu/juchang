import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ContentDialogs } from './components/content-dialogs'
import { ContentPrimaryButtons } from './components/content-primary-buttons'
import { ContentProvider } from './components/content-provider'
import { ContentTable } from './components/content-table'
import { contents } from './data/contents'

export function ContentManagement() {
  return (
    <ContentProvider>
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
            <h2 className='text-2xl font-bold tracking-tight'>内容管理</h2>
            <p className='text-muted-foreground'>
              管理隐私协议、用户协议、帮助文档、系统公告和H5页面
            </p>
          </div>
          <ContentPrimaryButtons />
        </div>
        <ContentTable data={contents} />
      </Main>

      <ContentDialogs />
    </ContentProvider>
  )
}