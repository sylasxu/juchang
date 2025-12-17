import { useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { TopNav } from '@/components/layout/top-nav'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ModerationDecisionPanel } from './moderation-decision-panel'
import { ModerationTemplates } from './moderation-templates'
import { ModerationHistory } from './moderation-history'
import { useModerationItem } from '@/hooks/use-moderation'
import { ArrowLeft, Clock, AlertTriangle } from 'lucide-react'

export function ModerationDecisionPage() {
  const { id } = useParams({ from: '/_authenticated/moderation/$id' })
  const navigate = useNavigate()
  const [showTemplates, setShowTemplates] = useState(false)
  
  const { data: item, isLoading, error } = useModerationItem(id)

  const handleDecisionComplete = () => {
    // 决策完成后返回队列页面
    navigate({ to: '/moderation' })
  }

  const handleGoBack = () => {
    navigate({ to: '/moderation' })
  }

  if (isLoading) {
    return (
      <>
        <Header>
          <TopNav links={topNav} />
          <div className='ms-auto flex items-center space-x-4'>
            <Search />
            <ThemeSwitch />
            <ConfigDrawer />
            <ProfileDropdown />
          </div>
        </Header>
        <Main>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Skeleton className="h-96 w-full" />
              </div>
              <div>
                <Skeleton className="h-96 w-full" />
              </div>
            </div>
          </div>
        </Main>
      </>
    )
  }

  if (error || !item) {
    return (
      <>
        <Header>
          <TopNav links={topNav} />
          <div className='ms-auto flex items-center space-x-4'>
            <Search />
            <ThemeSwitch />
            <ConfigDrawer />
            <ProfileDropdown />
          </div>
        </Header>
        <Main>
          <div className="flex items-center justify-center py-12">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <CardTitle>审核项目不存在</CardTitle>
                <CardDescription>
                  请检查链接是否正确，或该项目可能已被处理
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleGoBack} className="w-full">
                  返回审核队列
                </Button>
              </CardContent>
            </Card>
          </div>
        </Main>
      </>
    )
  }

  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header>
        <TopNav links={topNav} />
        <div className='ms-auto flex items-center space-x-4'>
          <Search />
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      {/* ===== Main ===== */}
      <Main>
        <div className="space-y-6">
          {/* 页面头部 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGoBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                返回队列
              </Button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">审核决策</h1>
                <p className="text-muted-foreground">
                  对审核项目进行详细决策和处理
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTemplates(!showTemplates)}
              >
                {showTemplates ? '隐藏模板' : '显示模板'}
              </Button>
              <Badge variant={item.status === 'pending' ? 'secondary' : 'outline'}>
                {item.status === 'pending' ? '待处理' : '已处理'}
              </Badge>
            </div>
          </div>

          {/* 状态提示 */}
          {item.status !== 'pending' && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="flex items-center gap-3 pt-6">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800">
                    该项目已被处理
                  </p>
                  <p className="text-sm text-yellow-600">
                    当前状态: {item.status}，您仍可以查看详情或重新处理
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 主要内容区域 */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* 决策面板 */}
            <div className="xl:col-span-3">
              <ModerationDecisionPanel 
                item={item}
                onDecisionComplete={handleDecisionComplete}
              />
            </div>

            {/* 侧边栏 */}
            <div className="space-y-6">
              {/* 审核模板 */}
              {showTemplates && (
                <ModerationTemplates 
                  itemType={item.type}
                  onTemplateSelect={(template) => {
                    // 这里可以实现模板选择逻辑
                    console.log('Selected template:', template)
                  }}
                />
              )}

              {/* 审核历史 */}
              <ModerationHistory 
                targetId={item.targetId}
                targetType={item.targetType}
              />
            </div>
          </div>
        </div>
      </Main>
    </>
  )
}

const topNav = [
  {
    title: '审核决策',
    href: '/moderation/decision',
    isActive: true,
    disabled: false,
  },
  {
    title: '审核队列',
    href: '/moderation',
    isActive: false,
    disabled: false,
  },
  {
    title: '审核规则',
    href: '/moderation/rules',
    isActive: false,
    disabled: true,
  },
]