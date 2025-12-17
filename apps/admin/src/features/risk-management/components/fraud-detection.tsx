import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { FraudStats } from './fraud-stats'
import { FraudTable } from './fraud-table'
import { FraudFilters } from './fraud-filters'
import { FraudProvider } from './fraud-provider'
import { FraudDialogs } from './fraud-dialogs'

export function FraudDetection() {
  return (
    <FraudProvider>
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
            <h2 className='text-2xl font-bold tracking-tight'>欺诈检测</h2>
            <p className='text-muted-foreground'>
              监控和识别平台上的欺诈行为，保护用户和平台安全
            </p>
          </div>
        </div>

        {/* 欺诈统计 */}
        <FraudStats />

        {/* 筛选器 */}
        <FraudFilters />

        {/* 欺诈检测表格 */}
        <FraudTable />
      </Main>

      <FraudDialogs />
    </FraudProvider>
  )
}