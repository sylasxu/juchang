# Design Document: Admin Console (AI Ops v3.2)

## Overview

本设计文档定义了 JuChang Admin 后台的完整架构。**v3.2 核心理念转变**：从"复刻小程序 UI"转向"透视 AI 数据"。

### 核心定位

**AI 调试与数据中控台 (AI Ops & Data Console)**

- **对于 AI**：它是 X-Ray（X光机），负责透视 AI 的思考过程、意图分类准确率和结构化数据质量
- **对于业务**：它是 CMS，负责管理用户、活动和内容风控

## Architecture

### 技术栈 (Tech Stack)

| 层级 | 技术 | 说明 |
|------|------|------|
| Framework | Vite + React 19 + TypeScript | 现代化构建 |
| UI System | Shadcn/ui + Tailwind CSS | 专业、干净、数据密度高 |
| AI Engine | **Vercel AI SDK (ai/react)** | 核心驱动 |
| Data Fetching | TanStack Query (React Query) | 服务端状态管理 |
| Data Viz | Recharts + react-json-view-lite | 统计图表 + Raw JSON 查看 |
| API Client | Eden Treaty | 类型安全 API 调用 |

### 设计原则

1. **领域分离**: 在各自的模块中添加 Admin 端点，而非创建独立的 admin 模块
2. **Schema 派生**: 所有响应类型从 `@juchang/db` 的 TypeBox Schema 派生
3. **无认证**: MVP 阶段 Admin API 暂不添加认证（后续迭代）
4. **Inspector Pattern**: AI 响应不渲染 UI 卡片，渲染数据探针面板

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

/ai
├── GET /ai/conversations   # Admin: 对话历史列表 (分页)
├── POST /ai/parse          # 共用: AI 解析 (SSE)
└── DELETE /ai/conversations # 小程序: 清空对话 (已有)

/dashboard
├── GET /dashboard/stats    # Admin: 统计数据 (增强)
└── GET /dashboard/activities # Admin: 最近活动 (已有)
```

## Core Modules (AI Ops)

### 1. 调试沙箱 (Playground)

开发阶段使用频率最高的页面，模拟小程序端的对话环境，但以"开发者视角"展示。

**技术实现**：
- 使用 `useChat` hook 连接后端 `/ai/parse`
- 支持配置 System Prompt Override（在不改代码的情况下测试不同的人设）

**渲染逻辑 (The Inspector Pattern)**：
- User Message: 右侧气泡
- AI Message (Text): 左侧 Markdown 渲染
- AI Message (Tool/Widget): **不渲染 UI 卡片，渲染数据探针面板**

**Inspector 组件设计**：

```tsx
// DraftInspector - 当 AI 返回 widget_draft 时的 Admin 显示组件
import { Card, CardContent, Badge } from "@/components/ui"
import { MapPin, Calendar, Users } from "lucide-react"

export function DraftInspector({ data }) {
  return (
    <Card className="border-l-4 border-l-indigo-500 bg-slate-50 my-2">
      <div className="p-3 border-b flex justify-between items-center">
        <span className="font-mono text-xs font-bold text-indigo-600">
          TOOL: CREATE_DRAFT
        </span>
        <Badge variant="outline">Confidence: High</Badge>
      </div>
      <CardContent className="pt-3 text-sm space-y-2">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="font-mono">{data.startAt}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-500" />
            <span>Max: {data.maxParticipants}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white p-2 rounded border">
          <MapPin className="w-4 h-4 text-red-500" />
          <span className="truncate">
            {data.locationName} ({data.lat}, {data.lng})
          </span>
          <a 
            href={`https://map.qq.com/?type=marker&pointx=${data.lng}&pointy=${data.lat}`}
            target="_blank" 
            className="text-blue-600 underline text-xs ml-auto"
          >
            Check Map
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
```

### 2. 对话审计 (Conversation Inspector)

排查线上问题的核心页面。

**数据源**：`home_messages` 表

**功能**：
- 列表页：展示最近的 Session，标注出 "Widget 生成失败" 或 "意图不明" 的对话（红色高亮）
- 详情页：复用 Playground 的渲染逻辑，回放当时的对话流
- **[Fix & Test] 按钮**：点击后，将这组对话上下文导入 Playground，允许开发者修改 System Prompt 后重试

### 3. 评测套件 (Evaluation Suite)

保证 Prompt 修改不回退（Regression）的工具。

**功能**：
- 维护一个"金标准测试集"（Golden Dataset）
- 例如：输入"明晚火锅" -> 期望输出 `widget_draft` + `type=food`
- 点击 "Run All Tests"，前端循环调用 API，比对返回的 JSON 字段，生成红/绿报告

### 4. 业务管理 (CMS)

**Activities**：
- 标准的表格管理
- 状态流转：Draft -> Active -> Completed
- Admin 特权：强制下架违规活动

**Users**：
- 用户列表，封禁/解封

## Components and Interfaces

### Inspector Components (AI Ops)

| 组件 | 用途 | 触发条件 |
|------|------|----------|
| `TextInspector` | 渲染 Markdown 文本 | `type === 'text'` |
| `DraftInspector` | 结构化展示时间/地点/类型（带腾讯地图外链） | `type === 'widget_draft'` |
| `ExploreInspector` | 展示搜索关键词、中心点坐标、结果列表 | `type === 'widget_explore'` |
| `RawJsonInspector` | 折叠/展开显示原始 JSON | 所有类型（调试用） |

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

