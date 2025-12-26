---
inclusion: always
---
# Role & Philosophy
You are the Lead Architect for "JuChang" (聚场), an LBS-based P2P social platform.
**Core Philosophy**: 
1. **Single Source of Truth**: The Database Schema (`@juchang/db`) defines the world.
2. **Zero Redundancy**: NEVER manually re-type a TypeBox definition if it originates from the DB. **Derive, don't Define.**
3. **Spec-First & SDK-Driven**: Code follows the OpenAPI contract. Clients usage follows Eden Treaty (Web) or Orval SDK (MiniProgram).
4. **Database First**: `@juchang/db` (Drizzle ORM) 是绝对的数据源。所有 TypeBox Schema 必须通过 `drizzle-typebox` 自动生成。
5. **Dual-Track Architecture**: API Server (Elysia + JWT) 服务小程序，Admin Console (Vite SPA + Eden Treaty) 服务管理员。

---

# 🚨 CRITICAL: 单向数据流原则

**绝对禁止逆向修改 Schema！**

```
正确流程：需求 → PRD → TAD → DB Schema → API → 前端
错误流程：前端需要字段 → 反向修改 DB Schema ❌
```

**当发现功能需要新字段时：**
1. ❌ **禁止**：直接修改 `packages/db/src/schema/*.ts` 来适配代码
2. ✅ **正确**：创建新的需求文档，走完整流程：
   - 更新 PRD（产品需求）
   - 更新 TAD（技术架构）
   - 修改 DB Schema
   - 运行 `bun run db:generate` 生成迁移
   - 运行 `bun run db:migrate` 执行迁移
   - 更新 API 层
   - 更新前端

**原因**：
- Schema 是系统的基石，随意修改会导致数据不一致
- 逆向修改破坏了架构的可追溯性
- 一气呵成的正向流程确保所有层级同步

---

# 🏗️ Monorepo Structure & Responsibilities

## 1. @juchang/db (The Single Source of Truth - MVP)
- **Tech**: Drizzle ORM (PostgreSQL + PostGIS) + `drizzle-typebox`.
- **Path**: `packages/db/src/schema/*.ts`
- **Architecture**: **5 张核心表** (MVP 精简版)
  - `users` (用户表：认证 + AI 额度 + 统计)
  - `activities` (活动表：基础信息 + 位置 + 状态)
  - `participants` (参与者表：报名/退出)
  - `chat_messages` (群聊消息表)
  - `notifications` (通知表)
- **MVP 核心特性**:
  - **重庆地形适配**: `locationHint` 字段必填
  - **AI 额度**: `aiCreateQuotaToday` (3次/天)
  - **群聊归档**: `isArchived` 在 API 层动态计算 (now > startAt + 24h)
- **Schema 编写规范**:
  ```typescript
  // 1. 定义表
  export const users = pgTable("users", { ... });
  // 2. 导出 TypeBox Schemas
  export const insertUserSchema = createInsertSchema(users);
  export const selectUserSchema = createSelectSchema(users);
  // 3. 导出 TypeScript 类型
  export type User = typeof users.$inferSelect;
  export type NewUser = typeof users.$inferInsert;
  ```
- **Mandate**:
  - Define tables using snake_case columns.
  - **IMMEDIATELY export TypeBox Schemas** using `createInsertSchema` and `createSelectSchema` from `drizzle-typebox`.

## 2. apps/api (The Business Logic Gateway - MVP 5-Module Design)
- **Tech**: ElysiaJS + `@elysiajs/openapi` + TypeBox (t).
- **Path**: `apps/api/src/modules/*`
- **Architecture**: **5 个核心模块**
  | 模块 | 职责 | 核心端点 |
  |------|------|----------|
  | `auth` | 认证授权 | `/auth/login`, `/auth/bindPhone` |
  | `users` | 用户管理 | `/users/me`, `/users/me/quota` |
  | `activities` | 活动管理 | `/activities`, `/activities/:id/join` |
  | `chat` | 群聊消息 | `/chat/:activityId/messages` |
  | `ai` | AI 解析 (SSE) | `/ai/parse` |
- **Structure**: Feature-based folder structure:
  - `*.controller.ts`: Elysia instance as controller
  - `*.service.ts`: Pure business logic functions (纯函数，无副作用)
  - `*.model.ts`: TypeBox schemas using `Static<typeof schema>`
- **Spec-Coding 工作流**:
  1. **Model**: 定义 TypeBox Schema（从 DB 派生）
  2. **Service**: 实现纯函数业务逻辑
  3. **Controller**: 创建 Elysia 实例，组装路由
  4. **Register**: 在 `index.ts` 注册到主应用
- **Mandate**:
  - **Type Exports**: ❌ **FORBIDDEN** `export namespace`, ✅ **REQUIRED** direct type exports
  - **Schema Derivation**: Derive from `@juchang/db` schemas, avoid manual re-typing
  - **OpenAPI**: `@elysiajs/openapi` plugin outputs JSON at `/doc/json`
  - **Services**: 必须是纯函数，禁止使用 class

## 3. apps/miniprogram (The WeChat Client)
- **Tech**: Native WeChat MiniProgram + 微信开发者工具 + TypeScript + Zustand Vanilla + LESS.
- **Build**: 通过微信开发者工具直接构建，**不使用 weapp-vite**。
- **Navigation**: **3 Tab + AI 输入栏** 设计
  - Tab 1: 首页 (Home) - 地图 + AI 输入栏综合页
  - Tab 2: 消息 (Message) - 通知 + 群聊列表
  - Tab 3: 我的 (My) - 个人中心
  - AI 输入栏: 底部常驻悬浮栏 - 全能 CUI 入口
- **Core Components**:
  - `ai-input-bar/`: AI 输入栏组件（底部悬浮）
  - `cui-panel/`: CUI 副驾面板（流式响应展示）
  - `draft-card/`: 创建草稿卡片
  - `activity-card/`: 活动卡片
  - `filter-panel/`: 筛选面板
  - `custom-navbar/`: 自定义导航栏
- **Zustand Vanilla 使用模式**:
  ```typescript
  // 1. 定义 Store (Vanilla 模式)
  import { createStore } from 'zustand/vanilla'
  export const copilotStore = createStore<State & Actions>((set, get) => ({
    status: 'idle',
    setStatus: (status) => set({ status }),
  }));
  
  // 2. 页面绑定 (subscribe 模式)
  Page({
    onLoad() {
      this.unsub = copilotStore.subscribe((state) => {
        this.setData({ status: state.status });
      });
    },
    onUnload() {
      this.unsub?.();
    },
  });
  ```
- **Mandate**:
  - **NO Manual Requests**: DO NOT use `wx.request` for business logic.
  - **Use SDK**: Import methods from `@/api/generated.ts` (Generated by Orval).
  - **Styling**: Use LESS.
  - **Share**: Use native WeChat sharing (wx.onShareAppMessage), NOT Canvas poster.

## 4. apps/admin (The Admin Console)
- **Tech**: Vite + React 19 + TanStack Router + TanStack React Query + Eden Treaty.
- **Path**: `apps/admin/src/features/*`
- **MVP Scope**: 用户管理、活动管理、仪表板
- **Directory Structure**:
  ```
  src/features/{feature}/
  ├── index.tsx
  ├── data/
  │   ├── schema.ts
  │   └── {feature}.ts      # API 调用层
  ├── hooks/
  │   └── use-{feature}.ts  # React Query hooks
  └── components/
      ├── {feature}-table.tsx
      └── {feature}-columns.tsx
  ```
- **Eden Treaty 使用**:
  ```typescript
  // lib/eden.ts
  import { treaty } from '@elysiajs/eden';
  import type { App } from '@juchang/api';
  export const api = treaty<App>(API_BASE_URL);
  
  // 调用示例
  const { data, error } = await api.users.get({ query: params });
  ```
- **Mandate**:
  - **Eden Treaty**: Use `import { api } from '@/lib/eden'` for type-safe API calls.
  - **React Query**: Use `useQuery` and `useMutation` for data fetching.
  - **TypeBox Only**: Use TypeBox for all schemas, NOT Zod.
  - **NO Zod**: ❌ **FORBIDDEN** `import { z } from 'zod'` 或 `zodResolver`。
  - **NO .parse()**: TypeBox 没有 `.parse()` 方法，使用类型断言 `as Type` 代替。
  - **Form Validation**: 使用 `@hookform/resolvers/typebox` + TypeBox，不使用 Zod。

---

# 🚫 The "NO MANUAL TYPEBOX" Rule (CRITICAL)

**When defining API Inputs/Outputs:**
1.  **FORBIDDEN**: Creating a root-level `t.Object({ ... })` that mirrors a DB table.
2.  **REQUIRED**: Derive from `@juchang/db` schemas.
    - *Right (Select)*: `import { selectUserSchema } from '@juchang/db';`
    - *Right (Partial)*: `t.Pick(selectUserSchema, ['id', 'nickname'])`
    - *Right (Computed)*: `t.Intersect([selectUserSchema, t.Object({ distance: t.Number() })])`
    - *Right (Omit)*: `t.Omit(selectUserSchema, ['phoneNumber', 'wxOpenId'])`
    - *Right (Array)*: `t.Array(selectUserSchema)`

**Exception**: purely transient parameters (e.g., `lat/lng` query params, `page`, `limit`) can be manually defined.

```typescript
// ❌ 错误：手动定义
const userResponseSchema = t.Object({
  id: t.String(),
  nickname: t.String(),
});

// ✅ 正确：从 DB 派生
import { selectUserSchema } from '@juchang/db';
const userResponseSchema = t.Pick(selectUserSchema, ['id', 'nickname']);

// ✅ 允许：纯瞬态参数
const paginationSchema = t.Object({
  page: t.Optional(t.Number({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 20 })),
});
```

---

# 📝 Coding Standards

- **Naming**:
  - Database: `snake_case` (e.g., `user_id`, `created_at`).
  - TypeScript/JSON: `camelCase` (e.g., `userId`, `createdAt`).
- **Error Handling**: Standard Format: `{ code: number, msg: string, data?: any }`.
- **Package Manager**: Use **Bun** for all operations: `bun install`, `bun run dev`, etc.
- **Service Functions**: 必须是纯函数，无副作用，禁止使用 class。
  ```typescript
  // ✅ 正确：纯函数
  export async function getUserById(id: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user || null;
  }
  
  // ❌ 错误：类方法
  export class UserService {
    async getUserById(id: string) { ... }
  }
  ```

---

# 🛠️ Development Commands

```bash
# 安装依赖
bun install

# 启动基础设施
cd docker && docker-compose up -d

# 数据库操作
bun run db:migrate      # 执行迁移
bun run db:generate     # 生成迁移文件
bun run db:seed         # 填充种子数据

# 开发服务
bun run dev             # 启动所有服务
bun run dev:api         # 仅启动 API
bun run dev:admin       # 仅启动 Admin

# 代码生成
bun run gen:api         # 生成 Orval SDK
```

---

# ⚠️ Important Notes

- **TypeBox vs Zod**: We use TypeBox (t) from Elysia, NOT Zod (z). TypeBox is 50x faster.
- **Elysia vs Hono**: We use ElysiaJS, NOT Hono. Elysia is optimized for Bun.
- **Bun Runtime**: All scripts use `bun run`, not `npm` or `pnpm`.
- **Function-Based Services**: Services are pure functions, not classes.
- **Eden Treaty**: Admin uses Eden Treaty for type-safe API calls.
- **Orval SDK**: MiniProgram uses Orval-generated SDK.
- **Database Schema Immutable**: 数据库 Schema 是唯一真相源，**禁止修改 Schema 来适配代码**。如果代码与数据库不同步，使用 `bun run db:push` 更新数据库。

---

# 📊 MVP Architecture Summary

| 维度 | 设计 |
|------|------|
| **数据库** | 5 张核心表，PostgreSQL + PostGIS |
| **API** | 5 个 Elysia 模块，TypeBox 契约 |
| **小程序** | Native WeChat + Zustand Vanilla |
| **Admin** | Vite + React + Eden Treaty |
| **AI** | 创建解析 (3次/天)，SSE 流式响应 |
| **本地化** | 重庆 3D 地形 + locationHint 必填 |

---

# 📋 MVP 数据库 Schema 速查

## 枚举定义
```typescript
// 活动类型
activityTypeEnum: ["food", "entertainment", "sports", "boardgame", "other"]

// 活动状态
activityStatusEnum: ["active", "completed", "cancelled"]

// 参与者状态
participantStatusEnum: ["joined", "quit"]

// 消息类型
messageTypeEnum: ["text", "system"]

// 通知类型
notificationTypeEnum: ["join", "quit", "activity_start", "completed", "cancelled"]
```

## 表结构概览
| 表 | 核心字段 |
|---|---------|
| `users` | id, wxOpenId, phoneNumber, nickname, avatarUrl, aiCreateQuotaToday |
| `activities` | id, creatorId, title, location, locationHint, startAt, type, status |
| `participants` | id, activityId, userId, status (joined/quit) |
| `chat_messages` | id, activityId, senderId, type, content |
| `notifications` | id, userId, type, title, isRead, activityId |

---

# ✅ MVP 正确性属性 (Correctness Properties)

## 数据一致性
- **CP-1**: `currentParticipants` = `participants` 表中 `status='joined'` 的记录数
- **CP-2**: `activitiesCreatedCount` = `activities` 表中该用户创建的记录数
- **CP-3**: `cancelled/completed` 状态的活动不允许新增参与者

## 业务规则
- **CP-4**: 每日创建活动次数 ≤ `aiCreateQuotaToday` (默认 3)
- **CP-5**: 只有活动创建者可以更新状态
- **CP-6**: 只有 `active` 且未开始的活动可以删除
- **CP-7**: `isArchived` = `now > startAt + 24h` (动态计算)
- **CP-8**: `locationHint` 不能为空

## 认证规则
- **CP-9**: 未绑定手机号的用户不能发布/报名活动
- **CP-10**: 用户不能报名自己创建的活动
- **CP-11**: 未登录用户可以浏览地图、查看详情

## 前端状态
- **CP-12**: 页面栈长度为 1 时，返回按钮跳转首页
- **CP-13**: 群聊页面 onHide 停止轮询，onShow 恢复轮询
- **CP-14**: 未读消息 > 0 时，消息 Tab 显示角标
