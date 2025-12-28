// API 集成入口文件
// 统一导出所有 API 相关的工具和类型

// Eden Treaty 客户端
export { api, auth, unwrap, apiCall } from './eden'

// TypeBox 类型和工具
export * from './typebox'

// Query Client 配置
export { queryClient, queryKeys, invalidateQueries, prefetchQueries, optimisticUpdates } from './query-client'

// 错误处理
export { handleServerError, handleBusinessError, handleNetworkError } from './handle-server-error'

// API Hooks
export * from '../hooks/use-users'
export * from '../hooks/use-activities'

// 使用示例和最佳实践
/*
## 基本用法

### 1. 简单的数据获取
```typescript
import { useUsersList } from '@/lib/api'

function UsersList() {
  const { data: users, isLoading, error } = useUsersList({
    page: 1,
    limit: 20,
    search: 'john'
  })
  
  if (isLoading) return <div>加载中...</div>
  if (error) return <div>加载失败</div>
  
  return (
    <div>
      {users?.data.map(user => (
        <div key={user.id}>{user.nickname}</div>
      ))}
    </div>
  )
}
```

### 2. 数据变更操作
```typescript
import { useUserModeration, invalidateQueries } from '@/lib/api'

function UserModerationButton({ userId }: { userId: string }) {
  const mutation = useUserModeration()
  
  const handleBlock = async () => {
    try {
      await mutation.mutateAsync({
        id: userId,
        data: {
          action: 'block',
          reason: '违反社区规定',
          notes: '多次发布不当内容'
        }
      })
      // 成功后会自动失效相关缓存
    } catch (error) {
      // 错误会自动显示 toast
    }
  }
  
  return (
    <button 
      onClick={handleBlock}
      disabled={mutation.isPending}
    >
      {mutation.isPending ? '处理中...' : '封禁用户'}
    </button>
  )
}
```

### 3. 实时数据监控
```typescript
import { useKPIMetrics } from '@/lib/api'

function Dashboard() {
  const { data: metrics } = useKPIMetrics() // 自动 30 秒刷新
  
  return (
    <div>
      <div>在线用户: {metrics?.activeUsers}</div>
      <div>进行中活动: {metrics?.ongoingActivities}</div>
      <div>待审核内容: {metrics?.pendingModerations}</div>
    </div>
  )
}
```

### 4. 批量操作
```typescript
import { useBulkUserAction } from '@/lib/api'

function BulkUserActions({ selectedUserIds }: { selectedUserIds: string[] }) {
  const bulkAction = useBulkUserAction()
  
  const handleBulkBlock = async () => {
    await bulkAction.mutateAsync({
      ids: selectedUserIds,
      action: {
        action: 'block',
        reason: '批量处理违规用户'
      }
    })
  }
  
  return (
    <button onClick={handleBulkBlock}>
      批量封禁 ({selectedUserIds.length} 个用户)
    </button>
  )
}
```

### 5. 手动缓存管理
```typescript
import { invalidateQueries, queryClient } from '@/lib/api'

// 手动失效缓存
invalidateQueries.users.all()
invalidateQueries.activities.detail('activity-id')

// 预取数据
queryClient.prefetchQuery({
  queryKey: ['users', 'list', { page: 2 }],
  queryFn: () => api.users.get({ query: { page: 2 } })
})

// 乐观更新
queryClient.setQueryData(['users', 'detail', userId], (oldData) => ({
  ...oldData,
  status: 'blocked'
}))
```

## 错误处理

所有 API 调用都会自动处理错误：
- 网络错误：显示网络连接失败提示
- 401 错误：自动跳转到登录页
- 403 错误：显示权限不足提示
- 422 错误：显示数据验证失败提示
- 500 错误：显示服务器错误提示

如需自定义错误处理，可以在 mutation 的 onError 回调中处理：

```typescript
const mutation = useUserModeration({
  onError: (error) => {
    // 自定义错误处理
    console.error('用户审核失败:', error)
  }
})
```

## 类型安全

所有 API 调用都是类型安全的，基于 Eden Treaty 和 TypeBox：

```typescript
// 编译时类型检查
const { data } = await api.users.get({
  query: {
    page: 1,        // ✅ number
    limit: 20,      // ✅ number
    search: 'john', // ✅ string
    invalid: true   // ❌ 编译错误：不存在的属性
  }
})

// 响应数据类型自动推导
data.forEach(user => {
  console.log(user.id)       // ✅ string
  console.log(user.nickname) // ✅ string
  console.log(user.invalid)  // ❌ 编译错误：不存在的属性
})
```
*/