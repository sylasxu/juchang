---
inclusion: fileMatch
fileMatchPattern: "apps/admin/**/*"
---

# Admin Console 开发规范

## 🌐 API 调用

### 🚨 必须使用 unwrap() 包装所有 API 调用

Eden Treaty 返回 `{ data, error, status }` 格式，**禁止直接访问 response.data**：

```typescript
// ❌ 错误：直接访问 response.data
const response = await api.users.get({ query: filters })
const users = response.data  // 错误！response 是 { data, error, status }

// ✅ 正确：使用 unwrap() 处理响应和错误
import { api, unwrap } from '@/lib/eden'
const users = await unwrap(api.users.get({ query: filters }))
```

### Eden Treaty + unwrap 模式

```typescript
import { api, unwrap } from '@/lib/eden'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

// 列表查询
export function useUsersList(filters: { page?: number; limit?: number; search?: string } = {}) {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: () => unwrap(api.users.get({ query: filters })),
  })
}

// 更新 Mutation
export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => unwrap(api.users({ id }).put(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('用户信息已更新')
    },
    onError: (error: Error) => toast.error(`更新失败: ${error.message}`),
  })
}
```

### Toast 规范

```typescript
import { toast } from 'sonner'  // ✅ 正确

// ❌ 禁止使用 shadcn useToast
import { toast } from '@/hooks/use-toast'
```

---

## 📁 页面架构

### 标准目录结构

```
features/{feature-name}/
├── index.tsx                    # 主页面组件
├── components/
│   ├── {feature}-table.tsx      # 表格组件
│   ├── {feature}-columns.tsx    # 表格列定义
│   ├── {feature}-dialogs.tsx    # 弹窗组件
│   └── {feature}-provider.tsx   # 状态管理
```

### 标准页面模板

```tsx
export function FeaturePage() {
  const { data, isLoading, error } = useFeatureData()

  return (
    <FeatureProvider>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>页面标题</h2>
            <p className='text-muted-foreground'>页面描述</p>
          </div>
          <PrimaryButtons />
        </div>

        {isLoading ? <Skeleton /> : error ? <ErrorState /> : <DataTable data={data} />}
      </Main>

      <FeatureDialogs />
    </FeatureProvider>
  )
}
```

---

## 📊 表格规范

### TanStack Table + 服务端分页

```typescript
const table = useReactTable({
  data,
  columns,
  pageCount,
  state: { pagination, globalFilter },
  manualPagination: true,
  manualFiltering: true,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
})

return (
  <div className='flex flex-1 flex-col gap-4'>
    <DataTableToolbar table={table} searchPlaceholder='搜索...' />
    <div className='overflow-hidden rounded-md border'>
      <Table>{/* 内容 */}</Table>
    </div>
    <DataTablePagination table={table} className='mt-auto' />
  </div>
)
```

### 表格列设计原则

| 原则 | 说明 |
|------|------|
| 单一职责 | 每列只展示一个字段 |
| 列名明确 | 使用具体字段名，禁止"XX信息" |
| 简洁展示 | 文本、Badge，禁止多行 |
| 详情页优先 | 头像、关联数据放详情页 |

**禁止放在表格列**：Avatar、flex-col 多行堆叠、多个 Badge 堆叠

---

## 🔐 认证 (Auth Store)

```typescript
import { useAuthStore } from '@/stores/auth-store'

// ✅ 扁平结构
const { user, setUser, reset, isAuthenticated } = useAuthStore()

// ❌ 禁止嵌套结构
const { auth } = useAuthStore()
```

---

## 🚫 Schema 派生规则 (Single Source of Truth)

**DB 表对应的 Schema 必须从 `@juchang/db` 派生，禁止手动重复定义：**

```typescript
// ❌ 禁止手动定义 DB 表 Schema
export const userSchema = Type.Object({
  id: Type.String(),
  nickname: Type.String(),
  // ...
})

// ✅ 必须从 DB 派生
import { selectUserSchema, type User } from '@juchang/db'
export const userSchema = selectUserSchema
export type { User }

// ✅ 需要扩展时用 Intersect
import { selectActivitySchema } from '@juchang/db'
export const adminActivitySchema = Type.Intersect([
  selectActivitySchema,
  Type.Object({
    creatorInfo: Type.Optional(Type.Object({ ... })),  // API join 返回的额外字段
  }),
])
```

**表单验证 Schema 也必须从 DB 派生：**

```typescript
// ❌ 禁止手动定义表单字段
const formSchema = Type.Object({
  nickname: Type.String({ minLength: 1, maxLength: 50 }),
})

// ✅ 从 DB 派生，Pick 需要的字段
import { insertUserSchema } from '@juchang/db'
const formSchema = Type.Pick(insertUserSchema, ['nickname', 'avatarUrl'])
```

**允许手动定义的 Schema：**
- 分页参数 (`PaginationQuerySchema`)
- 错误响应 (`ErrorResponseSchema`)
- Admin 特有的辅助类型（无对应 DB 表）
- 登录表单（phone + code，非 DB 字段）

---

## 📝 表单验证

```typescript
import { Type, type Static } from '@sinclair/typebox'
import { typeboxResolver } from '@hookform/resolvers/typebox'

const formSchema = Type.Object({
  nickname: Type.String({ minLength: 1 }),
})

const form = useForm<Static<typeof formSchema>>({
  resolver: typeboxResolver(formSchema),  // ✅ TypeBox
  // resolver: zodResolver(schema),       // ❌ 禁止 Zod
})
```

---

## ✅ Checklist

- [ ] API 调用使用 `unwrap(api.xxx.get(...))`
- [ ] Toast 使用 `sonner`
- [ ] 表格使用 TanStack Table + `manualPagination: true`
- [ ] 分页使用 `DataTablePagination`
- [ ] 搜索使用 `DataTableToolbar`
- [ ] 表单使用 TypeBox（禁止 Zod）
- [ ] Header 使用 `fixed` 属性
- [ ] 弹窗抽取为独立组件
