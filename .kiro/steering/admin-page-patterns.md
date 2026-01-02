# Admin 页面开发规范

本文档定义了 JuChang Admin 后台所有页面的统一开发规范，以 `users` 页面为标准参考。

---

## 🎯 核心原则

**所有 Admin 页面必须遵循统一的架构模式和 UI 规范**，确保代码一致性和用户体验统一。

---

## 📁 页面架构模式

### 标准目录结构

```
apps/admin/src/features/{feature-name}/
├── index.tsx                    # 主页面组件
├── components/                  # 页面专属组件
│   ├── {feature}-table.tsx      # 表格组件（使用 TanStack Table）
│   ├── {feature}-columns.tsx    # 表格列定义
│   ├── {feature}-dialogs.tsx    # 弹窗组件
│   ├── {feature}-provider.tsx   # 状态管理 Provider
│   └── {feature}-primary-buttons.tsx  # 主操作按钮
└── data/
    ├── data.ts                  # 静态数据（枚举映射等）
    └── schema.ts                # TypeScript 类型定义
```

### 简单页面结构（无复杂表格）

```
apps/admin/src/features/{feature-name}/
├── index.tsx                    # 主页面组件（包含所有逻辑）
```

---

## 🏗️ 页面组件结构

### ✅ 标准页面模板（参考 users/index.tsx）

```tsx
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Skeleton } from '@/components/ui/skeleton'

export function FeaturePage() {
  // 数据获取
  const { data, isLoading, error } = useFeatureData()

  return (
    <FeatureProvider>
      {/* Header: 固定布局 */}
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      {/* Main: 标准间距 */}
      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        {/* 页面标题区 */}
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>页面标题</h2>
            <p className='text-muted-foreground'>
              页面描述文字
            </p>
          </div>
          <PrimaryButtons />
        </div>

        {/* 内容区：统一的加载/错误/数据状态 */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : error ? (
          <ErrorState error={error} />
        ) : (
          <DataTable data={data} />
        )}
      </Main>

      <FeatureDialogs />
    </FeatureProvider>
  )
}
```

---

## 📊 表格规范

### ✅ 正确：使用 TanStack Table + DataTable 组件

```tsx
// features/{feature}/components/{feature}-table.tsx
import {
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useTableUrlState } from '@/hooks/use-table-url-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTablePagination, DataTableToolbar } from '@/components/data-table'

export function FeatureTable({ data, pageCount }: Props) {
  const {
    globalFilter,
    onGlobalFilterChange,
    pagination,
    onPaginationChange,
  } = useTableUrlState({
    search: route.useSearch(),
    navigate: route.useNavigate(),
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    globalFilter: { enabled: true, key: 'filter' },
  })

  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: { pagination, globalFilter },
    manualPagination: true,
    manualFiltering: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onPaginationChange,
    onGlobalFilterChange,
  })

  return (
    <div className='flex flex-1 flex-col gap-4'>
      <DataTableToolbar table={table} searchPlaceholder='搜索...' />
      <div className='overflow-hidden rounded-md border'>
        <Table>
          {/* 表格内容 */}
        </Table>
      </div>
      <DataTablePagination table={table} className='mt-auto' />
    </div>
  )
}
```

### ❌ 错误：自定义简易分页

```tsx
// 不要这样做！
{total > 20 && (
  <div className='flex justify-center gap-2'>
    <Button variant='outline' size='sm' onClick={() => setPage(p => p - 1)}>
      上一页
    </Button>
    <span>第 {page} 页</span>
    <Button variant='outline' size='sm' onClick={() => setPage(p => p + 1)}>
      下一页
    </Button>
  </div>
)}
```

---

## 🎨 Header 规范

### ✅ 标准 Header（带全局搜索）

```tsx
<Header fixed>
  <Search />
  <div className='ms-auto flex items-center space-x-4'>
    <ThemeSwitch />
    <ConfigDrawer />
    <ProfileDropdown />
  </div>
</Header>
```

### ✅ 简化 Header（带页面标题图标）

```tsx
<Header fixed>
  <div className='flex items-center gap-2'>
    <IconComponent className='h-5 w-5' />
    <h1 className='text-lg font-semibold'>页面标题</h1>
  </div>
  <div className='ms-auto flex items-center space-x-4'>
    <ThemeSwitch />
    <ConfigDrawer />
    <ProfileDropdown />
  </div>
</Header>
```

### ❌ 错误：Header 不带 fixed 属性

```tsx
// 不要这样做！
<Header>
  {/* ... */}
</Header>
```

---

## 📐 Main 布局规范

### ✅ 标准 Main 布局

```tsx
<Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
  {/* 内容 */}
</Main>
```

### ❌ 错误：不一致的间距

```tsx
// 不要这样做！
<Main>
  <div className='space-y-4'>
    {/* 内容 */}
  </div>
</Main>
```

---

## 📋 页面标题区规范

### ✅ 标准标题区

```tsx
<div className='flex flex-wrap items-end justify-between gap-2'>
  <div>
    <h2 className='text-2xl font-bold tracking-tight'>页面标题</h2>
    <p className='text-muted-foreground'>
      页面描述文字
    </p>
  </div>
  <PrimaryButtons />
</div>
```

### ❌ 错误：统计卡片放在标题区

```tsx
// 不要这样做！除非是 Dashboard 类页面
<div className='grid gap-4 md:grid-cols-3'>
  <Card>统计卡片 1</Card>
  <Card>统计卡片 2</Card>
  <Card>统计卡片 3</Card>
</div>
```

---

## 🔄 加载状态规范

### ✅ 标准加载骨架

```tsx
{isLoading ? (
  <div className='space-y-4'>
    <Skeleton className='h-10 w-full' />
    <Skeleton className='h-[400px] w-full' />
  </div>
) : (
  <DataContent />
)}
```

### ❌ 错误：内联骨架

```tsx
// 不要这样做！
<Card>
  <CardContent className='p-0'>
    {isLoading ? (
      <div className='space-y-4 p-4'>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className='h-4 w-full' />
        ))}
      </div>
    ) : (
      <Table />
    )}
  </CardContent>
</Card>
```

---

## ⚠️ 错误状态规范

### ✅ 标准错误状态

```tsx
{error ? (
  <div className='text-center py-8 text-muted-foreground'>
    加载失败：{error.message}
  </div>
) : (
  <DataContent />
)}
```

---

## 🔍 搜索和筛选规范

### ✅ 使用 DataTableToolbar

```tsx
<DataTableToolbar
  table={table}
  searchPlaceholder='按昵称、ID或手机号搜索...'
  filters={[
    {
      columnId: 'status',
      title: '状态',
      options: statusOptions,
    },
  ]}
/>
```

### ❌ 错误：自定义筛选栏

```tsx
// 不要这样做！
<div className='flex flex-col gap-4 sm:flex-row'>
  <div className='relative flex-1'>
    <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2' />
    <Input placeholder='搜索...' className='pl-9' />
  </div>
  <Select>
    <SelectTrigger className='w-full sm:w-32'>
      <SelectValue placeholder='状态' />
    </SelectTrigger>
  </Select>
</div>
```

---

## 📄 分页规范

### ✅ 使用 DataTablePagination

```tsx
<DataTablePagination table={table} className='mt-auto' />
```

### ❌ 错误：自定义分页

```tsx
// 不要这样做！
<div className='flex justify-center gap-2'>
  <Button variant='outline' size='sm' disabled={page <= 1}>
    上一页
  </Button>
  <span>第 {page} 页</span>
  <Button variant='outline' size='sm'>
    下一页
  </Button>
</div>
```

---

## 🪟 弹窗规范

### ✅ 使用独立的 Dialogs 组件

```tsx
// features/{feature}/components/{feature}-dialogs.tsx
export function FeatureDialogs() {
  const { open, setOpen, currentItem } = useFeature()

  return (
    <>
      <EditDialog open={open === 'edit'} onOpenChange={() => setOpen(null)} />
      <DeleteDialog open={open === 'delete'} onOpenChange={() => setOpen(null)} />
    </>
  )
}
```

### ❌ 错误：弹窗内联在主页面

```tsx
// 不要这样做！
export function FeaturePage() {
  const [selectedItem, setSelectedItem] = useState(null)

  return (
    <>
      <Main>{/* 内容 */}</Main>
      
      {/* 弹窗不应该内联在这里 */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        {/* ... */}
      </Dialog>
    </>
  )
}
```

---

## 📊 数据获取规范

### ✅ 使用自定义 Hook

```tsx
// hooks/use-{feature}.ts
export function useFeatureList(params: Params) {
  return useQuery({
    queryKey: ['feature', params],
    queryFn: () => unwrap(api.feature.get({ query: params })),
  })
}

// 页面中使用
const { data, isLoading, error } = useFeatureList({ page, limit })
```

### ❌ 错误：在组件内定义 Hook

```tsx
// 不要这样做！
function useFeatureList() {
  return useQuery({
    queryKey: ['feature'],
    queryFn: async () => {
      // ...
    },
  })
}

export function FeaturePage() {
  const { data } = useFeatureList()
  // ...
}
```

---

## 🏷️ 状态管理规范

### ✅ 使用 Provider + Context

```tsx
// features/{feature}/components/{feature}-provider.tsx
const FeatureContext = createContext<FeatureContextType | null>(null)

export function FeatureProvider({ children }: Props) {
  const [open, setOpen] = useState<DialogType | null>(null)
  const [currentItem, setCurrentItem] = useState<Item | null>(null)

  return (
    <FeatureContext.Provider value={{ open, setOpen, currentItem, setCurrentItem }}>
      {children}
    </FeatureContext.Provider>
  )
}

export function useFeature() {
  const context = useContext(FeatureContext)
  if (!context) throw new Error('useFeature must be used within FeatureProvider')
  return context
}
```

### ❌ 错误：使用 useState 管理复杂状态

```tsx
// 不要这样做！
export function FeaturePage() {
  const [selectedItem, setSelectedItem] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [adminNote, setAdminNote] = useState('')
  // 状态过多，应该使用 Provider
}
```

---

## ✅ 页面类型对照表

| 页面类型 | 使用 TanStack Table | 使用 DataTablePagination | 使用 Provider | 示例 |
|---------|---------------------|-------------------------|---------------|------|
| 列表管理页 | ✅ 必须 | ✅ 必须 | ✅ 推荐 | users |
| 审核管理页 | ✅ 必须 | ✅ 必须 | ✅ 推荐 | reports |
| 通知管理页 | ✅ 必须 | ✅ 必须 | ⚪ 可选 | notifications |
| 总览/Dashboard | ❌ 不需要 | ❌ 不需要 | ❌ 不需要 | ai-ops |
| 工具/预览页 | ❌ 不需要 | ❌ 不需要 | ❌ 不需要 | welcome-preview |

---

## 📋 表格列设计规范

### 核心原则

**表格列保持简洁，复杂信息放详情页**。表格是快速浏览和筛选的工具，不是详情展示区。

### ✅ 正确：单一字段，简洁展示

```tsx
// 每列只显示一个核心字段
{
  accessorKey: 'nickname',
  header: '昵称',
  cell: ({ row }) => <span>{row.getValue('nickname') || '匿名'}</span>,
},
{
  accessorKey: 'phoneNumber',
  header: '手机号',
  cell: ({ row }) => <span>{row.getValue('phoneNumber') || '未绑定'}</span>,
},
{
  accessorKey: 'status',
  header: '状态',
  cell: ({ row }) => <Badge>{row.getValue('status')}</Badge>,
},
```

### ❌ 错误识别：多行复杂编排

**以下模式必须重构：**

```tsx
// ❌ 错误 1：列名使用"XX信息"
header: '用户信息'  // 应该拆分为：昵称、手机号、状态等独立列
header: '活动信息'  // 应该拆分为：标题、时间、地点等独立列

// ❌ 错误 2：单元格包含 Avatar
cell: ({ row }) => (
  <div className='flex items-center'>
    <Avatar>...</Avatar>  // 头像放详情页
    <span>{row.original.nickname}</span>
  </div>
)

// ❌ 错误 3：单元格包含 flex-col 多行堆叠
cell: ({ row }) => (
  <div className='flex flex-col'>  // 多行堆叠 = 错误
    <span>{row.original.nickname}</span>
    <span className='text-xs'>{row.original.phoneNumber}</span>
  </div>
)

// ❌ 错误 4：单元格包含多个 Badge 或状态
cell: ({ row }) => (
  <div>
    <span>{row.original.nickname}</span>
    <Badge>已绑定</Badge>  // 应该是独立的"绑定状态"列
    <Badge>VIP</Badge>     // 应该是独立的"会员"列
  </div>
)
```

### 列设计原则

| 原则 | 说明 |
|------|------|
| **单一职责** | 每列只展示一个字段 |
| **列名明确** | 使用具体字段名（昵称、手机号），禁止"XX信息" |
| **简洁展示** | 文本、Badge、简单格式化，禁止多行 |
| **详情页优先** | 头像、关联数据放详情页 |
| **操作列保留** | 使用 DropdownMenu，包含查看/编辑/删除等操作 |

### 推荐的列类型

| 类型 | 展示方式 | 示例 |
|------|---------|------|
| ID | 截断显示 | `{id.slice(0, 8)}...` |
| 文本 | 直接显示或 truncate | 昵称、标题 |
| 枚举 | Badge | 状态、类型 |
| 时间 | 格式化 | `toLocaleDateString('zh-CN')` |
| 布尔 | Badge | 已绑定/未绑定 |
| 数字 | 直接显示 | 创建活动数、参与数 |
| 操作 | DropdownMenu | 查看/编辑/删除 |

### 操作列规范

操作列使用 DropdownMenu，包含常用操作：

```tsx
// ✅ 正确：使用 DropdownMenu
{
  id: 'actions',
  cell: ({ row }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='h-8 w-8 p-0'>
          <DotsHorizontalIcon className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem>查看详情</DropdownMenuItem>
        <DropdownMenuItem>编辑</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className='text-destructive'>删除</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
}
```

### 禁止放在表格列的内容

- ❌ Avatar 头像组件
- ❌ `flex-col` 多行文本堆叠
- ❌ 关联对象的详细信息
- ❌ 长文本内容（超过 truncate 范围）
- ❌ 多个 Badge 状态堆叠
- ❌ 列名使用"XX信息"（如"用户信息"、"活动信息"）

### 详情页应该展示的内容

- ✅ 头像和完整用户资料
- ✅ 关联数据和统计
- ✅ 操作按钮（编辑、删除、状态变更）
- ✅ 历史记录或日志
- ✅ 所有复杂的展示逻辑

### 详情展示方式选择

| 场景 | 展示方式 | 示例 |
|------|---------|------|
| 有独立详情页 | 跳转详情页 | 用户、活动 |
| 无独立详情页 | 弹窗 Dialog | 举报、通知 |
| 简单确认操作 | 弹窗 Dialog | 删除确认 |

**注意：每个实体只有一种详情展示方式，不要同时有详情页和详情弹窗。**

---

## 🚫 常见错误汇总

### 1. 表格样式不一致

❌ 使用 `<Card><CardContent className='p-0'><Table>` 包裹表格
✅ 使用 `<div className='overflow-hidden rounded-md border'><Table>` 包裹表格

### 2. 分页不一致

❌ 自定义简易分页按钮
✅ 使用 `<DataTablePagination table={table} />`

### 3. 搜索栏不一致

❌ 自定义带图标的搜索输入框
✅ 使用 `<DataTableToolbar table={table} searchPlaceholder='...' />`

### 4. Header 不固定

❌ `<Header>` 不带 fixed 属性
✅ `<Header fixed>`

### 5. 弹窗内联

❌ Dialog 组件直接写在主页面
✅ 抽取为独立的 `{feature}-dialogs.tsx` 组件

### 6. 数据获取 Hook 内联

❌ 在组件文件内定义 useQuery Hook
✅ 抽取到 `hooks/use-{feature}.ts`

---

## 📝 重构检查清单

当创建或修改 Admin 页面时，请检查：

- [ ] Header 使用 `fixed` 属性
- [ ] Main 使用 `flex flex-1 flex-col gap-4 sm:gap-6` 类名
- [ ] 列表页使用 TanStack Table
- [ ] 分页使用 DataTablePagination 组件
- [ ] 搜索使用 DataTableToolbar 组件
- [ ] 表格使用 `overflow-hidden rounded-md border` 包裹
- [ ] 弹窗抽取为独立组件
- [ ] 数据获取 Hook 抽取到 hooks 目录
- [ ] 复杂状态使用 Provider 管理
- [ ] 加载状态使用 Skeleton 组件
- [ ] 错误状态有统一的展示方式
