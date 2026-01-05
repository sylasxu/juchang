# 聚场 (JuChang) 技术架构文档

> **版本**：v3.9 (Agent-First + Generative UI + AI 对话持久化)
> **更新日期**：2025-01
> **架构**：原生小程序 + Zustand Vanilla + Elysia API + Drizzle ORM

---

## 1. 核心设计理念

### 1.1 产品架构哲学

| 原则 | 说明 |
|------|------|
| **Agent-First** | 聚场是 Personal Social Agent，不是工具。AI 主动服务用户，而非被动等待操作 |
| **Chat-First** | 首页即对话，所有功能封装在 Widget 气泡中。这不是 UI 风格，是产品定位 |
| **Generative UI** | AI 根据意图动态生成最合适的 Widget 类型（创建 vs 探索 vs 闲聊） |
| **Memory Layer** | AI 记住用户偏好，下次推荐更准。对话历史持久化到 conversations 表 |

### 1.2 技术架构原则

1. **Database First**：`@juchang/db` (Drizzle ORM) 是绝对数据源，TypeBox Schema 从 Drizzle 自动派生
2. **原生极致性能**：小程序端使用微信开发者工具直接构建原生 WXML/LESS/TS，零运行时开销
3. **Spec-Coding 契约驱动**：Elysia TypeBox 定义路由契约，Orval 自动生成客户端 SDK
4. **服务每个人**：不只服务群主（Creator），也服务参与者（Joiner）

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
│   │   ├── pages/            # 主包页面 (去 Tabbar 化)
│   │   │   ├── home/         # 首页 (Chat-First)
│   │   │   ├── profile/      # 个人中心
│   │   │   └── message/      # 消息中心
│   │   ├── subpackages/      # 分包
│   │   │   ├── activity/     # 活动相关
│   │   │   │   ├── detail/   # 活动详情
│   │   │   │   ├── create/   # 活动创建
│   │   │   │   ├── confirm/  # 活动确认页
│   │   │   │   ├── draft-edit/ # 草稿编辑页
│   │   │   │   ├── list/     # 活动列表页
│   │   │   │   ├── map-picker/  # 地图选点页
│   │   │   │   └── explore/  # 沉浸式地图页 (Generative UI)
│   │   │   ├── legal/        # 法律文档
│   │   │   │   ├── index     # 用户协议
│   │   │   │   └── about/    # 关于聚场
│   │   │   ├── safety/       # 安全中心
│   │   │   ├── search/       # 活动搜索
│   │   │   ├── chat/         # 活动群聊 (Lite_Chat)
│   │   │   ├── login/        # 登录页
│   │   │   └── setting/      # 设置页
│   │   ├── components/       # 公共组件 (34 个)
│   │   │   ├── custom-navbar/    # 自定义导航栏
│   │   │   ├── ai-dock/          # 超级输入坞
│   │   │   ├── chat-stream/      # 对话流容器
│   │   │   ├── widget-dashboard/ # 进场欢迎卡片
│   │   │   ├── widget-draft/     # 意图解析卡片
│   │   │   ├── widget-share/     # 创建成功卡片
│   │   │   ├── widget-explore/   # 探索卡片 (Generative UI)
│   │   │   ├── widget-launcher/  # 组局发射台
│   │   │   ├── widget-action/    # 快捷操作按钮
│   │   │   ├── widget-ask-preference/ # 多轮对话偏好询问
│   │   │   ├── widget-error/     # 错误提示卡片
│   │   │   ├── widget-skeleton/  # 卡片骨架屏
│   │   │   ├── thinking-bubble/  # AI 思考气泡
│   │   │   ├── auth-sheet/       # 半屏授权弹窗
│   │   │   ├── share-guide/      # 分享引导蒙层
│   │   │   ├── activity-preview-sheet/ # 活动预览浮层
│   │   │   └── ...               # 其他组件
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
│           └── modules/      # 功能模块 (9 个)
│               ├── auth/         # 微信登录、手机号绑定
│               ├── users/        # 用户 CRUD、额度
│               ├── activities/   # 活动 CRUD、报名、附近搜索
│               ├── participants/ # 参与者管理
│               ├── chat/         # 活动群聊消息
│               ├── ai/           # AI 解析、对话历史
│               ├── dashboard/    # 首页数据聚合
│               ├── notifications/ # 通知管理
│               └── reports/      # 举报管理
│
├── packages/
│   ├── db/                   # Drizzle ORM
│   │   └── src/schema/       # 7 张核心表 + reports
│   ├── utils/                # 通用工具
│   └── ts-config/            # TypeScript 配置
│
└── docker/                   # 基础设施
```

---

## 4. 数据库 Schema (v3.3 - 6 表 + 行业标准命名)

### 4.1 表结构概览

| 表 | 说明 | 核心字段 |
|---|------|---------|
| `users` | 用户表 | wxOpenId, phoneNumber, nickname, avatarUrl, aiCreateQuotaToday |
| `activities` | 活动表 | title, location, locationHint, startAt, type, status (默认 draft) |
| `participants` | 参与者表 | activityId, userId, status (joined/quit) |
| `conversations` | **AI 会话表** (v3.9 两层结构) | userId, title, messageCount, lastMessageAt |
| `conversation_messages` | **AI 对话消息表** | conversationId, userId, role, messageType, content, activityId |
| `activity_messages` | **活动群聊消息表** | activityId, senderId, messageType, content |
| `notifications` | 通知表 | userId, type, title, isRead |

### 4.2 conversations 表 (v3.9 两层会话结构)

```typescript
// packages/db/src/schema/conversations.ts

// ==========================================
// conversations 表（会话）
// ==========================================
export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  title: text("title"),  // 会话标题（从第一条用户消息自动提取）
  messageCount: integer("message_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
});

// ==========================================
// conversation_messages 表（消息）
// ==========================================
export const conversationMessages = pgTable("conversation_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  userId: uuid("user_id").notNull().references(() => users.id),
  role: conversationRoleEnum("role").notNull(),  // user | assistant
  messageType: conversationMessageTypeEnum("message_type").notNull(),
  content: jsonb("content").notNull(),
  activityId: uuid("activity_id").references(() => activities.id),  // Tool 返回的活动关联
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 对话角色枚举 (使用 assistant 符合 OpenAI 标准)
export const conversationRoleEnum = pgEnum('conversation_role', ['user', 'assistant']);

// 对话消息类型枚举 (v3.9 含 widget_ask_preference)
export const conversationMessageTypeEnum = pgEnum('conversation_message_type', [
  'text',              // 普通文本
  'widget_dashboard',  // 进场欢迎卡片
  'widget_launcher',   // 组局发射台 (复合型卡片)
  'widget_action',     // 快捷操作按钮 (简单跳转)
  'widget_draft',      // 意图解析卡片
  'widget_share',      // 创建成功卡片
  'widget_explore',    // 探索卡片 (Generative UI)
  'widget_error',      // 错误提示卡片
  'widget_ask_preference'  // 多轮对话偏好询问卡片
]);
```

**v3.9 AI 对话持久化**：
- `streamChat` 的 `onFinish` 回调自动保存对话到 `conversation_messages`
- 有 `userId` 时保存，无 `userId`（未登录）时不保存
- Tool 返回的 `activityId` 自动关联到 AI 响应消息
- 支持按 `activityId` 查询关联的对话历史（Admin 活动管理用）

### 4.3 activity_messages 表 (v3.3 语义化命名)

```typescript
// packages/db/src/schema/activity_messages.ts
// 活动消息类型枚举 (本地定义，语义化命名)
export const activityMessageTypeEnum = pgEnum('activity_message_type', [
  'text',    // 文本消息
  'system'   // 系统消息
]);

export const activityMessages = pgTable('activity_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  activityId: uuid('activity_id').notNull().references(() => activities.id),
  senderId: uuid('sender_id').references(() => users.id),
  messageType: activityMessageTypeEnum('message_type').default('text').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});
```

### 4.4 活动状态枚举 (v3.3 默认 draft)

```typescript
export const activityStatusEnum = pgEnum('activity_status', [
  'draft',      // AI 生成了，用户还没点确认 (默认值)
  'active',     // 用户确认了，正式发布
  'completed',  // 成局
  'cancelled'   // 取消
]);
```

### 4.5 其他表结构

```typescript
// users 表
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  wxOpenId: varchar("wx_openid", { length: 128 }).notNull().unique(),
  phoneNumber: varchar("phone_number", { length: 20 }),
  nickname: varchar("nickname", { length: 50 }),
  avatarUrl: varchar("avatar_url", { length: 500 }),
  aiCreateQuotaToday: integer("ai_create_quota_today").default(3).notNull(),
  aiQuotaResetAt: timestamp("ai_quota_reset_at"),
  activitiesCreatedCount: integer("activities_created_count").default(0).notNull(),
  participationCount: integer("participation_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// activities 表 (v3.3 status 默认值改为 draft)
export const activities = pgTable("activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  creatorId: uuid("creator_id").notNull().references(() => users.id),
  title: varchar("title", { length: 100 }).notNull(),
  description: text("description"),
  location: geometry("location", { type: "point", mode: "xy", srid: 4326 }).notNull(),
  locationName: varchar("location_name", { length: 100 }).notNull(),
  address: varchar("address", { length: 255 }),
  locationHint: varchar("location_hint", { length: 100 }).notNull(),
  startAt: timestamp("start_at").notNull(),
  type: activityTypeEnum("type").notNull(),
  maxParticipants: integer("max_participants").default(4).notNull(),
  currentParticipants: integer("current_participants").default(1).notNull(),
  status: activityStatusEnum("status").default("draft").notNull(), // v3.3 默认 draft
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

---

## 5. API 模块设计 (v3.3 - 5 模块)

### 5.1 模块划分

| 模块 | 路径前缀 | 职责 |
|------|---------|------|
| `auth` | `/auth` | 微信登录、手机号绑定 |
| `users` | `/users` | 用户资料管理 |
| `activities` | `/activities` | 活动 CRUD、报名退出、**附近搜索** |
| `chat` | `/chat` | 活动群聊消息 (activity_messages 表) |
| `ai` | `/ai` | AI 解析 (SSE)，**意图分类**，**对话历史管理** (conversations 表) |

**设计原则**：API 模块按功能领域划分，而非按页面划分。对话历史 (conversations) 属于 AI 功能领域，归入 `ai` 模块。

### 5.2 API 接口

```typescript
// Auth
POST /auth/login          // 微信静默登录
POST /auth/bindPhone      // 绑定手机号

// Users
GET  /users               // 获取用户列表 (分页、搜索)
GET  /users/:id           // 获取用户详情
PUT  /users/:id           // 更新用户信息
GET  /users/:id/quota     // 获取用户额度

// Activities
POST /activities          // 创建活动 (从 draft 变 active)
GET  /activities/:id      // 获取活动详情
GET  /activities/mine     // 获取我相关的活动
GET  /activities/nearby   // 获取附近活动 (Generative UI)
PATCH /activities/:id/status  // 更新活动状态
DELETE /activities/:id    // 删除活动
POST /activities/:id/join // 报名活动
POST /activities/:id/quit // 退出活动

// Chat (活动群聊)
GET  /chat/:activityId/messages  // 获取消息列表
POST /chat/:activityId/messages  // 发送消息

// AI (v3.9 扩展：AI 解析 + 对话历史 + 会话管理)
POST /ai/chat             // AI 对话 (Data Stream，自动保存对话历史)
GET  /ai/conversations    // 获取 AI 对话历史 (支持 activityId 查询)
POST /ai/conversations    // 添加用户消息到对话
DELETE /ai/conversations  // 清空对话历史 (新对话)
GET  /ai/sessions         // 获取会话列表 (Admin 对话审计)
GET  /ai/sessions/:id     // 获取会话详情
DELETE /ai/sessions/:id   // 删除会话
```

### 5.3 AI 解析 - 意图分类 (v3.2)

```typescript
// POST /ai/parse 的响应类型
type AIParseResponse = 
  | { intent: 'create'; widget: 'widget_draft'; data: ActivityDraft & { activityId: string } }
  | { intent: 'explore'; widget: 'widget_explore'; data: ExploreResponse }
  | { intent: 'unknown'; widget: 'text'; data: { message: string } };

interface ExploreResponse {
  center: { lat: number; lng: number; name: string };
  results: ExploreResult[];
  title: string;
}

interface ExploreResult {
  id: string;
  title: string;
  type: ActivityType;
  lat: number;
  lng: number;
  locationName: string;
  distance: number;
  startAt: string;
  currentParticipants: number;
  maxParticipants: number;
}
```

### 5.4 SSE 事件 (v3.2)

```typescript
type SSEEvent = 
  // 通用
  | { type: 'thinking'; data: { message: string } }
  
  // 创建场景
  | { type: 'location'; data: { name: string; lat: number; lng: number } }
  | { type: 'draft'; data: ActivityDraft & { activityId: string } }
  
  // 探索场景 (v3.2 新增)
  | { type: 'searching'; data: { message: string; center: { lat: number; lng: number; name: string } } }
  | { type: 'explore'; data: ExploreResponse }
  
  // 通用
  | { type: 'error'; data: { message: string } }
  | { type: 'done' };
```

---

## 6. 小程序架构

### 6.1 Zustand Vanilla Store

```typescript
// stores/home.ts - 首页对话状态
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { persist, createJSONStorage } from 'zustand/middleware'

interface HomeMessage {
  id: string;
  role: 'user' | 'assistant';
  type: 'text' | 'widget_dashboard' | 'widget_launcher' | 'widget_action' | 'widget_draft' | 'widget_share' | 'widget_explore' | 'widget_error';
  content: any;
  activityId?: string;
  createdAt: string;
}

interface HomeState {
  messages: HomeMessage[];
  isLoading: boolean;
  hasMore: boolean;
  cursor: string | null;
}

// 微信小程序存储适配器
const wechatStorage = {
  getItem: (name: string) => wx.getStorageSync(name) || null,
  setItem: (name: string, value: string) => wx.setStorageSync(name, value),
  removeItem: (name: string) => wx.removeStorageSync(name),
}

export const useHomeStore = create<HomeState & HomeActions>()(
  persist(
    immer((set, get) => ({
      messages: [],
      isLoading: false,
      hasMore: true,
      cursor: null,
      // ... actions
    })),
    {
      name: 'home-store',
      storage: createJSONStorage(() => wechatStorage),
      partialize: (state) => ({
        messages: state.messages.slice(-50),
      }),
    }
  )
)
```

### 6.2 页面绑定模式

```typescript
// pages/home/index.ts
import { useHomeStore } from '../../stores/home'

Page({
  data: {
    messages: [] as any[],
    isLoading: false,
  },
  
  unsub: null as null | (() => void),
  
  onLoad() {
    const store = useHomeStore
    
    // 1. 初始化数据
    const state = store.getState()
    this.setData({
      messages: state.messages,
      isLoading: state.isLoading,
    })
    
    // 2. 订阅 Store 变化
    this.unsub = store.subscribe((state) => {
      this.setData({
        messages: state.messages,
        isLoading: state.isLoading,
      })
    })
    
    // 3. 加载消息
    store.getState().loadMessages()
  },
  
  onUnload() {
    if (this.unsub) {
      this.unsub()
    }
  },
})
```

### 6.3 群聊轮询策略

```typescript
// pages/chat/index.ts
Page({
  timer: null as number | null,

  onShow() {
    this.fetchMessages();
    this.timer = setInterval(() => this.fetchMessages(), 5000);
  },

  onHide() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  onUnload() {
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
    showBack: { type: Boolean, value: true },
    showMenu: { type: Boolean, value: false },
    showMore: { type: Boolean, value: false }
  },
  data: {
    statusBarHeight: 0,
    navBarHeight: 0,
  },
  lifetimes: {
    attached() {
      const { statusBarHeight } = wx.getSystemInfoSync();
      const menuButton = wx.getMenuButtonBoundingClientRect();
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
        wx.reLaunch({ url: '/pages/home/index' });
      }
    }
  }
});
```

---

## 7. Generative UI 实现要点

### 7.1 Static Preview + Immersive Expansion

**问题**：`<map>` 是原生组件，层级最高，与 `<scroll-view>` 存在手势冲突

**解决方案**：
- Widget_Explore 在 Chat_Stream 中使用静态地图图片
- 点击后展开为全屏可交互地图
- 使用 `page-container` 或自定义动画实现"卡片放大"效果

### 7.2 意图分类的 Prompt Engineering

```
明确创建意图：包含时间 + 地点 + 活动类型
  → 返回 Widget_Draft

模糊探索意图：包含"附近"、"推荐"、"有什么好玩的"
  → 返回 Widget_Explore

无法识别：
  → 返回文本消息引导
```

### 7.3 流式渲染的分阶段策略

**探索场景渲染顺序**：
1. `thinking` → 显示 "正在理解你的需求..."
2. `searching` → 显示 "正在搜索观音桥附近的活动..."
3. `explore` → 逐步渲染 Widget_Explore：
   - 先显示 Header
   - 再显示静态地图预览
   - 最后显示活动列表
4. `done` → 显示 Action 按钮

### 7.4 地图 Markers 性能优化

- 限制同时显示的 Markers 数量（≤ 20 个）
- 使用聚合算法合并密集的 Markers
- 地图拖拽时使用防抖加载新数据

### 7.5 分享卡片落地页逻辑

**场景**：用户从分享卡片进入活动详情页，没有对话历史。

**实现要点**：
- 分享卡片进入时，页面栈长度为 1
- 点击返回时，调用 `wx.reLaunch('/pages/home/index')` 跳转首页
- 首页 Chat_Stream 为空，显示 Widget_Dashboard
- **MVP**：使用默认问候语即可
- **优化（可选）**：通过 URL 参数 `?from=share&activityId=xxx` 识别来源，显示定制问候语："看完活动了？要不你也来组一个？"

### 7.6 草稿过期处理

**场景**：用户翻到上周生成的 Widget_Draft，点击"确认发布"。

**后端校验**：
```typescript
// POST /activities 发布活动时
if (activity.status === 'draft' && activity.startAt < new Date()) {
  throw new Error('活动时间已过期，请重新创建');
}
```

**前端渲染**：
- Widget_Draft 根据 `startAt` 动态计算是否过期
- 过期状态：灰色卡片 + 禁用按钮 + 显示"已过期"标签
- 过期的 Widget_Draft 不可点击"确认发布"

**状态判断逻辑**：
```typescript
// 前端判断草稿是否过期
const isExpired = (draft: ActivityDraft) => {
  return new Date(draft.startAt) < new Date();
};
```

---

## 8. Admin 后台架构

### 8.1 Eden Treaty 客户端

```typescript
// lib/eden.ts
import { treaty } from '@elysiajs/eden';
import type { App } from '@juchang/api';

export const api = treaty<App>(import.meta.env.VITE_API_URL);
```

### 8.2 React Query Hooks

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

## 9. TypeBox Schema 派生规则

### 9.1 核心原则

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

### 9.2 派生方式

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

---

## 10. 开发命令

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
- **CP-19**: `draft` 状态的活动，`startAt` 已过期时不允许发布 (返回 400 错误)

### 11.3 认证规则

- **CP-9**: 未绑定手机号的用户不能发布/报名活动
- **CP-10**: 用户不能报名自己创建的活动
- **CP-11**: 未登录用户可以浏览对话、查看详情、探索附近

### 11.4 前端状态

- **CP-12**: 页面栈长度为 1 时，返回按钮跳转首页
- **CP-13**: 群聊页面 onHide 停止轮询，onShow 恢复轮询
- **CP-14**: 未读消息 > 0 时，消息中心显示角标

### 11.5 Generative UI (v3.2 新增)

- **CP-15**: AI 意图分类一致性 - 明确创建信息返回 Widget_Draft，探索性问题返回 Widget_Explore
- **CP-16**: Widget_Explore 在 Chat_Stream 中必须使用静态地图图片
- **CP-17**: 沉浸式地图页拖拽后必须自动加载新区域活动
- **CP-18**: 沉浸式地图页关闭时使用收缩动画

### 11.6 AI 对话持久化 (v3.9 新增)

- **CP-20**: AI 对话自动持久化 - 有 userId 时保存到 conversation_messages
- **CP-21**: Tool 返回的 activityId 自动关联到 AI 响应消息
- **CP-22**: 按 activityId 查询时返回完整会话上下文（不只是关联消息）

---

## 12. 视觉设计系统：Soft Tech

### 12.1 CSS Variables

```less
/* app.less - 语义化变量，自动适配深色模式 */
page {
  /* 主色 (Brand) - 矢车菊蓝 */
  --color-primary: #5B75FB;
  --color-primary-light: #708DFD;
  
  /* 辅助色 (同色系淡色) */
  --color-blue-light: #93C5FD;
  --color-purple-light: #C4B5FD;
  --color-mint-light: #6EE7B7;
  
  /* 语义化背景色 */
  --bg-page: #F5F7FA;
  --bg-card: #FFFFFF;
  --bg-gradient-top: #E6EFFF;
  
  /* 语义化文字色 */
  --text-main: #1F2937;
  --text-sub: #6B7280;
  
  /* 卡片样式 */
  --shadow-card: 0 8rpx 24rpx rgba(91, 117, 251, 0.06);
  --radius-lg: 32rpx;
}

/* 深色模式 */
@media (prefers-color-scheme: dark) {
  page {
    --color-primary: #6380FF;
    --bg-page: #0F172A;
    --bg-card: #1E293B;
    --bg-gradient-top: #1E1B4B;
    --text-main: #F1F5F9;
    --text-sub: #94A3B8;
    --border-card: 1px solid rgba(255, 255, 255, 0.1);
    --shadow-card: none;
  }
}
```

### 12.2 卡片样式

```less
.soft-card {
  background: var(--bg-card);
  color: var(--text-main);
  border: var(--border-card);
  box-shadow: var(--shadow-card);
  border-radius: var(--radius-lg);
}
```

---

---

## 13. Future Roadmap (Phase 2)

### 13.1 AI 海报生成 API

> **Phase 2: 视觉增长引擎** - 当需要破圈传播时上线

**API 端点**：`POST /share/poster`

**调用方**：小程序、Admin 后台

**架构设计**：
```
客户端点击"生成海报" 
  → POST /share/poster { activityId }
  → Elysia API 组装数据 
  → (可选) AI 生成背景图 (Flux/SDXL)
  → Puppeteer 渲染 HTML 模板 
  → 截图上传 CDN 
  → 返回 { posterUrl }
```

**技术栈**：
| 层级 | 技术 | 说明 |
|------|------|------|
| API 层 | Elysia `/share/poster` | 统一入口，供小程序和 Admin 调用 |
| 渲染层 | Puppeteer + HTML | CSS 就是画笔，Halo Card 样式 100% 复用 |
| 内容层 | Flux/SDXL API | AI 生成独一无二的活动背景图 |
| 组装层 | Puppeteer Composition | 二维码 + AI 图 + 文字信息拼接 |
| 存储层 | CDN (OSS/S3) | 海报图片持久化存储 |

**API 设计**：
```typescript
// POST /share/poster
// Request
{ activityId: string; style?: 'default' | 'cyberpunk' | 'minimal' }

// Response
{ 
  posterUrl: string;      // CDN 链接
  cached: boolean;        // 是否命中缓存
  generatedAt: string;    // 生成时间
}
```

**核心优势**：
- **CSS 复用**：Halo Card 样式代码 100% 复用，无需重写 Canvas 绘图逻辑
- **高级效果**：支持 `backdrop-filter`、`mask-image` 等小程序 Canvas 无法实现的效果
- **AI 增强**：每次生成独特背景图，刺激用户反复创建活动

**缓存策略**：
- 同一活动只生成一次，后续直接返回 CDN 链接
- 活动信息更新后自动失效缓存

---

## 附录：v3.9 vs v3.3 对比

| 维度 | v3.3 | v3.9 |
|------|------|------|
| 会话结构 | 单表 conversations | 两层结构 conversations + conversation_messages |
| 对话持久化 | 无自动保存 | streamChat onFinish 自动保存 |
| activityId 关联 | 手动关联 | Tool 返回时自动关联 |
| Widget 类型 | 8 种 | 9 种 (+widget_ask_preference) |
| 会话管理 API | 无 | /ai/sessions (Admin 对话审计) |
