import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { useActivities } from '@/hooks/use-activities'
import { ActivitiesDialogs } from './components/activities-dialogs'
import { ActivitiesPrimaryButtons } from './components/activities-primary-buttons'
import { ActivitiesProvider } from './components/activities-provider'
import { ActivitiesTable } from './components/activities-table'
import { Skeleton } from '@/components/ui/skeleton'
import { getRouteApi } from '@tanstack/react-router'
import { type Activity } from './data/schema'

const route = getRouteApi('/_authenticated/activities/')

export function Activities() {
  const search = route.useSearch()
  const pageSize = (search as Record<string, unknown>).pageSize as number ?? 10
  
  const { data, isLoading, error } = useActivities({
    page: (search as Record<string, unknown>).page as number ?? 1,
    limit: pageSize,
    status: (search as Record<string, unknown>).status as string | undefined,
    type: (search as Record<string, unknown>).type as string | undefined,
    search: (search as Record<string, unknown>).filter as string | undefined,
  })
  
  // 转换 API 返回数据为组件需要的格式
  const activities: Activity[] = (data?.data ?? []).map((item: Record<string, unknown>) => ({
    id: item.id as string,
    creatorId: item.creatorId as string,
    title: item.title as string,
    description: item.description as string | undefined,
    location: item.location as { x: number; y: number },
    locationName: item.locationName as string,
    address: item.address as string | undefined,
    locationHint: item.locationHint as string,
    startAt: item.startAt as string,
    type: item.type as 'food' | 'sports' | 'entertainment' | 'boardgame' | 'other',
    maxParticipants: item.maxParticipants as number,
    currentParticipants: item.currentParticipants as number,
    status: item.status as 'draft' | 'active' | 'completed' | 'cancelled',
    createdAt: item.createdAt as string,
    updatedAt: item.updatedAt as string,
  }))
  const total = data?.total ?? 0

  return (
    <ActivitiesProvider>
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
            <h2 className='text-2xl font-bold tracking-tight'>活动管理</h2>
            <p className='text-muted-foreground'>
              管理平台活动，查看活动信息和状态
            </p>
          </div>
          <ActivitiesPrimaryButtons />
        </div>
        
        {isLoading ? (
          <div className='space-y-4'>
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-64 w-full' />
          </div>
        ) : error ? (
          <div className='text-center py-8 text-muted-foreground'>
            加载失败：{error.message}
          </div>
        ) : (
          <ActivitiesTable data={activities} pageCount={Math.ceil(total / pageSize)} />
        )}
      </Main>

      <ActivitiesDialogs />
    </ActivitiesProvider>
  )
}
