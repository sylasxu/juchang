import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export function AccountForm() {
  const { user, reset } = useAuthStore()

  const formatDate = (timestamp: number | undefined) => {
    if (!timestamp) return '-'
    return new Date(timestamp * 1000).toLocaleString('zh-CN')
  }

  return (
    <div className='space-y-8'>
      {/* 账户状态 */}
      <section className='space-y-4'>
        <div>
          <h3 className='text-sm font-medium'>账户状态</h3>
          <p className='text-sm text-muted-foreground'>您的账户当前状态和权限</p>
        </div>
        <div className='space-y-3'>
          <div className='flex items-center justify-between py-2'>
            <span className='text-sm text-muted-foreground'>账户角色</span>
            <Badge variant='default'>
              {user?.role?.name || '普通用户'}
            </Badge>
          </div>
          <div className='flex items-center justify-between py-2'>
            <span className='text-sm text-muted-foreground'>登录状态</span>
            <span className='text-sm text-green-600'>已登录</span>
          </div>
          <div className='flex items-center justify-between py-2'>
            <span className='text-sm text-muted-foreground'>登录过期时间</span>
            <span className='text-sm'>{formatDate(user?.exp)}</span>
          </div>
        </div>
      </section>

      {/* 手机号 */}
      <section className='space-y-4'>
        <div>
          <h3 className='text-sm font-medium'>手机号</h3>
          <p className='text-sm text-muted-foreground'>用于登录和接收通知</p>
        </div>
        <div className='space-y-2'>
          <Input 
            value={user?.phoneNumber || ''} 
            disabled 
            className='max-w-sm'
          />
          <p className='text-xs text-muted-foreground'>
            手机号是您的主要登录凭证，暂不支持修改
          </p>
        </div>
      </section>

      {/* 权限列表 */}
      {user?.role?.permissions && (
        <section className='space-y-4'>
          <div>
            <h3 className='text-sm font-medium'>权限列表</h3>
            <p className='text-sm text-muted-foreground'>您当前拥有的系统权限</p>
          </div>
          <div className='space-y-2'>
            {user.role.permissions.map((permission, index) => (
              <div key={index} className='flex items-center justify-between py-2'>
                <span className='text-sm capitalize'>{permission.resource}</span>
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
        </section>
      )}

      {/* 退出登录 */}
      <section className='space-y-4 pt-4'>
        <div className='flex items-center justify-between'>
          <div>
            <h3 className='text-sm font-medium text-destructive'>退出登录</h3>
            <p className='text-sm text-muted-foreground'>退出当前账户，需要重新登录</p>
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
      </section>
    </div>
  )
}
