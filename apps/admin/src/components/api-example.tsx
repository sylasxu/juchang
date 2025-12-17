// API 使用示例组件
// 演示如何使用 Eden Treaty 集成的 API hooks

import React from 'react'
import { useUsersList, useUserDetail, useBlockUser } from '@/hooks/use-users'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import type { User } from '@/features/users/data/schema'

// 用户列表示例
export function UsersListExample() {
  const { data: users, isLoading, error } = useUsersList({
    page: 1,
    limit: 10,
  })

  if (isLoading) {
    return <div className="p-4">加载用户列表中...</div>
  }

  if (error) {
    return <div className="p-4 text-red-500">加载失败: {error.message}</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>用户列表示例</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {Array.isArray(users) ? users.map((user: any) => (
            <div key={user.id} className="flex items-center justify-between p-2 border rounded">
              <div>
                <div className="font-medium">{user.nickname || '未设置昵称'}</div>
                <div className="text-sm text-gray-500">{user.phoneNumber}</div>
              </div>
              <UserActionExample userId={user.id} />
            </div>
          )) : null}
        </div>
      </CardContent>
    </Card>
  )
}

// 用户详情示例
export function UserDetailExample({ userId }: { userId: string }) {
  const { data: user, isLoading, error } = useUserDetail(userId) as { data: User | undefined, isLoading: boolean, error: any }

  if (isLoading) {
    return <div>加载用户详情中...</div>
  }

  if (error) {
    return <div className="text-red-500">加载失败: {error.message}</div>
  }

  if (!user) {
    return <div>用户不存在</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>用户详情示例</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div><strong>ID:</strong> {user?.id}</div>
          <div><strong>昵称:</strong> {user?.nickname || '未设置'}</div>
          <div><strong>手机号:</strong> {user?.phoneNumber}</div>
          <div><strong>性别:</strong> {user?.gender}</div>
          <div><strong>会员类型:</strong> {user?.membershipType}</div>
          <div><strong>是否封禁:</strong> {user?.isBlocked ? '是' : '否'}</div>
          <div><strong>创建时间:</strong> {user?.createdAt ? new Date(user.createdAt).toLocaleString() : '未知'}</div>
        </div>
      </CardContent>
    </Card>
  )
}

// 用户操作示例
export function UserActionExample({ userId }: { userId: string }) {
  const blockUser = useBlockUser()

  const handleBlockUser = async () => {
    try {
      await blockUser.mutateAsync({
        id: userId,
        data: {} // 封禁操作不需要额外数据
      })
      toast.success('用户已封禁')
    } catch (error) {
      // 错误已经在 hook 中处理，这里可以添加额外的处理逻辑
      console.error('封禁用户失败:', error)
    }
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleBlockUser}
      disabled={blockUser.isPending}
    >
      {blockUser.isPending ? '处理中...' : '封禁用户'}
    </Button>
  )
}

// API 状态监控示例
export function ApiStatusExample() {
  const [apiStatus, setApiStatus] = React.useState<'checking' | 'connected' | 'error'>('checking')

  React.useEffect(() => {
    // 简单的 API 连接测试
    const testConnection = async () => {
      try {
        // 这里可以调用一个简单的 API 来测试连接
        setApiStatus('connected')
      } catch (error) {
        setApiStatus('error')
      }
    }

    testConnection()
  }, [])

  const statusColor = {
    checking: 'text-yellow-500',
    connected: 'text-green-500',
    error: 'text-red-500',
  }[apiStatus]

  const statusText = {
    checking: '检查中...',
    connected: '已连接',
    error: '连接失败',
  }[apiStatus]

  return (
    <Card>
      <CardHeader>
        <CardTitle>API 状态监控</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`font-medium ${statusColor}`}>
          状态: {statusText}
        </div>
        <div className="text-sm text-gray-500 mt-2">
          Eden Treaty 客户端连接状态
        </div>
      </CardContent>
    </Card>
  )
}

// 完整示例页面
export function ApiIntegrationExample() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Eden Treaty API 集成示例</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ApiStatusExample />
        <UserDetailExample userId="example-user-id" />
      </div>
      
      <UsersListExample />
    </div>
  )
}