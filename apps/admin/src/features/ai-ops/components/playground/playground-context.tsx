/**
 * PlaygroundContext Component
 * 
 * 上下文配置面板，用于模拟不同用户、位置和草稿上下文。
 * 参考 Requirements R4
 */

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  User, 
  MapPin, 
  FileEdit, 
  ChevronDown,
  X,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { api, unwrap } from '@/lib/eden'

/** 预设位置 */
const PRESET_LOCATIONS = [
  { name: '观音桥', lat: 29.5630, lng: 106.5516 },
  { name: '解放碑', lat: 29.5579, lng: 106.5764 },
  { name: '南坪', lat: 29.5234, lng: 106.5687 },
  { name: '沙坪坝', lat: 29.5712, lng: 106.4543 },
] as const

/** 上下文数据类型 */
export interface PlaygroundContextData {
  /** 模拟用户 ID */
  userId?: string
  /** 模拟用户信息 */
  user?: {
    id: string
    nickname: string
    avatarUrl?: string
  }
  /** 位置坐标 */
  location: {
    lat: number
    lng: number
    name?: string
  }
  /** 草稿上下文 */
  draft?: {
    activityId: string
    title: string
  }
}

interface PlaygroundContextProps {
  /** 当前上下文 */
  context: PlaygroundContextData
  /** 上下文变更回调 */
  onContextChange: (context: PlaygroundContextData) => void
  /** 是否折叠 */
  collapsed?: boolean
  /** 切换折叠状态 */
  onToggleCollapse?: () => void
}

export function PlaygroundContext({
  context,
  onContextChange,
  collapsed = false,
  onToggleCollapse,
}: PlaygroundContextProps) {
  const [userSearchOpen, setUserSearchOpen] = useState(false)
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [draftSearchOpen, setDraftSearchOpen] = useState(false)
  const [draftSearchQuery, setDraftSearchQuery] = useState('')

  // 获取用户列表
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users', 'context-search', userSearchQuery],
    queryFn: async () => {
      const result = await unwrap(api.users.get({ 
        query: { page: 1, limit: 20, search: userSearchQuery || undefined } 
      }))
      return result
    },
    enabled: userSearchOpen,
    staleTime: 30 * 1000,
  })

  // 获取草稿列表（当选择了用户时，按用户筛选）
  const { data: draftsData, isLoading: draftsLoading } = useQuery({
    queryKey: ['activities', 'drafts', context.userId],
    queryFn: async () => {
      const result = await unwrap(api.activities.get({ 
        query: { 
          page: 1, 
          limit: 50, 
          status: 'draft',
          creatorId: context.userId || undefined,
        } 
      }))
      return result
    },
    enabled: draftSearchOpen,
    staleTime: 30 * 1000,
  })

  // 处理用户选择
  const handleUserSelect = useCallback((userId: string, nickname: string, avatarUrl?: string) => {
    onContextChange({
      ...context,
      userId,
      user: { id: userId, nickname, avatarUrl },
      // 清空草稿（因为用户变了）
      draft: undefined,
    })
    setUserSearchOpen(false)
  }, [context, onContextChange])

  // 清除用户选择
  const handleClearUser = useCallback(() => {
    onContextChange({
      ...context,
      userId: undefined,
      user: undefined,
      draft: undefined,
    })
  }, [context, onContextChange])

  // 处理位置选择
  const handleLocationSelect = useCallback((location: typeof PRESET_LOCATIONS[number]) => {
    onContextChange({
      ...context,
      location: {
        lat: location.lat,
        lng: location.lng,
        name: location.name,
      },
    })
  }, [context, onContextChange])

  // 处理坐标输入
  const handleCoordinateChange = useCallback((field: 'lat' | 'lng', value: string) => {
    const numValue = parseFloat(value)
    if (!isNaN(numValue)) {
      onContextChange({
        ...context,
        location: {
          ...context.location,
          [field]: numValue,
          name: undefined, // 手动输入时清除位置名称
        },
      })
    }
  }, [context, onContextChange])

  // 处理草稿选择
  const handleDraftSelect = useCallback((activityId: string, title: string) => {
    onContextChange({
      ...context,
      draft: { activityId, title },
    })
    setDraftSearchOpen(false)
  }, [context, onContextChange])

  // 清除草稿选择
  const handleClearDraft = useCallback(() => {
    onContextChange({
      ...context,
      draft: undefined,
    })
  }, [context, onContextChange])

  // 折叠状态下显示摘要
  if (collapsed) {
    return (
      <div 
        className='flex cursor-pointer items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm hover:bg-muted/50'
        onClick={onToggleCollapse}
      >
        <span className='text-muted-foreground'>上下文:</span>
        {context.user && (
          <Badge variant='secondary' className='gap-1'>
            <User className='h-3 w-3' />
            {context.user.nickname}
          </Badge>
        )}
        <Badge variant='secondary' className='gap-1'>
          <MapPin className='h-3 w-3' />
          {context.location.name || `${context.location.lat.toFixed(4)}, ${context.location.lng.toFixed(4)}`}
        </Badge>
        {context.draft && (
          <Badge variant='secondary' className='gap-1'>
            <FileEdit className='h-3 w-3' />
            {context.draft.title}
          </Badge>
        )}
        <ChevronDown className='ml-auto h-4 w-4 text-muted-foreground' />
      </div>
    )
  }

  return (
    <Card className='border-dashed'>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2 text-sm font-medium'>
            <span>🎭</span>
            上下文配置
          </CardTitle>
          {onToggleCollapse && (
            <Button variant='ghost' size='sm' onClick={onToggleCollapse}>
              收起
            </Button>
          )}
        </div>
        <p className='text-xs text-muted-foreground'>
          模拟不同用户、位置和草稿上下文，测试 AI 在不同场景下的表现
        </p>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* 用户选择 */}
        <div className='space-y-2'>
          <Label className='flex items-center gap-1.5 text-xs'>
            <User className='h-3.5 w-3.5' />
            模拟用户
          </Label>
          <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                role='combobox'
                aria-expanded={userSearchOpen}
                className='w-full justify-between'
              >
                {context.user ? (
                  <span className='flex items-center gap-2'>
                    <span>{context.user.nickname}</span>
                    <span className='text-xs text-muted-foreground'>
                      {context.user.id.slice(0, 8)}...
                    </span>
                  </span>
                ) : (
                  <span className='text-muted-foreground'>选择用户...</span>
                )}
                <ChevronDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-[300px] p-0' align='start'>
              <Command>
                <CommandInput 
                  placeholder='搜索用户...' 
                  value={userSearchQuery}
                  onValueChange={setUserSearchQuery}
                />
                <CommandList>
                  {usersLoading ? (
                    <div className='flex items-center justify-center py-6'>
                      <Loader2 className='h-4 w-4 animate-spin' />
                    </div>
                  ) : (
                    <>
                      <CommandEmpty>未找到用户</CommandEmpty>
                      <CommandGroup>
                        {usersData?.data?.map((user) => (
                          <CommandItem
                            key={user.id}
                            value={user.id}
                            onSelect={() => handleUserSelect(user.id, user.nickname || '匿名用户', user.avatarUrl || undefined)}
                          >
                            <div className='flex flex-col'>
                              <span>{user.nickname || '匿名用户'}</span>
                              <span className='text-xs text-muted-foreground'>
                                {user.phoneNumber || user.id.slice(0, 8)}...
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {context.user && (
            <Button
              variant='ghost'
              size='sm'
              className='h-6 px-2 text-xs'
              onClick={handleClearUser}
            >
              <X className='mr-1 h-3 w-3' />
              清除
            </Button>
          )}
        </div>

        <Separator />

        {/* 位置选择 */}
        <div className='space-y-2'>
          <Label className='flex items-center gap-1.5 text-xs'>
            <MapPin className='h-3.5 w-3.5' />
            模拟位置
          </Label>
          
          {/* 快捷位置按钮 */}
          <div className='flex flex-wrap gap-1.5'>
            {PRESET_LOCATIONS.map((loc) => (
              <Button
                key={loc.name}
                variant={context.location.name === loc.name ? 'default' : 'outline'}
                size='sm'
                className='h-7 text-xs'
                onClick={() => handleLocationSelect(loc)}
              >
                {loc.name}
              </Button>
            ))}
          </div>

          {/* 坐标输入 */}
          <div className='grid grid-cols-2 gap-2'>
            <div className='space-y-1'>
              <Label className='text-xs text-muted-foreground'>纬度 (lat)</Label>
              <Input
                type='number'
                step='0.0001'
                value={context.location.lat}
                onChange={(e) => handleCoordinateChange('lat', e.target.value)}
                className='h-8 font-mono text-xs'
              />
            </div>
            <div className='space-y-1'>
              <Label className='text-xs text-muted-foreground'>经度 (lng)</Label>
              <Input
                type='number'
                step='0.0001'
                value={context.location.lng}
                onChange={(e) => handleCoordinateChange('lng', e.target.value)}
                className='h-8 font-mono text-xs'
              />
            </div>
          </div>

          {context.location.name && (
            <p className='text-xs text-muted-foreground'>
              当前位置: {context.location.name}
            </p>
          )}
        </div>

        <Separator />

        {/* 草稿上下文 */}
        <div className='space-y-2'>
          <Label className='flex items-center gap-1.5 text-xs'>
            <FileEdit className='h-3.5 w-3.5' />
            草稿上下文
            {context.user && (
              <Badge variant='outline' className='ml-1 text-[10px]'>
                {context.user.nickname} 的草稿
              </Badge>
            )}
          </Label>
          <Popover open={draftSearchOpen} onOpenChange={setDraftSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                role='combobox'
                aria-expanded={draftSearchOpen}
                className='w-full justify-between'
              >
                {context.draft ? (
                  <span className='truncate'>{context.draft.title}</span>
                ) : (
                  <span className='text-muted-foreground'>选择草稿...</span>
                )}
                <ChevronDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-[300px] p-0' align='start'>
              <Command>
                <CommandInput 
                  placeholder='搜索草稿...' 
                  value={draftSearchQuery}
                  onValueChange={setDraftSearchQuery}
                />
                <CommandList>
                  {draftsLoading ? (
                    <div className='flex items-center justify-center py-6'>
                      <Loader2 className='h-4 w-4 animate-spin' />
                    </div>
                  ) : (
                    <>
                      <CommandEmpty>
                        {context.user 
                          ? `${context.user.nickname} 没有草稿` 
                          : '未找到草稿'}
                      </CommandEmpty>
                      <CommandGroup heading={context.user ? `${context.user.nickname} 的草稿` : '所有草稿'}>
                        {draftsData?.data
                          ?.filter((draft: { id: string; title: string; type?: string }) => 
                            !draftSearchQuery || 
                            draft.title.toLowerCase().includes(draftSearchQuery.toLowerCase())
                          )
                          .map((draft: { id: string; title: string; type?: string; locationName?: string }) => (
                          <CommandItem
                            key={draft.id}
                            value={draft.id}
                            onSelect={() => handleDraftSelect(draft.id, draft.title)}
                          >
                            <div className='flex flex-col'>
                              <span>{draft.title}</span>
                              <span className='text-xs text-muted-foreground'>
                                {draft.type && `${draft.type}`}
                                {draft.locationName && ` · ${draft.locationName}`}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {context.draft && (
            <Button
              variant='ghost'
              size='sm'
              className='h-6 px-2 text-xs'
              onClick={handleClearDraft}
            >
              <X className='mr-1 h-3 w-3' />
              清除
            </Button>
          )}
          {!context.user && (
            <p className='text-xs text-muted-foreground'>
              💡 选择用户后可筛选该用户的草稿
            </p>
          )}
        </div>

        {/* 当前上下文摘要 */}
        <div className='rounded-lg bg-muted/50 p-3'>
          <p className='mb-2 text-xs font-medium text-muted-foreground'>当前上下文摘要</p>
          <div className='space-y-1 text-xs'>
            <p>
              <span className='text-muted-foreground'>用户:</span>{' '}
              {context.user?.nickname || '未指定（使用默认）'}
            </p>
            <p>
              <span className='text-muted-foreground'>位置:</span>{' '}
              {context.location.name || `(${context.location.lat.toFixed(4)}, ${context.location.lng.toFixed(4)})`}
            </p>
            <p>
              <span className='text-muted-foreground'>草稿:</span>{' '}
              {context.draft?.title || '无'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/** 默认上下文 */
export const DEFAULT_CONTEXT: PlaygroundContextData = {
  location: {
    lat: 29.5630,
    lng: 106.5516,
    name: '观音桥',
  },
}
