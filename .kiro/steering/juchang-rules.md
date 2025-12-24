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

# 🏗️ Monorepo Structure & Responsibilities

## 1. @juchang/db (The Single Source of Truth - V9.2 Integrated)
- **Tech**: Drizzle ORM (PostgreSQL + PostGIS) + `drizzle-typebox`.
- **Path**: `packages/db/src/schema/*.ts`
- **Architecture**: **11 张整合表** (从 13 张优化而来，减少 15% 复杂度)
  - `users` (整合认证信息 + AI 额度分离)
  - `activities` (整合群聊状态 + 重庆地形适配 + 幽灵锚点)  
  - `participants` (履约确认 + 申诉机制)
  - `chat_messages` (直接关联活动，无需 chat_groups)
  - `feedbacks` (差评反馈系统)
  - `notifications` (通知推送系统)
  - `transactions` (整合 orders + payments 支付逻辑)
  - `action_logs` (操作审计日志)
  - `enums` (所有枚举定义)
  - `relations` (表关系定义)
  - `index.ts` (统一导出)
- **V9.2 核心特性**:
  - **重庆地形适配**: `locationHint` 字段支持 3D 地形位置备注
  - **AI 额度分离**: `aiCreateQuotaToday` (3次/天) + `aiSearchQuotaToday` (50次/天)
  - **幽灵锚点完整支持**: `isGhost` + `ghostAnchorType` + `ghostSuggestedType`
  - **整合支付逻辑**: 一个 `transactions` 表替代 `orders` + `payments`
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

## 2. apps/api (The Business Logic Gateway - V9.2 8-Module Design)
- **Tech**: ElysiaJS + `@elysiajs/openapi` + TypeBox (t).
- **Path**: `apps/api/src/modules/*`
- **Architecture**: **8 个核心模块**
  | 模块 | 职责 | 核心端点 |
  |------|------|----------|
  | `auth` | 认证授权 | `/auth/login`, `/auth/refresh` |
  | `users` | 用户管理 | `/users`, `/users/:id` |
  | `activities` | 活动管理 | `/activities`, `/activities/nearby` |
  | `participants` | 参与管理 | `/participants`, `/participants/apply` |
  | `ai` | AI 服务 (❌砍掉聊天) | `/ai/parse`, `/ai/search` |
  | `chat` | 群聊消息 | `/chat/messages`, `/chat/send` |
  | `transactions` | 支付交易 | `/transactions`, `/transactions/callback` |
  | `dashboard` | 数据面板 | `/dashboard/stats`, `/dashboard/users` |
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
  - Tab 2: 消息 (Connect) - 社交连接
  - Tab 3: 我 (Me) - 个人中心
  - AI 输入栏: 底部常驻悬浮栏 - 全能 CUI 入口
- **Core Components**:
  - `ai-input-bar/`: AI 输入栏组件（底部悬浮）
  - `cui-panel/`: CUI 副驾面板（流式响应展示）
  - `draft-card/`: 创建草稿卡片
  - `reliability-badge/`: 靠谱度徽章（🏅超靠谱/✓靠谱/🆕新人）
  - `activity-card/`: 活动卡片
  - `filter-panel/`: 筛选面板
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
  - **Reliability Display**: 简化为徽章展示，不显示百分比
    - > 90%: 🏅 超靠谱
    - > 80%: ✓ 靠谱
    - ≤ 80% 或新人: 🆕 新人

## 4. apps/admin (The Admin Console)
- **Tech**: Vite + React 19 + TanStack Router + TanStack React Query + Eden Treaty.
- **Path**: `apps/admin/src/features/*`
- **MVP Scope**: 用户管理、活动管理、幽灵锚点、交易管理、仪表板
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
- **API vs Mock Data Strategy**:
  - **DB-Backed Features**: users, activities, transactions, dashboard
  - **Mock Data Features**: moderation, risk-management (MVP 后迭代)

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
bun run dev:mp          # 仅启动小程序

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
- **V9.2 Architecture**:
  - **11 张整合表**: 从 13 张优化而来
  - **8 个 API 模块**: auth/users/activities/participants/ai/chat/transactions/dashboard
  - **AI 功能重定位**: 砍掉聊天，专注解析和搜索
  - **重庆本地化**: 强制 `locationHint`，支持 3D 地形
  - **幽灵锚点**: 完整的冷启动运营支持

---

# 🎯 Performance Best Practices

**数据库查询优化**:
```typescript
// ✅ 正确：使用索引字段查询
const activities = await db.select()
  .from(activities)
  .where(and(
    eq(activities.status, 'published'),
    gte(activities.startAt, new Date())
  ));

// ❌ 错误：全表扫描
const activities = await db.select()
  .from(activities)
  .where(like(activities.description, '%keyword%'));
```

**AI 调用优化**:
- 批量处理，减少 API 调用次数
- 使用 `Promise.all` + `chunk` 并行处理
- 避免串行调用 LLM API

---

# 📊 V9.2 Architecture Summary

| 维度 | 设计 |
|------|------|
| **数据库** | 11 张整合表，PostgreSQL + PostGIS |
| **API** | 8 个 Elysia 模块，TypeBox 契约 |
| **小程序** | Native WeChat + Zustand Vanilla |
| **Admin** | Vite + React + Eden Treaty |
| **AI** | 解析 (3次/天) + 搜索 (50次/天) |
| **支付** | Boost + Pin+ 两个付费点 |
| **本地化** | 重庆 3D 地形 + 幽灵锚点 |
