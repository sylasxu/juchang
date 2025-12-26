import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { UsersDialogs } from './components/users-dialogs'
import { UsersPrimaryButtons } from './components/users-primary-buttons'
import { UsersProvider } from './components/users-provider'
import { UsersTable } from './components/users-table'
import { users as mockUsers } from './data/users'
import { useUsersList } from '@/hooks/use-users'
import { getRouteApi } from '@tanstack/react-router'
import { Skeleton } from '@/components/ui/skeleton'

const route = getRouteApi('/_authenticated/users/')

export function Users() {
  const search = route.useSearch()
  
  // 使用 API 获取用户数据，失败时回退到 mock 数据
  const { data, isLoading, isError } = useUsersList({
    page: search.page ?? 1,
    limit: search.pageSize ?? 10,
    search: search.filter,
  })

  // 使用 API 数据，失败时回退到 mock 数据
  const users = isError || !data ? mockUsers : (data as any)?.data ?? mockUsers

  return (
    <UsersProvider>
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
            <h2 className='text-2xl font-bold tracking-tight'>用户管理</h2>
            <p className='text-muted-foreground'>
              管理平台用户，查看用户信息和状态
              {isError && <span className='text-yellow-600 ml-2'>(使用离线数据)</span>}
            </p>
          </div>
          <UsersPrimaryButtons />
        </div>
        {isLoading ? (
          <div className='space-y-4'>
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-[400px] w-full' />
          </div>
        ) : (
          <UsersTable data={users} />
        )}
      </Main>

      <UsersDialogs />
    </UsersProvider>
  )
}
