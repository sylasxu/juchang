import { Badge } from '@/components/ui/badge'

export function RecentActivities() {
  return (
    <div className='space-y-8'>
      <div className='flex items-center gap-4'>
        <div className='flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900'>
          <span className='text-sm font-medium text-blue-600 dark:text-blue-300'>运</span>
        </div>
        <div className='flex flex-1 flex-wrap items-center justify-between'>
          <div className='space-y-1'>
            <p className='text-sm leading-none font-medium'>周末篮球约战</p>
            <p className='text-muted-foreground text-sm'>
              朝阳公园篮球场
            </p>
          </div>
          <Badge variant='default'>进行中</Badge>
        </div>
      </div>
      <div className='flex items-center gap-4'>
        <div className='flex h-9 w-9 items-center justify-center rounded-full bg-green-100 dark:bg-green-900'>
          <span className='text-sm font-medium text-green-600 dark:text-green-300'>食</span>
        </div>
        <div className='flex flex-1 flex-wrap items-center justify-between'>
          <div className='space-y-1'>
            <p className='text-sm leading-none font-medium'>火锅聚餐</p>
            <p className='text-muted-foreground text-sm'>海底捞三里屯店</p>
          </div>
          <Badge variant='secondary'>已满员</Badge>
        </div>
      </div>
      <div className='flex items-center gap-4'>
        <div className='flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900'>
          <span className='text-sm font-medium text-purple-600 dark:text-purple-300'>娱</span>
        </div>
        <div className='flex flex-1 flex-wrap items-center justify-between'>
          <div className='space-y-1'>
            <p className='text-sm leading-none font-medium'>电影观影会</p>
            <p className='text-muted-foreground text-sm'>
              万达影城CBD店
            </p>
          </div>
          <Badge variant='outline'>已完成</Badge>
        </div>
      </div>
      <div className='flex items-center gap-4'>
        <div className='flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900'>
          <span className='text-sm font-medium text-orange-600 dark:text-orange-300'>学</span>
        </div>
        <div className='flex flex-1 flex-wrap items-center justify-between'>
          <div className='space-y-1'>
            <p className='text-sm leading-none font-medium'>JavaScript 学习分享</p>
            <p className='text-muted-foreground text-sm'>中关村创业大街</p>
          </div>
          <Badge variant='secondary'>草稿</Badge>
        </div>
      </div>
      <div className='flex items-center gap-4'>
        <div className='flex h-9 w-9 items-center justify-center rounded-full bg-red-100 dark:bg-red-900'>
          <span className='text-sm font-medium text-red-600 dark:text-red-300'>游</span>
        </div>
        <div className='flex flex-1 flex-wrap items-center justify-between'>
          <div className='space-y-1'>
            <p className='text-sm leading-none font-medium'>香山登山</p>
            <p className='text-muted-foreground text-sm'>香山公园</p>
          </div>
          <Badge variant='destructive'>已取消</Badge>
        </div>
      </div>
    </div>
  )
}