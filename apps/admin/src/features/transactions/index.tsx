import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { TransactionsDialogs } from './components/transactions-dialogs'
import { TransactionsPrimaryButtons } from './components/transactions-primary-buttons'
import { TransactionsProvider } from './components/transactions-provider'
import { TransactionsTable } from './components/transactions-table'
import { transactions } from './data/transactions'

export function Transactions() {
  return (
    <TransactionsProvider>
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
            <h2 className='text-2xl font-bold tracking-tight'>交易管理</h2>
            <p className='text-muted-foreground'>
              管理平台交易，查看交易记录和状态
            </p>
          </div>
          <TransactionsPrimaryButtons />
        </div>
        <TransactionsTable data={transactions} />
      </Main>

      <TransactionsDialogs />
    </TransactionsProvider>
  )
}