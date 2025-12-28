// AI Playground - AI 调试沙盒
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { PlaygroundChat } from './components/playground-chat'
import { PlaygroundProvider } from './components/playground-provider'

export function AIPlayground() {
  return (
    <PlaygroundProvider>
      <Header fixed>
        <div className='flex items-center gap-2'>
          <h1 className='text-lg font-semibold'>AI Playground</h1>
          <span className='rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary'>
            调试模式
          </span>
        </div>
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6'>
        <PlaygroundChat />
      </Main>
    </PlaygroundProvider>
  )
}
