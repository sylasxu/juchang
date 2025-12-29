---
inclusion: fileMatch
fileMatchPattern: "apps/admin/**/*"
---

# Admin Console 开发模式指南

本文档定义了 Admin Console (apps/admin) 的标准开发模式。

---

## 🌐 API 调用规范 (核心)

### Eden Treaty + unwrap 模式

所有 API 调用使用 `unwrap` 函数处理 Eden Treaty 响应：

```typescript
import { api, unwrap } from '@/lib/eden'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

// 列表查询
export function useUsersList(filters: { page?: number; limit?: number; search?: string } = {}) {
  const { page = 1, limit = 20, search } = filters
  
  return useQuery({
    queryKey: ['users', { page, limit, search }],
    queryFn: async () => {
      const result = await unwrap(api.users.get({ query: { page, limit, search } }))
      return result
    },
  })
}

// 详情查询
export function useUserDetail(userId: string) {
  return useQuery({
    queryKey: ['users', userId],
    queryFn: () => unwrap(api.users({ id: userId }).get()),
    enabled: !!userId,
  })
}

// 更新 Mutation
export function useUpdateUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserRequest }) => {
      return unwrap(api.users({ id }).put(data))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('用户信息已更新')
    },
    onError: (error: Error) => {
      toast.error(`更新失败: ${error.message}`)
    },
  })
}

// 删除 Mutation
export function useDeleteUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      return unwrap(api.users({ id }).delete())
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('用户已删除')
    },
    onError: (error: Error) => {
      toast.error(`删除失败: ${error.message}`)
    },
  })
}
```

### Toast 提示规范

使用 `sonner` 库，**禁止使用 shadcn/ui 的 useToast**：

```typescript
import { toast } from 'sonner'

// ✅ 正确
toast.success('操作成功')
toast.error('操作失败: ' + error.message)

// ❌ 错误 - 不要使用
import { toast } from '@/hooks/use-toast'
toast({ title: '...', description: '...' })
```

### unwrap 函数说明

`unwrap` 自动处理：
- Eden Treaty 的 `{ data, error, status }` 响应格式
- 401 错误自动跳转登录页
- 错误自动显示 toast 提示
- 返回解析后的 `data`

```typescript
// unwrap 内部逻辑
const result = await unwrap(api.users.get({ query: { page: 1 } }))
// result 直接是 { data: [...], total: 10, page: 1, limit: 20 }
```

---

## 📊 CRUD 页面标准结构

### 页面组件

```typescript
import { useUsersList } from '@/hooks/use-users'
import { getRouteApi } from '@tanstack/react-router'

const route = getRouteApi('/_authenticated/users/')

export function Users() {
  const search = route.useSearch()
  const pageSize = search.pageSize ?? 10
  
  const { data, isLoading, error } = useUsersList({
    page: search.page ?? 1,
    limit: pageSize,
    search: search.filter,
  })

  // 直接从 API 响应获取数据
  const users = data?.data ?? []
  const total = data?.total ?? 0

  return (
    <>
      {isLoading ? <Skeleton /> : error ? <Error /> : (
        <UsersTable data={users} pageCount={Math.ceil(total / pageSize)} />
      )}
    </>
  )
}
```

### 数据表格 (服务端分页)

```typescript
const table = useReactTable({
  data,
  columns,
  pageCount: externalPageCount ?? -1,
  state: { sorting, pagination, ... },
  manualPagination: true,  // 服务端分页
  manualFiltering: true,   // 服务端过滤
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
})
```

---

## 🔐 认证 (Auth Store)

使用扁平结构访问 auth store：

```typescript
import { useAuthStore } from '@/stores/auth-store'

// ✅ 正确 - 扁平结构
const { user, setUser, reset, isAuthenticated } = useAuthStore()

// ❌ 错误 - 不要使用嵌套结构
const { auth } = useAuthStore()
auth.user // 已废弃
```

**可用方法**：
- `user` - 当前用户信息
- `accessToken` - JWT token
- `setUser(user)` - 设置用户
- `setAccessToken(token)` - 设置 token
- `reset()` - 清除认证状态（退出登录）
- `isAuthenticated()` - 检查是否已登录
- `hasPermission(resource, action)` - 检查权限

---

## 🎨 UI 基础设施 (已有组件)

**不要重复造轮子！** 以下组件已经存在：

| 组件 | 位置 | 用途 |
|------|------|------|
| `NavigationProgress` | `components/navigation-progress.tsx` | 顶部路由加载进度条 |
| `Toaster` | `components/ui/sonner` | 全局 Toast 提示 |
| `ConfirmDialog` | `components/confirm-dialog.tsx` | 确认对话框 |
| `SignOutDialog` | `components/sign-out-dialog.tsx` | 退出登录对话框 |
| `ProfileDropdown` | `components/profile-dropdown.tsx` | 头像下拉菜单 |
| `CommandMenu` | `components/command-menu.tsx` | 全局命令面板 (⌘K) |
| `ConfigDrawer` | `components/config-drawer.tsx` | 设置抽屉 |
| `ThemeSwitch` | `components/theme-switch.tsx` | 主题切换 |

**Loading 状态**：
- 路由切换：`NavigationProgress` 自动处理
- API 请求：使用 `isLoading` 状态在组件内显示 Skeleton
- 不需要额外的全局 loading 指示器

---

## 🔍 搜索防抖

```typescript
import { useDebouncedSearch } from '@/hooks/use-debounced-search'

const { inputProps, debouncedValue } = useDebouncedSearch({ delay: 300 })

<Input placeholder="搜索..." {...inputProps} />
```

---

## 📝 表单验证

使用 TypeBox，**禁止 Zod**：

```typescript
import { Type, type Static } from '@sinclair/typebox'
import { typeboxResolver } from '@hookform/resolvers/typebox'

const formSchema = Type.Object({
  nickname: Type.String({ minLength: 1 }),
})

const form = useForm<Static<typeof formSchema>>({
  resolver: typeboxResolver(formSchema),
})
```

---

## ✅ Checklist

- [ ] API 调用使用 `unwrap(api.xxx.get(...))`
- [ ] Mutation 使用 `useMutation` + `queryClient.invalidateQueries`
- [ ] Toast 使用 `sonner`（不是 shadcn useToast）
- [ ] 表格使用 `manualPagination: true`
- [ ] 搜索使用 `useDebouncedSearch`
- [ ] 表单使用 TypeBox（不是 Zod）

---

## 🚫 Admin 权限边界

Admin Console 是管理后台，**不是用户端**：

| 操作 | Admin 权限 |
|------|-----------|
| 查看用户列表/详情 | ✅ 可以 |
| 编辑用户昵称/头像 | ✅ 可以 |
| 删除用户 | ✅ 可以（需确认） |
| 查看活动列表/详情 | ✅ 可以 |
| 更改活动状态 | ✅ 可以（成局/取消） |
| 删除活动 | ✅ 可以（需确认） |
| 创建活动 | ❌ 不可以（用户端功能） |
| 编辑活动内容 | ❌ 不可以（用户端功能） |
| 报名/退出活动 | ❌ 不可以（用户端功能） |
