import { useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Skeleton } from '@/components/ui/skeleton'
import { UsersDialogs } from './components/users-dialogs'
import { UsersPrimaryButtons } from './components/users-primary-buttons'
import { UsersProvider } from './components/users-provider'
import { UsersTable } from './components/users-table'
import { useAdminUsers } from './hooks/use-users'

const route = getRouteApi('/_authenticated/users/')

export function Users() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const [queryParams, setQueryParams] = useState({
    page: 1,
    limit: 20,
    search: '',
    membershipType: undefined as ('free' | 'pro')[] | undefined,
    isBlocked: undefined as boolean | undefined,
    isRealNameVerified: undefined as boolean | undefined,
    sortBy: 'createdAt' as 'createdAt' | 'lastActiveAt' | 'participationCount' | 'fulfillmentCount',
    sortOrder: 'desc' as 'asc' | 'desc',
  })

  const { data, isLoading, isError, error } = useAdminUsers(queryParams)

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
            </p>
          </div>
          <UsersPrimaryButtons />
        </div>

        {isLoading ? (
          <div className='space-y-4'>
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-[400px] w-full' />
          </div>
        ) : isError ? (
          <div className='rounded-lg border border-destructive/50 bg-destructive/10 p-4'>
            <p className='text-destructive'>
              加载失败: {error?.message || '未知错误'}
            </p>
          </div>
        ) : (
          <UsersTable
            data={data?.data || []}
            search={search}
            navigate={navigate}
            pagination={{
              page: data?.page || 1,
              totalPages: data?.totalPages || 1,
              total: data?.total || 0,
              onPageChange: (page) => setQueryParams((prev) => ({ ...prev, page })),
            }}
          />
        )}
      </Main>

      <UsersDialogs />
    </UsersProvider>
  )
}
