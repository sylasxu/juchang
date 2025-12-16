import { useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { format } from 'date-fns'
import { ArrowLeft, Shield, AlertTriangle, CheckCircle, Ban, User, Crown } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useAdminUser, useBlockUser, useUnblockUser } from '../hooks/use-users'
import { genderLabels } from '../data/data'
import { UserModerationActions } from './user-moderation-actions'

export function UserDetail() {
  const { id } = useParams({ from: '/_authenticated/users/$id' })
  const navigate = useNavigate()
  const { data: user, isLoading, isError, error } = useAdminUser(id)
  const blockUser = useBlockUser()
  const unblockUser = useUnblockUser()

  const [activeTab, setActiveTab] = useState('overview')

  if (isLoading) {
    return (
      <>
        <Header fixed>
          <div className='flex items-center gap-4'>
            <Button variant='ghost' size='sm' onClick={() => navigate({ to: '/users' })}>
              <ArrowLeft className='h-4 w-4' />
              返回
            </Button>
            <Separator orientation='vertical' className='h-6' />
            <div>
              <Skeleton className='h-6 w-32' />
              <Skeleton className='h-4 w-24 mt-1' />
            </div>
          </div>
          <div className='ms-auto flex items-center space-x-4'>
            <ThemeSwitch />
            <ProfileDropdown />
          </div>
        </Header>

        <Main className='flex flex-1 flex-col gap-6'>
          <div className='grid gap-6 md:grid-cols-3'>
            <div className='md:col-span-2 space-y-6'>
              <Skeleton className='h-48 w-full' />
              <Skeleton className='h-64 w-full' />
            </div>
            <div className='space-y-6'>
              <Skeleton className='h-32 w-full' />
              <Skeleton className='h-48 w-full' />
            </div>
          </div>
        </Main>
      </>
    )
  }

  if (isError || !user) {
    return (
      <>
        <Header fixed>
          <div className='flex items-center gap-4'>
            <Button variant='ghost' size='sm' onClick={() => navigate({ to: '/users' })}>
              <ArrowLeft className='h-4 w-4' />
              返回
            </Button>
          </div>
          <div className='ms-auto flex items-center space-x-4'>
            <ThemeSwitch />
            <ProfileDropdown />
          </div>
        </Header>

        <Main className='flex flex-1 flex-col gap-6'>
          <div className='rounded-lg border border-destructive/50 bg-destructive/10 p-4'>
            <p className='text-destructive'>
              加载失败: {error?.message || '用户不存在'}
            </p>
          </div>
        </Main>
      </>
    )
  }

  const handleBlock = async () => {
    try {
      await blockUser.mutateAsync(user.id)
    } catch (error) {
      console.error('封禁用户失败:', error)
    }
  }

  const handleUnblock = async () => {
    try {
      await unblockUser.mutateAsync(user.id)
    } catch (error) {
      console.error('解封用户失败:', error)
    }
  }

  return (
    <>
      <Header fixed>
        <div className='flex items-center gap-4'>
          <Button variant='ghost' size='sm' onClick={() => navigate({ to: '/users' })}>
            <ArrowLeft className='h-4 w-4' />
            返回
          </Button>
          <Separator orientation='vertical' className='h-6' />
          <div>
            <h1 className='text-lg font-semibold'>{user.nickname || '未设置昵称'}</h1>
            <p className='text-sm text-muted-foreground'>用户详情</p>
          </div>
        </div>
        <div className='ms-auto flex items-center space-x-4'>
          <UserModerationActions 
            user={user}
            onBlock={handleBlock}
            onUnblock={handleUnblock}
            isLoading={blockUser.isPending || unblockUser.isPending}
          />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-6'>
        <div className='grid gap-6 md:grid-cols-3'>
          {/* 主要内容区域 */}
          <div className='md:col-span-2'>
            <Tabs value={activeTab} onValueChange={setActiveTab} className='space-y-6'>
              <TabsList className='grid w-full grid-cols-4'>
                <TabsTrigger value='overview'>概览</TabsTrigger>
                <TabsTrigger value='activities'>活动记录</TabsTrigger>
                <TabsTrigger value='transactions'>交易记录</TabsTrigger>
                <TabsTrigger value='moderation'>审核记录</TabsTrigger>
              </TabsList>

              <TabsContent value='overview' className='space-y-6'>
                {/* 基础信息 */}
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <User className='h-5 w-5' />
                      基础信息
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='flex items-center gap-4'>
                      <Avatar className='h-16 w-16'>
                        <AvatarImage src={user.avatarUrl || undefined} alt={user.nickname || ''} />
                        <AvatarFallback className='text-lg'>
                          {(user.nickname || '?')[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className='space-y-1'>
                        <h3 className='text-lg font-semibold'>{user.nickname || '未设置昵称'}</h3>
                        <p className='text-sm text-muted-foreground'>{user.bio || '暂无个人简介'}</p>
                        <div className='flex items-center gap-2'>
                          <Badge variant='outline' className={cn(
                            user.membershipType === 'pro' 
                              ? 'bg-amber-100/50 text-amber-900 border-amber-300' 
                              : 'bg-neutral-300/40 border-neutral-300'
                          )}>
                            {user.membershipType === 'pro' ? (
                              <>
                                <Crown className='h-3 w-3 mr-1' />
                                Pro 会员
                              </>
                            ) : (
                              '免费用户'
                            )}
                          </Badge>
                          <Badge variant='outline' className={cn(
                            user.isRealNameVerified 
                              ? 'text-green-600 border-green-200' 
                              : 'text-gray-500 border-gray-200'
                          )}>
                            {user.isRealNameVerified ? '已实名认证' : '未实名认证'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className='grid grid-cols-2 gap-4 pt-4 border-t'>
                      <div>
                        <p className='text-sm font-medium text-muted-foreground'>手机号</p>
                        <p className='text-sm'>{user.phoneNumber || '未绑定'}</p>
                      </div>
                      <div>
                        <p className='text-sm font-medium text-muted-foreground'>性别</p>
                        <p className='text-sm'>{genderLabels[user.gender]}</p>
                      </div>
                      <div>
                        <p className='text-sm font-medium text-muted-foreground'>注册时间</p>
                        <p className='text-sm'>{format(new Date(user.createdAt), 'yyyy-MM-dd HH:mm')}</p>
                      </div>
                      <div>
                        <p className='text-sm font-medium text-muted-foreground'>最后活跃</p>
                        <p className='text-sm'>
                          {user.lastActiveAt 
                            ? format(new Date(user.lastActiveAt), 'yyyy-MM-dd HH:mm')
                            : '从未活跃'
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 统计数据 */}
                <Card>
                  <CardHeader>
                    <CardTitle>活动统计</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                      <div className='text-center p-4 rounded-lg bg-muted/50'>
                        <p className='text-2xl font-bold text-blue-600'>{user.totalActivitiesCreated}</p>
                        <p className='text-sm text-muted-foreground'>创建活动</p>
                      </div>
                      <div className='text-center p-4 rounded-lg bg-muted/50'>
                        <p className='text-2xl font-bold text-green-600'>{user.participationCount}</p>
                        <p className='text-sm text-muted-foreground'>参与活动</p>
                      </div>
                      <div className='text-center p-4 rounded-lg bg-muted/50'>
                        <p className='text-2xl font-bold text-purple-600'>{user.reliabilityRate}%</p>
                        <p className='text-sm text-muted-foreground'>履约率</p>
                      </div>
                      <div className='text-center p-4 rounded-lg bg-muted/50'>
                        <p className='text-2xl font-bold text-orange-600'>{user.disputeCount}</p>
                        <p className='text-sm text-muted-foreground'>争议次数</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value='activities'>
                <Card>
                  <CardHeader>
                    <CardTitle>活动记录</CardTitle>
                    <CardDescription>用户创建和参与的活动历史</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className='text-muted-foreground text-center py-8'>
                      活动记录功能开发中...
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value='transactions'>
                <Card>
                  <CardHeader>
                    <CardTitle>交易记录</CardTitle>
                    <CardDescription>用户的付费记录和交易历史</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className='text-muted-foreground text-center py-8'>
                      交易记录功能开发中...
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value='moderation'>
                <Card>
                  <CardHeader>
                    <CardTitle>审核记录</CardTitle>
                    <CardDescription>用户的审核历史和处理记录</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className='text-muted-foreground text-center py-8'>
                      审核记录功能开发中...
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* 侧边栏 */}
          <div className='space-y-6'>
            {/* 状态卡片 */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Shield className='h-5 w-5' />
                  账户状态
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium'>账户状态</span>
                  <Badge variant='outline' className={cn(
                    user.isBlocked 
                      ? 'bg-destructive/10 text-destructive border-destructive/10' 
                      : 'bg-teal-100/30 text-teal-900 border-teal-200'
                  )}>
                    {user.isBlocked ? (
                      <>
                        <Ban className='h-3 w-3 mr-1' />
                        已封禁
                      </>
                    ) : (
                      <>
                        <CheckCircle className='h-3 w-3 mr-1' />
                        正常
                      </>
                    )}
                  </Badge>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium'>审核状态</span>
                  <Badge variant='outline' className={cn(
                    user.moderationStatus === 'blocked' ? 'text-red-600 border-red-200' :
                    user.moderationStatus === 'flagged' ? 'text-yellow-600 border-yellow-200' :
                    'text-green-600 border-green-200'
                  )}>
                    {user.moderationStatus === 'blocked' ? '已封禁' :
                     user.moderationStatus === 'flagged' ? '已标记' : '正常'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* 风险评估 */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <AlertTriangle className='h-5 w-5' />
                  风险评估
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='text-center'>
                  <div className={cn(
                    'text-3xl font-bold mb-2',
                    user.riskScore >= 70 ? 'text-red-600' :
                    user.riskScore >= 40 ? 'text-yellow-600' :
                    'text-green-600'
                  )}>
                    {user.riskScore}
                  </div>
                  <p className='text-sm text-muted-foreground'>风险评分</p>
                  <div className='w-full bg-gray-200 rounded-full h-2 mt-2'>
                    <div 
                      className={cn(
                        'h-2 rounded-full transition-all',
                        user.riskScore >= 70 ? 'bg-red-500' :
                        user.riskScore >= 40 ? 'bg-yellow-500' :
                        'bg-green-500'
                      )}
                      style={{ width: `${user.riskScore}%` }}
                    />
                  </div>
                </div>
                
                <div className='space-y-2 pt-4 border-t'>
                  <div className='flex justify-between text-sm'>
                    <span>争议次数</span>
                    <span className='font-medium'>{user.disputeCount}</span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span>履约率</span>
                    <span className='font-medium'>{user.reliabilityRate}%</span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span>实名认证</span>
                    <span className='font-medium'>
                      {user.isRealNameVerified ? '已认证' : '未认证'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI 配额信息 */}
            <Card>
              <CardHeader>
                <CardTitle>AI 配额</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='flex justify-between text-sm'>
                  <span>今日创建配额</span>
                  <span className='font-medium'>{user.aiCreateQuotaToday}</span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span>今日搜索配额</span>
                  <span className='font-medium'>{user.aiSearchQuotaToday}</span>
                </div>
                {user.aiQuotaResetAt && (
                  <div className='flex justify-between text-sm'>
                    <span>配额重置时间</span>
                    <span className='font-medium text-xs'>
                      {format(new Date(user.aiQuotaResetAt), 'MM-dd HH:mm')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </Main>
    </>
  )
}