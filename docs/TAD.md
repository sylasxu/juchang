# 聚场 (JuChang) 技术架构文档 - Lean MVP

> **版本**：v3.0 (纯工具版)
> **更新日期**：2024-12
> **架构**：原生小程序 + Zustand Vanilla + Elysia API + Drizzle ORM

---

## 1. 核心设计理念

1. **Database First**：`@juchang/db` (Drizzle ORM) 是绝对数据源，TypeBox Schema 从 Drizzle 自动派生
2. **原生极致性能**：小程序端使用微信开发者工具直接构建原生 WXML/LESS/TS，零运行时开销
3. **Spec-Coding 契约驱动**：Elysia TypeBox 定义路由契约，Orval 自动生成客户端 SDK
4. **最小 MVP**：只保留核心功能，砍掉所有非必要复杂度

---

## 2. 技术栈

| 模块 | 选型 | 说明 |
|------|------|------|
| **代码管理** | Turborepo + Bun | 任务编排与依赖管理 |
| **小程序** | 微信开发者工具 (Native) | TS + LESS，零运行时 |
| **小程序状态** | Zustand (Vanilla) | 极简状态管理，~2KB |
| **Admin 后台** | Vite + React + TanStack | Eden Treaty 调用 API |
| **API 网关** | Elysia | Bun 原生高性能框架 |
| **数据库** | PostgreSQL + PostGIS | LBS 地理查询 |
| **ORM** | Drizzle ORM | TypeScript Native |
| **Schema 生成** | drizzle-typebox | 自动生成 TypeBox |

---

## 3. 目录结构

```
/root
├── apps/
│   ├── miniprogram/          # 微信原生小程序
│   │   ├── pages/            # 主包页面 (3 Tab)
│   │   │   ├── home/         # 首页 (地图 + AI)
│   │   │   ├── message/      # 消息中心
│   │   │   ├── my/           # 个人中心
│   │   │   │   ├── info-edit/    # 资料编辑
│   │   │   │   ├── activities/   # 我的活动
│   │   │   │   ├── settings/     # 设置
│   │   │   │   └── about/        # 关于我们
│   │   │   └── chat/         # 群聊页
│   │   ├── subpackages/      # 分包
│   │   │   ├── activity/     # 活动相关
│   │   │   │   ├── detail/   # 活动详情
│   │   │   │   ├── create/   # 手动创建
│   │   │   │   ├── confirm/  # AI 确认
│   │   │   │   └── not-found/# 404 页面
│   │   │   └── legal/        # 法律文档
│   │   │       ├── user-agreement/
│   │   │       └── privacy-policy/
│   │   ├── components/       # 公共组件
│   │   ├── src/
│   │   │   ├── stores/       # Zustand Vanilla
│   │   │   ├── api/          # Orval 生成的 SDK
│   │   │   └── utils/        # 工具函数
│   │   └── app.json
│   │
│   ├── admin/                # Vite + React 管理后台
│   │   └── src/
│   │       ├── features/     # 功能模块
│   │       ├── routes/       # TanStack Router
│   │       └── lib/          # Eden Treaty
│   │
│   └── api/                  # Elysia API
│       └── src/
│           ├── index.ts      # 应用入口
│           ├── setup.ts      # 全局插件
│           └── modules/      # 功能模块 (5个)
│               ├── auth/
│               ├── users/
│               ├── activities/
│               ├── chat/
│               └── ai/
│
├── packages/
│   ├── db/                   # Drizzle ORM
│   │   └── src/schema/       # 5 张核心表
│   ├── utils/                # 通用工具
│   └── ts-config/            # TypeScript 配置
│
└── docker/                   # 基础设施
```

---

## 4. 数据库 Schema (MVP 5 表)

### 4.1 表结构概览

| 表 | 说明 | 核心字段 |
|---|------|---------|
| `users` | 用户表 | wxOpenId, phoneNumber, nickname, avatarUrl, aiCreateQuotaToday |
| `activities` | 活动表 | title, location, locationHint, startAt, type, status |
| `participants` | 参与者表 | activityId, userId, status (joined/quit) |
| `chat_messages` | 群聊消息表 | activityId, senderId, type, content |
| `notifications` | 通知表 | userId, type, title, isRead |

### 4.2 users 表

```typescript
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // 核心认证
  wxOpenId: varchar("wx_openid", { length: 128 }).notNull().unique(),
  phoneNumber: varchar("phone_number", { length: 20 }), // 延迟绑定
  
  // 基础资料
  nickname: varchar("nickname", { length: 50 }),
  avatarUrl: varchar("avatar_url", { length: 500 }),
  
  // AI 额度
  aiCreateQuotaToday: integer("ai_create_quota_today").default(3).notNull(),
  aiQuotaResetAt: timestamp("ai_quota_reset_at"),
  
  // 统计
  activitiesCreatedCount: integer("activities_created_count").default(0).notNull(),
  participationCount: integer("participation_count").default(0).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

### 4.3 activities 表

```typescript
export const activities = pgTable("activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  creatorId: uuid("creator_id").notNull().references(() => users.id),

  // 基础信息
  title: varchar("title", { length: 100 }).notNull(),
  description: text("description"),
  
  // 位置 (保留 PostGIS)
  location: geometry("location", { type: "point", mode: "xy", srid: 4326 }).notNull(),
  locationName: varchar("location_name", { length: 100 }).notNull(),
  address: varchar("address", { length: 255 }),
  locationHint: varchar("location_hint", { length: 100 }).notNull(), // 重庆地形必填
  
  // 时间
  startAt: timestamp("start_at").notNull(),

  // 活动属性
  type: activityTypeEnum("type").notNull(),
  maxParticipants: integer("max_participants").default(4).notNull(),
  currentParticipants: integer("current_participants").default(1).notNull(),
  
  // 状态 (MVP 简化)
  status: activityStatusEnum("status").default("active").notNull(),
  
  // 群聊归档状态：动态计算 isArchived = now > (startAt + 24h)
  // 不存储字段，API 层返回时计算

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

### 4.4 participants 表

```typescript
export const participants = pgTable("participants", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  activityId: uuid("activity_id").notNull().references(() => activities.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  
  status: participantStatusEnum("status").default("joined").notNull(),
  
  joinedAt: timestamp("joined_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

### 4.5 chat_messages 表

```typescript
export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  activityId: uuid("activity_id").notNull().references(() => activities.id),
  senderId: uuid("sender_id").references(() => users.id), // 可为空：系统消息
  
  type: messageTypeEnum("type").default("text").notNull(),
  content: text("content").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### 4.6 notifications 表

```typescript
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  userId: uuid("user_id").notNull().references(() => users.id),
  
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title", { length: 100 }).notNull(),
  content: text("content"),
  
  activityId: uuid("activity_id").references(() => activities.id),
  
  isRead: boolean("is_read").default(false).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### 4.7 枚举定义

```typescript
// 活动类型
export const activityTypeEnum = pgEnum("activity_type", [
  "food", "entertainment", "sports", "boardgame", "other"
]);

// 活动状态 (MVP 简化)
export const activityStatusEnum = pgEnum("activity_status", [
  "active", "completed", "cancelled"
]);

// 参与者状态 (MVP 简化)
export const participantStatusEnum = pgEnum("participant_status", [
  "joined", "quit"
]);

// 消息类型 (MVP 简化)
export const messageTypeEnum = pgEnum("message_type", [
  "text", "system"
]);

// 通知类型
export const notificationTypeEnum = pgEnum("notification_type", [
  "join", "quit", "activity_start", "completed", "cancelled"
]);
```

---

## 5. API 模块设计 (MVP 5 模块)

### 5.1 模块划分

| 模块 | 路径前缀 | 职责 |
|------|---------|------|
| `auth` | `/auth` | 微信登录、手机号绑定 |
| `users` | `/users` | 用户资料管理 |
| `activities` | `/activities` | 活动 CRUD、报名退出 |
| `chat` | `/chat` | 群聊消息 |
| `ai` | `/ai` | AI 解析 (SSE) |

### 5.2 Auth 模块

```typescript
// POST /auth/login - 微信静默登录
Request: { code: string }
Response: { token: string, user: UserBasic, isNewUser: boolean }

// POST /auth/bindPhone - 绑定手机号
Request: { code: string }
Response: { success: boolean, phoneNumber: string }
```

### 5.3 Users 模块

```typescript
// GET /users/me - 获取当前用户
Response: UserProfile

// PATCH /users/me - 更新资料
Request: { nickname?: string, avatarUrl?: string }
Response: UserProfile

// GET /users/me/quota - 获取今日额度
Response: { aiCreateQuota: number, resetAt: string }
```

### 5.4 Activities 模块

```typescript
// POST /activities - 创建活动
Request: CreateActivityInput
Response: Activity

// GET /activities/:id - 获取详情
Response: ActivityDetail (含 isArchived 计算字段)

// GET /activities/mine - 我的活动
Query: { type?: 'created' | 'joined' }
Response: Activity[]

// PATCH /activities/:id/status - 更新状态
Request: { status: 'completed' | 'cancelled' }
Response: Activity

// DELETE /activities/:id - 删除活动
Response: { success: boolean }

// POST /activities/:id/join - 报名
Response: Participant

// POST /activities/:id/quit - 退出
Response: { success: boolean }
```

### 5.5 Chat 模块

```typescript
// GET /chat/:activityId/messages - 获取消息 (轮询)
Query: { since?: string, limit?: number }
Response: ChatMessage[]

// POST /chat/:activityId/messages - 发送消息
Request: { content: string }
Response: ChatMessage
```

### 5.6 AI 模块

```typescript
// POST /ai/parse - AI 解析 (SSE 流式响应)
Request: { text: string, location?: { lat: number, lng: number } }
Response (SSE Events):
  - { event: "thinking", data: { message: string } }
  - { event: "location", data: { name: string, lat: number, lng: number } }
  - { event: "draft", data: ActivityDraft }
  - { event: "error", data: { message: string } }
  - { event: "done" }
```

---

## 6. 小程序架构

### 6.1 Zustand Vanilla Store

```typescript
// stores/copilot.ts - AI 副驾状态
import { createStore } from 'zustand/vanilla';

interface CopilotState {
  status: 'idle' | 'thinking' | 'locating' | 'done' | 'error';
  thinkingText: string;
  draft: ActivityDraft | null;
  targetLocation: { lat: number; lng: number } | null;
}

export const copilotStore = createStore<CopilotState & CopilotActions>((set) => ({
  status: 'idle',
  thinkingText: '',
  draft: null,
  targetLocation: null,
  
  setStatus: (status) => set({ status }),
  setThinkingText: (text) => set({ thinkingText: text }),
  setDraft: (draft) => set({ draft }),
  setTargetLocation: (location) => set({ targetLocation: location }),
  reset: () => set({ status: 'idle', thinkingText: '', draft: null, targetLocation: null }),
}));
```

### 6.2 页面绑定模式

```typescript
// pages/home/index.ts
import { copilotStore } from '../../src/stores/copilot';

Page({
  data: {
    copilotStatus: 'idle',
    aiReply: '',
  },

  unsubCopilot: null as (() => void) | null,

  onLoad() {
    // 订阅 Store 变化
    this.unsubCopilot = copilotStore.subscribe((state) => {
      this.setData({
        copilotStatus: state.status,
        aiReply: state.thinkingText,
      });
    });
  },

  onUnload() {
    // 取消订阅，防止内存泄漏
    this.unsubCopilot?.();
  },
});
```

### 6.3 群聊轮询策略

```typescript
// pages/chat/index.ts
Page({
  timer: null as number | null,

  onShow() {
    // 立即请求一次
    this.fetchMessages();
    // 启动轮询 (5-10秒)
    this.timer = setInterval(() => this.fetchMessages(), 5000);
  },

  onHide() {
    // 停止轮询
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  onUnload() {
    // 清理
    if (this.timer) {
      clearInterval(this.timer);
    }
  },
});
```

### 6.4 自定义导航栏

```typescript
// components/custom-navbar/index.ts
Component({
  properties: {
    title: { type: String, value: '' },
    showBack: { type: Boolean, value: true }
  },
  data: {
    statusBarHeight: 0,
    navBarHeight: 0,
  },
  lifetimes: {
    attached() {
      const { statusBarHeight } = wx.getSystemInfoSync();
      const menuButton = wx.getMenuButtonBoundingClientRect();
      // 公式: (胶囊Top - 状态栏Height) * 2 + 胶囊Height
      const navBarHeight = (menuButton.top - statusBarHeight) * 2 + menuButton.height;
      
      this.setData({ statusBarHeight, navBarHeight });
    }
  },
  methods: {
    onBack() {
      const pages = getCurrentPages();
      if (pages.length > 1) {
        wx.navigateBack();
      } else {
        // 单页进入，跳转首页
        wx.switchTab({ url: '/pages/home/index' });
      }
    }
  }
});
```

---

## 7. Admin 后台架构

### 7.1 Eden Treaty 客户端

```typescript
// lib/eden.ts
import { treaty } from '@elysiajs/eden';
import type { App } from '@juchang/api';

export const api = treaty<App>(import.meta.env.VITE_API_URL);
```

### 7.2 React Query Hooks

```typescript
// features/users/hooks/use-users.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/eden';

export function useUsers(params = {}) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: async () => {
      const { data, error } = await api.users.get({ query: params });
      if (error) throw error;
      return data;
    },
  });
}
```

---

## 8. TypeBox Schema 派生规则

### 8.1 核心原则

**禁止手动定义 TypeBox Schema，必须从 `@juchang/db` 派生**

```typescript
// ❌ 错误：手动定义
const userResponseSchema = t.Object({
  id: t.String(),
  nickname: t.String(),
});

// ✅ 正确：从 DB 派生
import { selectUserSchema } from '@juchang/db';
const userResponseSchema = t.Pick(selectUserSchema, ['id', 'nickname']);
```

### 8.2 派生方式

```typescript
// 直接使用
const userSchema = selectUserSchema;

// 选择字段
const userProfileSchema = t.Pick(selectUserSchema, ['id', 'nickname', 'avatarUrl']);

// 排除字段
const publicUserSchema = t.Omit(selectUserSchema, ['phoneNumber', 'wxOpenId']);

// 扩展字段
const userWithStatsSchema = t.Intersect([
  selectUserSchema,
  t.Object({ activityCount: t.Number() }),
]);

// 数组
const userListSchema = t.Array(selectUserSchema);
```

### 8.3 例外：纯瞬态参数

```typescript
// ✅ 允许：查询参数、分页参数
const paginationSchema = t.Object({
  page: t.Optional(t.Number({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 50, default: 20 })),
});
```

---

## 9. 开发命令

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

## 10. MVP 与平台版对比

| 维度 | 平台版 | MVP |
|------|--------|-----|
| 数据库表 | 11 张 | 5 张 |
| API 模块 | 8 个 | 5 个 |
| 付费功能 | Boost/Pin+ | 无 |
| 搜索功能 | 附近搜索 | 只显示"我相关的" |
| 幽灵锚点 | 有 | 无 |
| 靠谱度 | 复杂计算 | 无 |
| 群聊归档 | chatStatus 字段 | isArchived 动态计算 |
| 用户字段 | 复杂（会员、额度等） | 精简 |

---

## 11. 正确性属性 (Correctness Properties)

### 11.1 数据一致性

- **CP-1**: `currentParticipants` = `participants` 表中 `status='joined'` 的记录数
- **CP-2**: `activitiesCreatedCount` = `activities` 表中该用户创建的记录数
- **CP-3**: `cancelled/completed` 状态的活动不允许新增参与者

### 11.2 业务规则

- **CP-4**: 每日创建活动次数 ≤ `aiCreateQuotaToday` (默认 3)
- **CP-5**: 只有活动创建者可以更新状态
- **CP-6**: 只有 `active` 且未开始的活动可以删除
- **CP-7**: `isArchived` = `now > startAt + 24h` (动态计算)
- **CP-8**: `locationHint` 不能为空

### 11.3 认证规则

- **CP-9**: 未绑定手机号的用户不能发布/报名活动
- **CP-10**: 用户不能报名自己创建的活动
- **CP-11**: 未登录用户可以浏览地图、查看详情

### 11.4 前端状态

- **CP-12**: 页面栈长度为 1 时，返回按钮跳转首页
- **CP-13**: 群聊页面 onHide 停止轮询，onShow 恢复轮询
- **CP-14**: 未读消息 > 0 时，消息 Tab 显示角标
