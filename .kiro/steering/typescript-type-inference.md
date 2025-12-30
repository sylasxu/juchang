# TypeScript 类型推导准则

本文档定义了 JuChang 项目三端（API、Admin、MiniProgram）的 TypeScript 类型推导最佳实践。

---

## 🎯 核心原则

**最大化利用 TypeScript 自动类型推导**，消除不必要的 `as` 类型断言。

---

## ✅ 推荐模式

### 1. 使用类型守卫替代断言

```typescript
// ❌ 错误：使用断言
const statusList = status.split(',').filter(Boolean) as Array<'draft' | 'active'>;

// ✅ 正确：使用类型守卫
const ACTIVITY_STATUSES = ['draft', 'active', 'completed', 'cancelled'] as const;
type ActivityStatus = typeof ACTIVITY_STATUSES[number];

function isActivityStatus(value: string): value is ActivityStatus {
  return ACTIVITY_STATUSES.includes(value as ActivityStatus);
}

const statusList = status.split(',').filter(Boolean).filter(isActivityStatus);
```

### 2. 使用解构排除敏感字段

```typescript
// ❌ 错误：使用断言
return user as UserResponse;

// ✅ 正确：解构后自动推导
const { wxOpenId, ...rest } = user;
return rest;  // TypeScript 自动推导类型
```

### 3. 小程序 Page 泛型

```typescript
// ❌ 错误：使用断言初始化数组
Page({
  data: {
    notifications: [] as SystemNotification[],
  },
})

// ✅ 正确：使用 Page 泛型
interface MessagePageData {
  notifications: SystemNotification[];
}

Page<MessagePageData, WechatMiniprogram.Page.CustomOption>({
  data: {
    notifications: [],  // 类型从 MessagePageData 推导
  },
})
```

**注意**：为避免全局命名冲突，使用具体的接口名（如 `MessagePageData`、`SearchPageData`）而非通用的 `PageData`。

### 4. 小程序 Storage 读取

```typescript
// ❌ 错误：使用断言
const token = wx.getStorageSync('token') as string;

// ✅ 正确：使用默认值
const token = wx.getStorageSync('token') || '';
```

### 5. 小程序事件处理

```typescript
// ❌ 错误：断言 detail.value
const value = e.detail.value as string;

// ✅ 正确：直接使用（WechatMiniprogram.Input 的 detail.value 已是 string）
const value = e.detail.value;
```

### 6. TanStack Router Search Params

```typescript
// ❌ 错误：断言 search 参数
const pageSize = (search as Record<string, unknown>).pageSize as number ?? 10;

// ✅ 正确：使用 validateSearch 后的类型推导
const search = route.useSearch();
const pageSize = search.pageSize ?? 10;  // 类型从 validateSearch 推导
```

---

## ⚠️ 可接受的断言

以下场景的断言是合理的：

### 1. `as const` - 字面量类型

```typescript
// ✅ 这是最佳实践
const ACTIVITY_STATUSES = ['draft', 'active', 'completed', 'cancelled'] as const;
```

### 2. API 响应状态检查后

```typescript
// ✅ Orval 生成的联合类型，状态检查后需要断言
if (response.status === 200) {
  const result = response.data as AuthLoginResponse;
}
```

### 3. Drizzle execute() 返回值

```typescript
// ✅ Drizzle 的 execute() 返回 unknown，这是外部库限制
const results = await db.execute(query) as ExploreResult[];
```

### 4. Eden Treaty 枚举类型

```typescript
// ✅ Eden Treaty 返回 string，本地类型期望字面量联合
type: item.type as Activity['type'],
status: item.status as Activity['status'],
```

---

## 🚫 禁止模式

### 1. `as unknown as T` 双重断言

```typescript
// ❌ 禁止：重构代码以启用正确的类型流
const data = response as unknown as MyType;
```

### 2. 手动断言已知类型

```typescript
// ❌ 禁止：Input 事件的 detail.value 已是 string
const value = e.detail.value as string;
```

### 3. 断言替代类型守卫

```typescript
// ❌ 禁止：应使用类型守卫
const statusList = values as Array<'draft' | 'active'>;
```

---

## 📁 API Service 类型守卫示例

`apps/api/src/modules/activities/activity.service.ts`:

```typescript
/** 活动状态枚举值 */
const ACTIVITY_STATUSES = ['draft', 'active', 'completed', 'cancelled'] as const;
type ActivityStatus = typeof ACTIVITY_STATUSES[number];

/** 类型守卫：检查是否为有效的活动状态 */
export function isActivityStatus(value: string): value is ActivityStatus {
  return ACTIVITY_STATUSES.includes(value as ActivityStatus);
}

/** 过滤并返回有效的活动状态数组 */
function filterActivityStatuses(values: string[]): ActivityStatus[] {
  return values.filter(isActivityStatus);
}

// 使用
const statusList = filterActivityStatuses(status.split(',').filter(Boolean));
```

---

## ✅ Checklist

- [ ] 使用类型守卫替代枚举断言
- [ ] 使用解构排除敏感字段
- [ ] 小程序 Page 使用泛型（具体命名的 PageData 接口）
- [ ] Storage 读取使用默认值
- [ ] 事件处理不断言已知类型
- [ ] TanStack Router 使用 validateSearch 类型推导
- [ ] `as const` 用于字面量类型（推荐）
- [ ] 外部库限制的断言添加注释说明
