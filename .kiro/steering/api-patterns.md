---
inclusion: fileMatch
fileMatchPattern: "apps/api/**/*.ts"
---

# API 层设计规范

本文档定义了 JuChang API 层的设计模式和最佳实践。

---

## 🎯 核心原则

### 0. API 是领域模型的表达，不是前端的附庸

```
✅ 正确思维：API 表达业务领域的能力
   → "用户模块能做什么？" → 查询、更新、统计
   → "活动模块能做什么？" → 创建、报名、搜索
   → API 设计完成后，任何客户端都能用

❌ 错误思维：API 是前端的数据接口
   → "首页需要什么数据？" → 创建 /home/data
   → "Admin 需要什么？" → 创建 /admin/xxx
   → API 变成前端的附庸，换个前端就要改 API
```

**核心检验**：如果明天换一个全新的前端框架，API 需要改吗？
- 需要改 → 设计有问题
- 不需要改 → 设计正确

### 1. 功能领域划分（非页面/客户端划分）

```
✅ 正确：按功能领域组织模块
   - auth/     → 认证授权
   - users/    → 用户管理
   - activities/ → 活动管理
   - chat/     → 群聊消息
   - ai/       → AI 能力 + 对话历史

❌ 错误：按页面组织模块
   - home/     → 首页数据（页面导向）
   - profile/  → 个人中心数据（页面导向）

❌ 错误：按客户端组织模块
   - admin/    → Admin 专用接口
   - miniprogram/ → 小程序专用接口
```

**判断标准**：问自己"这个数据的本质是什么？"而非"这个数据在哪里显示？"

**Admin 接口的正确做法**：
```typescript
// ❌ 错误：创建 admin 模块
GET /admin/users          // Admin 专用
GET /admin/activities     // Admin 专用

// ✅ 正确：在对应模块添加能力
GET /users                // 支持分页、搜索、筛选
GET /activities           // 支持分页、状态筛选
// Admin 和小程序都用同一套 API，通过权限控制访问范围
```

### 2. API 能力的完备性

每个模块应该提供完备的领域能力，而非针对特定场景的定制接口：

```typescript
// ✅ 正确：提供完备的查询能力
GET /activities?status=draft,active&creatorId=xxx&limit=10
// 任何客户端都能用：小程序查"我的草稿"，Admin 查"所有草稿"

// ❌ 错误：针对场景定制
GET /activities/my-drafts     // 小程序专用
GET /activities/admin-list    // Admin 专用
```

### 3. 数据聚合策略

当前端需要聚合多个领域的数据时：

```
方案 A（推荐）：前端并行请求
  → 小程序 Promise.all([getUser(), getActivities(), getConversations()])
  → 各模块职责清晰，易于缓存，API 保持纯粹

方案 B（特殊场景）：扩展现有端点的 include 参数
  → 在最相关的模块添加可选聚合
  → 例如：GET /users/me?include=stats,quota
  → 注意：聚合的数据必须属于同一领域或强关联

方案 C（禁止）：创建聚合专用模块
  → ❌ 不创建 /home、/dashboard、/aggregate 等模块
  → 这些是前端关心的，不是领域模型的一部分
```

### 4. 显式参数设计（避免隐式行为）

API 行为必须通过显式参数控制，而非隐式条件判断：

```typescript
// ❌ 错误：隐式行为（根据参数有无产生不同行为）
GET /notifications          // 无 JWT 返回所有，有 JWT 返回当前用户的
GET /ai/conversations       // 无 JWT 返回所有，有 JWT 返回当前用户的

// ✅ 正确：显式参数
GET /notifications?scope=mine    // 明确查自己的（默认）
GET /notifications?scope=all     // 明确查所有（需 Admin 权限）
GET /notifications?userId=xxx    // 明确查指定用户（需 Admin 权限）
```

**为什么隐式行为是错误的**：
1. **安全隐患**：忘记传参数可能意外暴露所有数据
2. **行为不可预测**：同一端点根据条件产生完全不同的行为
3. **权限模糊**：很难区分"用户查自己的"和"Admin 查所有的"
4. **调试困难**：问题难以复现和定位

**正确的 Admin 模式设计**：
```typescript
// 通过显式 scope 参数区分模式
interface ListQuery {
  scope?: 'mine' | 'all';  // mine=当前用户, all=所有用户(需Admin权限)
  userId?: string;         // Admin 可指定查看某用户的数据
  // ... 其他筛选参数
}

// Controller 中的处理逻辑
const { scope = 'mine', userId } = query;

// 如果指定了 userId，Admin 查指定用户
if (userId) {
  // TODO: 验证 Admin 权限
  return await getByUserId(userId, query);
}

// scope=all：Admin 查所有
if (scope === 'all') {
  // TODO: 验证 Admin 权限
  return await getAll(query);
}

// scope=mine（默认）：查当前用户
return await getByCurrentUser(user.id, query);
```

---

## 📁 模块职责边界

### auth 模块
- 微信登录、手机号绑定
- Token 签发和验证
- **不包含**：用户资料管理

### users 模块
- 用户 CRUD
- 用户额度查询
- 用户统计数据
- **扩展点**：`GET /users/me` 可返回当前用户的聚合数据

### activities 模块
- 活动 CRUD
- 报名/退出
- 附近搜索
- 我的活动列表
- **不包含**：活动群聊消息

### chat 模块
- 活动群聊消息（activity_messages 表）
- **不包含**：AI 对话历史

### ai 模块
- AI 解析（意图分类 + 流式响应）
- AI 对话历史（conversations 表）
- AI 额度管理
- **扩展点**：可添加 AI 相关的上下文数据

---

## 🔄 个性化数据设计

### 用户上下文数据

用户进入首页时需要的个性化数据，应从现有模块获取：

```typescript
// 前端聚合方案（推荐）
const [user, myActivities, conversations] = await Promise.all([
  api.users.me.get(),           // 用户信息 + 额度
  api.activities.mine.get(),    // 我的活动（含草稿）
  api.ai.conversations.get(),   // 对话历史
]);

// 计算个性化内容
const pendingDrafts = myActivities.filter(a => a.status === 'draft');
const upcomingActivities = myActivities.filter(a => 
  a.status === 'active' && new Date(a.startAt) > new Date()
);
```

### 扩展 /users/me 端点（可选）

如果前端聚合成本过高，可扩展 `/users/me`：

```typescript
// GET /users/me?include=stats,drafts,upcoming
{
  // 基础用户信息
  id, nickname, avatarUrl, phoneNumber,
  
  // 额度信息
  aiCreateQuotaToday,
  
  // 统计信息（include=stats）
  stats: {
    activitiesCreatedCount,
    participationCount,
  },
  
  // 待发布草稿（include=drafts）
  pendingDrafts: Activity[],
  
  // 即将开始的活动（include=upcoming）
  upcomingActivities: Activity[],
}
```

---

## 📐 Controller 模式

### 文件结构

```
modules/
└── {module}/
    ├── {module}.controller.ts  # Elysia 路由定义
    ├── {module}.service.ts     # 纯函数业务逻辑
    └── {module}.model.ts       # TypeBox Schema
```

### Controller 规范

```typescript
// ✅ 正确：使用 basePlugins 和 model
export const userController = new Elysia({ prefix: '/users' })
  .use(basePlugins)
  .use(userModel)
  .get('/', handler, { detail, query, response })

// ✅ 正确：错误处理返回 ErrorResponse
if (!user) {
  set.status = 404;
  return { code: 404, msg: '用户不存在' } satisfies ErrorResponse;
}

// ❌ 错误：直接 throw
throw new Error('用户不存在');
```

### Service 规范

```typescript
// ✅ 正确：纯函数，无副作用
export async function getUserById(id: string) {
  return await db.query.users.findFirst({ where: eq(users.id, id) });
}

// ❌ 错误：使用 class
export class UserService {
  async getUserById(id: string) { ... }
}
```

---

## 📊 Schema 派生规则

### 从 DB 派生（必须）

```typescript
import { selectUserSchema, insertUserSchema } from '@juchang/db';

// 选择字段
const UserResponseSchema = t.Pick(selectUserSchema, ['id', 'nickname', 'avatarUrl']);

// 排除敏感字段
const PublicUserSchema = t.Omit(selectUserSchema, ['wxOpenId', 'phoneNumber']);

// 扩展字段
const UserWithStatsSchema = t.Intersect([
  t.Pick(selectUserSchema, ['id', 'nickname']),
  t.Object({ activityCount: t.Number() }),
]);
```

### 禁止手动定义

```typescript
// ❌ 禁止：手动定义与 DB 表对应的 Schema
const UserSchema = t.Object({
  id: t.String(),
  nickname: t.String(),
});
```

---

## 🔐 认证模式

### 公开端点（无需 JWT）

```typescript
// 浏览类接口
GET /activities/:id      // 活动详情
GET /activities/nearby   // 附近活动
GET /ai/conversations    // 对话历史（无 JWT 时返回空）
```

### 需要认证的端点

```typescript
// 写入类接口
POST /activities         // 创建活动
POST /activities/:id/join // 报名
POST /ai/chat            // AI 对话（消耗额度）
```

### 认证检查模式

```typescript
const user = await verifyAuth(jwt, headers);
if (!user) {
  set.status = 401;
  return { code: 401, msg: '未授权' } satisfies ErrorResponse;
}
```

---

## 📝 API 文档规范

### detail 字段

```typescript
{
  detail: {
    tags: ['Users'],           // 模块分组
    summary: '获取用户详情',    // 简短描述
    description: '详细说明...',  // 完整说明
  },
}
```

### response 字段

```typescript
{
  response: {
    200: UserResponseSchema,   // 成功响应
    400: 'user.error',         // 业务错误
    401: 'user.error',         // 未授权
    404: 'user.error',         // 未找到
    500: 'user.error',         // 服务器错误
  },
}
```

---

## ✅ Checklist

新增 API 端点时检查：

**设计原则**
- [ ] 这个端点表达的是领域能力，不是前端需求
- [ ] 换一个前端框架，这个 API 不需要改
- [ ] 端点归属正确的功能模块（非页面/客户端模块）
- [ ] 查询参数足够通用，支持多种使用场景
- [ ] 使用显式参数控制行为，避免隐式条件判断

**技术规范**
- [ ] Schema 从 `@juchang/db` 派生
- [ ] Service 是纯函数
- [ ] 错误返回 `ErrorResponse` 格式
- [ ] 需要认证的端点使用 `verifyAuth`
- [ ] 添加完整的 `detail` 文档
- [ ] 定义所有可能的 `response` 状态码


---

## 🤖 AI Tools 规范

### 核心原则

**AI Tools 必须使用 TypeBox，禁止使用 Zod。**

根据 [AI SDK 文档](https://ai-sdk.dev/docs/reference/ai-sdk-core/json-schema)，`jsonSchema()` 是 Zod 的替代方案，支持任意 JSON Schema。

### 标准模式

```typescript
import { t } from 'elysia';
import { tool, jsonSchema } from 'ai';
import { toJsonSchema } from '@juchang/utils';

// 1. TypeBox Schema（description 用于 AI 理解参数）
const myToolSchema = t.Object({
  title: t.String({ description: '活动标题' }),
  type: t.Union([
    t.Literal('food'),
    t.Literal('entertainment'),
  ], { description: '活动类型' }),
});

// 2. 类型自动推导
type MyToolParams = typeof myToolSchema.static;

// 3. Tool 定义
export function myTool(userId: string | null) {
  return tool({
    description: '工具描述',
    parameters: jsonSchema<MyToolParams>(toJsonSchema(myToolSchema)),
    execute: async (params) => { ... },
  });
}
```

### 文件结构

```
modules/ai/
├── tools/
│   ├── index.ts           # 导出所有 Tools
│   ├── create-draft.ts    # 创建草稿
│   ├── refine-draft.ts    # 修改草稿
│   ├── explore-nearby.ts  # 探索附近
│   └── publish-activity.ts # 发布活动
├── prompts/
│   └── xiaoju-v34.ts      # System Prompt
└── ai.service.ts          # AI 服务
```

### Checklist

- [ ] 使用 TypeBox `t.Object()` 定义 Schema
- [ ] 使用 `jsonSchema<T>(toJsonSchema(schema))` 传递给 AI SDK
- [ ] 类型使用 `typeof schema.static` 自动推导
- [ ] 每个字段包含 `description` 属性
- [ ] 禁止 `import { z } from 'zod'`


---

## 📅 SQL 日期参数规范

### 问题背景

Drizzle 的 `sql` 模板字符串直接传递 JavaScript Date 对象时，会使用 `toString()` 方法转换，生成类似 `Fri Dec 26 2025 00:00:00 GMT+0800` 的格式，PostgreSQL 无法解析。

### 解决方案

使用 `@juchang/db` 提供的 `toTimestamp` 工具函数：

```typescript
import { db, sql, toTimestamp } from '@juchang/db';

// ❌ 错误：直接传递 Date 对象
const result = await db.execute(sql`
  SELECT * FROM table WHERE created_at >= ${startDate}
`);

// ✅ 正确：使用 toTimestamp
const result = await db.execute(sql`
  SELECT * FROM table WHERE created_at >= ${toTimestamp(startDate)}
`);
```

### 可用工具函数

| 函数 | 用途 | PostgreSQL 类型 |
|------|------|----------------|
| `toTimestamp(date)` | 完整时间戳 | `timestamptz` |
| `toDateOnly(date)` | 仅日期（无时间） | `date` |

### Checklist

- [ ] 原生 SQL 查询中的 Date 参数使用 `toTimestamp()` 或 `toDateOnly()`
- [ ] 禁止在 `sql` 模板中直接传递 Date 对象
