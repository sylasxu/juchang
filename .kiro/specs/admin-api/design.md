# Design Document: Admin API

## Overview

本设计文档定义了 JuChang Admin 后台所需的 API 端点实现方案。遵循项目的 Spec-First 原则，在现有 API 模块中扩展 Admin 所需的端点，保持领域分离。

## Architecture

### 设计原则

1. **领域分离**: 在各自的模块中添加 Admin 端点，而非创建独立的 admin 模块
2. **Schema 派生**: 所有响应类型从 `@juchang/db` 的 TypeBox Schema 派生
3. **无认证**: MVP 阶段 Admin API 暂不添加认证（后续迭代）

### 端点规划

```
/users
├── GET /users              # Admin: 用户列表
├── GET /users/:id          # Admin: 用户详情
├── PUT /users/:id          # Admin: 更新用户
└── GET /users/me           # 小程序: 当前用户 (已有)

/activities
├── GET /activities         # Admin: 活动列表
├── GET /activities/:id     # 共用: 活动详情 (已有)
└── GET /activities/mine    # 小程序: 我的活动 (已有)

/dashboard
├── GET /dashboard/stats    # Admin: 统计数据 (增强)
└── GET /dashboard/activities # Admin: 最近活动 (已有)
```

## Components and Interfaces

### User Module 扩展

#### GET /users - 用户列表

```typescript
// Query Parameters
interface UserListQuery {
  page?: number      // 默认 1
  limit?: number     // 默认 20, 最大 100
  search?: string    // 搜索昵称或手机号
}

// Response (从 selectUserSchema 派生，排除 wxOpenId)
interface UserListResponse {
  data: Array<Omit<User, 'wxOpenId'>>
  total: number
  page: number
  limit: number
}
```

#### GET /users/:id - 用户详情

```typescript
// Response (从 selectUserSchema 派生，排除 wxOpenId)
type UserDetailResponse = Omit<User, 'wxOpenId'>
```

#### PUT /users/:id - 更新用户

```typescript
// Request Body
interface UpdateUserRequest {
  nickname?: string
  avatarUrl?: string
}

// Response
type UpdateUserResponse = Omit<User, 'wxOpenId'>
```

### Activity Module 扩展

#### GET /activities - 活动列表

```typescript
// Query Parameters
interface ActivityListQuery {
  page?: number      // 默认 1
  limit?: number     // 默认 20, 最大 100
  search?: string    // 搜索标题或地点
  status?: 'active' | 'completed' | 'cancelled'
  type?: string      // 活动类型
}

// Response (从 selectActivitySchema 派生，添加 creator 信息)
interface ActivityListResponse {
  data: Array<Activity & {
    creator: {
      id: string
      nickname: string | null
      avatarUrl: string | null
    }
  }>
  total: number
  page: number
  limit: number
}
```

### Dashboard Module 增强

#### GET /dashboard/stats - 统计数据（增强）

```typescript
// 现有字段
interface DashboardStats {
  totalUsers: number
  totalActivities: number
  activeActivities: number
  todayNewUsers: number
}

// 新增字段
interface EnhancedDashboardStats extends DashboardStats {
  activeUsers: number           // 今日活跃用户
  userGrowthRate: number        // 用户增长率 (%)
  activeUserGrowthRate: number  // 活跃用户增长率 (%)
  activityGrowthRate: number    // 活动增长率 (%)
}
```

## Data Models

### TypeBox Schema 定义

```typescript
// user.model.ts 新增
import { selectUserSchema } from '@juchang/db'
import { t } from 'elysia'

// Admin 用户响应 (排除敏感字段)
const AdminUserSchema = t.Omit(selectUserSchema, ['wxOpenId'])

// 用户列表查询参数
const UserListQuerySchema = t.Object({
  page: t.Optional(t.Number({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 20 })),
  search: t.Optional(t.String()),
})

// 用户列表响应
const UserListResponseSchema = t.Object({
  data: t.Array(AdminUserSchema),
  total: t.Number(),
  page: t.Number(),
  limit: t.Number(),
})

// activity.model.ts 新增
import { selectActivitySchema } from '@juchang/db'

// 活动列表查询参数
const ActivityListQuerySchema = t.Object({
  page: t.Optional(t.Number({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 20 })),
  search: t.Optional(t.String()),
  status: t.Optional(t.Union([
    t.Literal('active'),
    t.Literal('completed'),
    t.Literal('cancelled'),
  ])),
  type: t.Optional(t.String()),
})

// 活动列表响应
const ActivityListResponseSchema = t.Object({
  data: t.Array(t.Intersect([
    selectActivitySchema,
    t.Object({
      creator: t.Object({
        id: t.String(),
        nickname: t.Union([t.String(), t.Null()]),
        avatarUrl: t.Union([t.String(), t.Null()]),
      }),
    }),
  ])),
  total: t.Number(),
  page: t.Number(),
  limit: t.Number(),
})
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: 用户列表分页正确性

*For any* valid pagination parameters (page, limit), the User_Module SHALL return at most `limit` users, and the response SHALL include correct total count.

**Validates: Requirements 1.1, 1.2, 1.5**

### Property 2: 用户搜索过滤正确性

*For any* search query string, all returned users SHALL have nickname or phoneNumber containing the search string (case-insensitive).

**Validates: Requirements 1.3**

### Property 3: 敏感字段排除

*For any* user API response (list or detail), the response SHALL NOT contain the wxOpenId field.

**Validates: Requirements 1.4, 2.3**

### Property 4: 用户更新字段限制

*For any* user update request, only nickname and avatarUrl fields SHALL be updated; other fields SHALL remain unchanged.

**Validates: Requirements 3.1, 3.3**

### Property 5: 活动列表分页正确性

*For any* valid pagination parameters (page, limit), the Activity_Module SHALL return at most `limit` activities, and the response SHALL include correct total count.

**Validates: Requirements 4.1, 4.2, 4.7**

### Property 6: 活动状态过滤正确性

*For any* status filter value, all returned activities SHALL have the specified status.

**Validates: Requirements 4.4**

### Property 7: 活动类型过滤正确性

*For any* type filter value, all returned activities SHALL have the specified type.

**Validates: Requirements 4.5**

### Property 8: 活动创建者信息完整性

*For any* activity in the list response, the activity SHALL include creator object with id, nickname, and avatarUrl fields.

**Validates: Requirements 4.6**

## Error Handling

| 场景 | HTTP Status | Error Code | Message |
|-----|-------------|------------|---------|
| 用户不存在 | 404 | 404 | 用户不存在 |
| 活动不存在 | 404 | 404 | 活动不存在 |
| 参数验证失败 | 400 | 400 | 参数错误 |
| 服务器错误 | 500 | 500 | 服务器内部错误 |

## Testing Strategy

### 单元测试

- 测试 service 层的纯函数逻辑
- 测试分页计算逻辑
- 测试搜索过滤逻辑

### 属性测试

使用 `fast-check` 进行属性测试：

1. **分页属性测试**: 生成随机 page/limit 参数，验证返回数据量不超过 limit
2. **搜索属性测试**: 生成随机搜索字符串，验证所有结果匹配搜索条件
3. **敏感字段测试**: 验证所有响应不包含 wxOpenId

### 集成测试

- 测试完整的 API 请求/响应流程
- 测试 Eden Treaty 类型推导正确性

