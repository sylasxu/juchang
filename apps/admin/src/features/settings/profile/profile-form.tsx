import { useForm } from 'react-hook-form'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { api } from '@/lib/eden'

// 从 Eden Treaty 推导用户更新的 body 类型
type UpdateUserBody = NonNullable<Parameters<ReturnType<typeof api.users>['put']>[0]>
type ProfileFormValues = Pick<UpdateUserBody, 'nickname' | 'avatarUrl'>

export function ProfileForm() {
  const { user, setUser } = useAuthStore()

  // 无需 resolver，API 层已做验证
  const form = useForm<ProfileFormValues>({
    defaultValues: {
      nickname: user?.username || '',
      avatarUrl: user?.avatarUrl || '',
    },
    mode: 'onChange',
  })

  async function onSubmit(data: ProfileFormValues) {
    // TODO: 调用 API 更新用户资料
    // await api.users[userId].put(data)
    
    // 更新本地状态
    if (user) {
      setUser({
        ...user,
        username: data.nickname || '',
        avatarUrl: data.avatarUrl,
      })
    }
    
    toast.success('资料已更新')
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='space-y-8'
      >
        {/* 头像预览 */}
        <div className='flex items-center gap-4'>
          <Avatar className='h-20 w-20'>
            <AvatarImage src={form.watch('avatarUrl') || user?.avatarUrl} alt={user?.username} />
            <AvatarFallback className='text-2xl'>
              {(user?.username || '管')[0]}
            </AvatarFallback>
          </Avatar>
          <div className='text-sm text-muted-foreground'>
            <p>头像将显示在个人资料和评论中</p>
            <p>建议使用正方形图片</p>
          </div>
        </div>

        <FormField
          control={form.control}
          name='nickname'
          render={({ field }) => (
            <FormItem>
              <FormLabel>昵称</FormLabel>
              <FormControl>
                <Input placeholder='请输入昵称' {...field} />
              </FormControl>
              <FormDescription>
                这是您的公开显示名称，其他用户可以看到。
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='avatarUrl'
          render={({ field }) => (
            <FormItem>
              <FormLabel>头像链接</FormLabel>
              <FormControl>
                <Input placeholder='https://example.com/avatar.jpg' {...field} />
              </FormControl>
              <FormDescription>
                输入头像图片的 URL 地址。
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 只读信息 */}
        <div className='space-y-4'>
          <h4 className='text-sm font-medium'>账户信息</h4>
          <div className='space-y-3'>
            <div className='flex justify-between py-2'>
              <span className='text-sm text-muted-foreground'>用户 ID</span>
              <span className='font-mono text-xs'>{user?.id || '-'}</span>
            </div>
            <div className='flex justify-between py-2'>
              <span className='text-sm text-muted-foreground'>手机号</span>
              <span className='text-sm'>{user?.phoneNumber || '未绑定'}</span>
            </div>
          </div>
        </div>

        <Button type='submit'>保存资料</Button>
      </form>
    </Form>
  )
}
