// Prompt 查看页面 - 代码即配置模式
import { FileCode, GitBranch, Info } from 'lucide-react'
import { useCurrentPrompt } from '@/hooks/use-ai-metrics'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function PromptViewer() {
  const { data, isLoading, error } = useCurrentPrompt()

  return (
    <>
      <Header fixed>
        <div className='flex items-center gap-2'>
          <FileCode className='h-5 w-5' />
          <h1 className='text-lg font-semibold'>System Prompt</h1>
        </div>
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        {/* 版本控制说明 */}
        <Alert>
          <GitBranch className='h-4 w-4' />
          <AlertTitle>代码即配置</AlertTitle>
          <AlertDescription>
            System Prompt 通过 Git 版本控制管理。修改 Prompt 需要提交代码到仓库。
            <br />
            文件位置：<code className='text-xs bg-muted px-1 py-0.5 rounded'>apps/api/src/modules/ai/prompts/xiaoju-v34.ts</code>
          </AlertDescription>
        </Alert>

        {isLoading ? (
          <div className='space-y-4'>
            <Skeleton className='h-24' />
            <Skeleton className='h-96' />
          </div>
        ) : error ? (
          <div className='text-center py-8 text-muted-foreground'>
            加载失败：{error.message}
          </div>
        ) : (
          <>
            {/* Prompt 信息卡片 */}
            <Card>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <div>
                    <CardTitle className='text-base'>{data?.description}</CardTitle>
                    <CardDescription className='mt-1'>
                      最后修改：{String(data?.lastModified ?? '')}
                    </CardDescription>
                  </div>
                  <Badge variant='secondary'>{data?.version}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className='space-y-2'>
                  <div className='text-sm font-medium'>特性：</div>
                  <div className='flex flex-wrap gap-2'>
                    {data?.features.map((feature, index) => (
                      <Badge key={index} variant='outline'>
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Prompt 内容 */}
            <Card>
              <CardHeader>
                <CardTitle className='text-base flex items-center gap-2'>
                  <Info className='h-4 w-4' />
                  System Prompt 内容（只读）
                </CardTitle>
              </CardHeader>
              <CardContent className='p-0'>
                <pre className='overflow-auto bg-muted p-4 text-sm font-mono whitespace-pre-wrap max-h-[600px]'>
                  {data?.content}
                </pre>
              </CardContent>
            </Card>
          </>
        )}
      </Main>
    </>
  )
}
