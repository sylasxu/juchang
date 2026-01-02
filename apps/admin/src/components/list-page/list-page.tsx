import type { LucideIcon } from 'lucide-react'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Skeleton } from '@/components/ui/skeleton'

interface ListPageProps {
  title: string
  description: string
  icon?: LucideIcon
  isLoading: boolean
  error?: Error | null
  headerActions?: React.ReactNode
  dialogs?: React.ReactNode
  children: React.ReactNode
}

export function ListPage({
  title,
  description,
  icon: Icon,
  isLoading,
  error,
  headerActions,
  dialogs,
  children,
}: ListPageProps) {
  return (
    <>
      <Header fixed>
        <div className='flex items-center gap-2'>
          {Icon && <Icon className='h-5 w-5' />}
          <h1 className='text-lg font-semibold'>{title}</h1>
        </div>
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>{title}</h2>
            <p className='text-muted-foreground'>{description}</p>
          </div>
          {headerActions}
        </div>

        {isLoading ? (
          <div className='space-y-4'>
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-[400px] w-full' />
          </div>
        ) : error ? (
          <div className='text-center py-8 text-muted-foreground'>
            加载失败：{error.message}
          </div>
        ) : (
          children
        )}
      </Main>

      {dialogs}
    </>
  )
}
