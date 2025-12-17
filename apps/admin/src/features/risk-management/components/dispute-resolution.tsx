import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { DisputeStats } from './dispute-stats'
import { DisputeTable } from './dispute-table'
import { DisputeFilters } from './dispute-filters'
import { DisputeProvider } from './dispute-provider'
import { DisputeDialogs } from './dispute-dialogs'

export function DisputeResolution() {
  return (
    <DisputeProvider>
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
            <h2 className='text-2xl font-bold tracking-tight'>争议处理</h2>
            <p className='text-muted-foreground'>
              管理用户争议和投诉，提供结构化的处理工作流
            </p>
          </div>
        </div>

        {/* 争议统计 */}
        <DisputeStats />

        {/* 筛选器 */}
        <DisputeFilters />

        {/* 争议表格 */}
        <DisputeTable />
      </Main>

      <DisputeDialogs />
    </DisputeProvider>
  )
}