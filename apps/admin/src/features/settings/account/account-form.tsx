import { Type, type Static } from '@sinclair/typebox'
import { useForm } from 'react-hook-form'
import { typeboxResolver } from '@hookform/resolvers/typebox'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

// 账户设置表单 Schema
const accountFormSchema = Type.Object({
  phoneNumber: Type.Optional(Type.String({ pattern: '^1[3-9]\\d{9}$' })),
})

type AccountFormValues = Static<typeof accountFormSchema>

export function AccountForm() {
  const { user, reset } = useAuthStore()

  const form = useForm<AccountFormValues>({
    resolver: typeboxResolver(accountFormSchema),
    defaultValues: {
      phoneNumber: user?.phoneNumber || '',
    },
  })

  async function onSubmit(data: AccountFormValues) {
    // TODO: 调用 API 更新手机号（需要验证码）
    toast.info('手机号修改功能开发中')
    console.log('提交数据:', data)
  }

  // 格式化日期
  const formatDate = (timestamp: number | undefined) => {
    if (!timestamp) return '-'
    return new Date(timestamp * 1000).toLocaleString('zh-CN')
  }

  return (
    <div className='space-y-6'>
      {/* 账户状态 */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>账户状态</CardTitle>
          <CardDescription>您的账户当前状态和权限</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-muted-foreground'>账户角色</span>
            <Badge variant='default'>
              {user?.role?.name || '普通用户'}
            </Badge>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-muted-foreground'>登录状态</span>
            <Badge variant='outline' className='text-green-600'>
              已登录
            </Badge>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-muted-foreground'>登录过期时间</span>
            <span className='text-sm'>{formatDate(user?.exp)}</span>
          </div>
        </CardContent>
      </Card>

      {/* 手机号设置 */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>手机号</CardTitle>
          <CardDescription>用于登录和接收通知</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
              <FormField
                control={form.control}
                name='phoneNumber'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>当前手机号</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder='请输入手机号' 
                        disabled 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      手机号是您的主要登录凭证，暂不支持修改。
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* 权限列表 */}
      {user?.role?.permissions && (
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>权限列表</CardTitle>
            <CardDescription>您当前拥有的系统权限</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {user.role.permissions.map((permission, index) => (
                <div key={index} className='flex items-center justify-between'>
                  <span className='text-sm font-medium capitalize'>
                    {permission.resource}
                  </span>
                  <div className='flex gap-1'>
                    {permission.actions.map((action) => (
                      <Badge key={action} variant='secondary' className='text-xs'>
                        {action}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* 危险操作 */}
      <Card className='border-destructive/50'>
        <CardHeader>
          <CardTitle className='text-base text-destructive'>危险操作</CardTitle>
          <CardDescription>以下操作不可撤销，请谨慎操作</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium'>退出登录</p>
              <p className='text-xs text-muted-foreground'>
                退出当前账户，需要重新登录
              </p>
            </div>
            <Button 
              variant='outline' 
              size='sm'
              onClick={() => {
                reset()
                window.location.href = '/sign-in'
              }}
            >
              退出登录
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
