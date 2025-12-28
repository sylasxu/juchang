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

---

# 🏗️ Monorepo Structure & Responsibilities

## 1. @juchang/db (The Single Source of Truth - v3.3)
- **Tech**: Drizzle ORM (PostgreSQL + PostGIS) + `drizzle-typebox`.
- **Path**: `packages/db/src/schema/*.ts`
- **Architecture**: **6 张核心表** (v3.3 Chat-First + Generative UI + 行业标准命名)
  - `users` (用户表：认证 + AI 额度 + 统计)
  - `activities` (活动表：基础信息 + 位置 + 状态，默认 draft)
  - `participants` (参与者表：报名/退出)
  - `conversations` (**AI 对话历史表**，原 home_messages，行业标准命名)
  - `activity_messages` (**活动群聊消息表**，原 group_messages，语义化命名)
  - `notifications` (通知表)
- **MVP 核心特性**:
  - **重庆地形适配**: `locationHint` 字段必填
  - **AI 额度**: `aiCreateQuotaToday` (3次/天)
  - **群聊归档**: `isArchived` 在 API 层动态计算 (now > startAt + 24h)
  - **Chat-First**: conversations 存储用户与 AI 的对话历史
  - **行业标准**: role 使用 user/assistant (符合 OpenAI 标准)
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

## 2. apps/api (The Business Logic Gateway - v3.3 按功能领域划分)
- **Tech**: ElysiaJS + `@elysiajs/openapi` + TypeBox (t).
- **Path**: `apps/api/src/modules/*`
- **Architecture**: **5 个核心模块** (按功能领域划分，非按页面划分)
  | 模块 | 职责 | 核心端点 |
  |------|------|----------|
  | `auth` | 认证授权 | `/auth/login`, `/auth/bindPhone` |
  | `users` | 用户管理 | `/users`, `/users/:id`, `/users/:id/quota` |
  | `activities` | 活动管理 | `/activities`, `/activities/:id/join`, `/activities/nearby` |
  | `chat` | 群聊消息 (activity_messages 表) | `/chat/:activityId/messages` |
  | `ai` | AI 解析 + **对话历史管理** (conversations 表) | `/ai/parse`, `/ai/conversations` |
- **Users 模块端点详情**:
  | 端点 | 方法 | 用途 |
  |------|------|------|
  | `/users` | GET | 用户列表（分页、搜索） |
  | `/users/:id` | GET | 用户详情 |
  | `/users/:id` | PUT | 更新用户 |
  | `/users/:id/quota` | GET | 获取用户额度 |
- **设计原则**：API 模块按功能领域划分，而非按页面划分
  - ❌ 不创建 `home` 模块（页面导向）
  - ✅ 对话历史归入 `ai` 模块（功能领域导向）
- **Structure**: Feature-based folder structure:
  - `*.controller.ts`: Elysia instance as controller
  - `*.service.ts`: Pure business logic functions (纯函数，无副作用)
  - `*.model.ts`: TypeBox schemas using `Static<typeof schema>`
- **Mandate**:
  - **Type Exports**: ❌ **FORBIDDEN** `export namespace`, ✅ **REQUIRED** direct type exports
  - **Schema Derivation**: Derive from `@juchang/db` schemas, avoid manual re-typing
  - **Services**: 必须是纯函数，禁止使用 class

## 3. apps/miniprogram (The WeChat Client - v3.2 Chat-First)
- **Tech**: Native WeChat MiniProgram + 微信开发者工具 + TypeScript + Zustand Vanilla + LESS.
- **Build**: 通过微信开发者工具直接构建，**不使用 weapp-vite**。
- **Navigation**: **去 Tabbar 化 + AI Dock** 设计
  - 首页 (Home) - Chat-First 对话流 + AI Dock
  - 个人中心 (Profile) - 从 Navbar Menu 进入
  - 消息中心 (Message) - 从 Navbar Dropmenu 进入
  - **沉浸式地图页 (Explore)** - 从 Widget_Explore 展开
- **Core Components**:
  - `custom-navbar/`: 自定义导航栏
  - `ai-dock/`: 超级输入坞（底部悬浮）
  - `chat-stream/`: 对话流容器
  - `widget-dashboard/`: 进场欢迎卡片 (简化版)
  - `widget-launcher/`: **组局发射台（复合型卡片 - v3.3 新增）**
  - `widget-action/`: **快捷操作按钮（简单跳转 - v3.3 新增）**
  - `widget-draft/`: 意图解析卡片（创建场景）
  - `widget-share/`: 创建成功卡片
  - `widget-explore/`: **探索卡片（Generative UI）**
  - `activity-mini-card/`: 活动迷你卡片
  - `activity-list-item/`: 活动列表项
  - `filter-bar/`: 筛选栏
- **Mandate**:
  - **NO Manual Requests**: DO NOT use `wx.request` for business logic.
  - **Use SDK**: Import methods from `@/api/generated.ts` (Generated by Orval).
  - **Styling**: Use LESS.
  - **Widget_Explore**: 必须使用静态地图图片，避免 map 组件与 scroll-view 手势冲突

## 4. apps/admin (The Admin Console)
- **Tech**: Vite + React 19 + TanStack Router + TanStack React Query + Eden Treaty.
- **Mandate**:
  - **Eden Treaty**: Use `import { api } from '@/lib/eden'` for type-safe API calls.
  - **TypeBox Only**: Use TypeBox for all schemas, NOT Zod.
  - **NO Zod**: ❌ **FORBIDDEN** `import { z } from 'zod'` 或 `zodResolver`。

---

# 🚫 The "NO MANUAL TYPEBOX" Rule (CRITICAL)

**When defining API Inputs/Outputs:**
1.  **FORBIDDEN**: Creating a root-level `t.Object({ ... })` that mirrors a DB table.
2.  **REQUIRED**: Derive from `@juchang/db` schemas.

```typescript
// ❌ 错误：手动定义
const userResponseSchema = t.Object({ id: t.String(), nickname: t.String() });

// ✅ 正确：从 DB 派生
import { selectUserSchema } from '@juchang/db';
const userResponseSchema = t.Pick(selectUserSchema, ['id', 'nickname']);
```

---

# 🗣️ 语气规范 (Tone of Voice)

> **不要让 UI 的高级感变成"距离感"**

| ❌ 反例（太装逼） | ✅ 正例（接地气） |
|------------------|------------------|
| "已为您构建全息活动契约" | "帮你把局组好了！就在观音桥，离地铁口 200 米" |
| "正在解析您的意图向量..." | "收到，正在帮你整理..." |
| "解析失败，请检查输入格式。" | "抱歉，我没理解你的意思，试试换个说法？" |
| "今日配额已耗尽。" | "今天的 AI 额度用完了，明天再来吧～" |

---

# 🛠️ Development Commands

```bash
bun install              # 安装依赖
bun run db:migrate       # 执行迁移
bun run db:generate      # 生成迁移文件
bun run dev              # 启动所有服务
bun run gen:api          # 生成 Orval SDK
```

---

# 📋 MVP 数据库 Schema 速查 (v3.3)

## 枚举定义
```typescript
// 活动状态 (默认 draft)
activityStatusEnum: ["draft", "active", "completed", "cancelled"]

// 对话角色 (v3.3 行业标准命名，使用 assistant 符合 OpenAI 标准)
conversationRoleEnum: ["user", "assistant"]

// 对话消息类型 (v3.3 含 Generative UI + Composite Widget + Simple Widget)
conversationMessageTypeEnum: ["text", "widget_dashboard", "widget_launcher", "widget_action", "widget_draft", "widget_share", "widget_explore", "widget_error"]

// 活动消息类型 (v3.3 语义化命名，本地定义)
activityMessageTypeEnum: ["text", "system"]
```

## 表结构概览
| 表 | 核心字段 |
|---|---------|
| `users` | id, wxOpenId, phoneNumber, nickname, avatarUrl, aiCreateQuotaToday |
| `activities` | id, creatorId, title, location, locationHint, startAt, type, status (默认 draft) |
| `participants` | id, activityId, userId, status (joined/quit) |
| `conversations` | **id, userId, role, messageType, content, activityId** (原 home_messages) |
| `activity_messages` | id, activityId, senderId, messageType, content (原 group_messages) |
| `notifications` | id, userId, type, title, isRead, activityId |

---

# ✅ MVP 正确性属性 (Correctness Properties) v3.2

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
- **CP-19**: `draft` 状态的活动，`startAt` 已过期时不允许发布

## 认证规则
- **CP-9**: 未绑定手机号的用户不能发布/报名活动
- **CP-10**: 用户不能报名自己创建的活动
- **CP-11**: 未登录用户可以浏览对话、查看详情、探索附近

## 前端状态
- **CP-12**: 页面栈长度为 1 时，返回按钮跳转首页
- **CP-13**: 群聊页面 onHide 停止轮询，onShow 恢复轮询
- **CP-14**: 未读消息 > 0 时，消息中心显示角标

## Generative UI (v3.2 新增)
- **CP-15**: AI 意图分类一致性 - 明确创建信息返回 Widget_Draft，探索性问题返回 Widget_Explore，模糊创建意图返回 Widget_Launcher
- **CP-16**: Widget_Explore 在 Chat_Stream 中必须使用静态地图图片
- **CP-17**: 沉浸式地图页拖拽后必须自动加载新区域活动
- **CP-18**: 沉浸式地图页关闭时使用收缩动画

## Composite Widget (v3.3 新增)
- **CP-20**: Widget_Launcher 必须包含三层结构：Header + Body (双栏) + Footer (工具网格)
- **CP-21**: Widget_Launcher 的辅助工具点击必须触发对应功能（掷骰子、AA计算、投票）

---

# 📊 MVP Architecture Summary (v3.3)

| 维度 | 设计 |
|------|------|
| **数据库** | 6 张核心表，PostgreSQL + PostGIS |
| **API** | 5 个 Elysia 模块（按功能领域划分），TypeBox 契约 |
| **小程序** | Native WeChat + Zustand Vanilla + **去 Tabbar 化** |
| **Admin** | Vite + React + Eden Treaty + **AI Ops (Vercel AI SDK)** |
| **AI** | 创建解析 (3次/天) + **意图分类**，SSE 流式响应 |
| **Generative UI** | Widget_Explore + 沉浸式地图页 |
| **Composite Widget** | Widget_Launcher (组局发射台) - 三层结构复合型卡片 |
