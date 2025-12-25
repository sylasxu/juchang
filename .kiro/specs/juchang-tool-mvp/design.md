# Design Document

## Introduction

本文档定义聚场(JuChang)小程序 MVP 的技术设计，基于 requirements.md 中的 14 个需求。

**设计原则**：
1. **Database First** - `@juchang/db` 是绝对数据源，TypeBox Schema 从 Drizzle 自动派生
2. **最小改动** - 复用现有 schema，仅做必要的字段精简和枚举调整
3. **保留 PostGIS** - 虽然 MVP 不做"附近搜索"，但 PostGIS 已配置好，无需降级为 lat/lng

---

## Database Schema

### Schema 调整策略

**保留现有表结构**，仅做以下调整：

| 表 | 调整内容 |
|---|---------|
| `users` | 移除 MVP 不需要的字段（会员、复杂额度等），保留核心字段 |
| `activities` | 简化状态枚举，移除增值服务字段（boost/pin+/ghost） |
| `participants` | 简化状态枚举为 `joined/quit` |
| `chat_messages` | 保持不变 |
| `enums` | 新增 MVP 专用枚举或调整现有枚举 |

### 1. users 表 (MVP 精简版)

```typescript
// packages/db/src/schema/users.ts
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // --- 核心认证 ---
  wxOpenId: varchar("wx_openid", { length: 128 }).notNull().unique(),
  phoneNumber: varchar("phone_number", { length: 20 }), // 延迟绑定
  
  // --- 基础资料 ---
  nickname: varchar("nickname", { length: 50 }),
  avatarUrl: varchar("avatar_url", { length: 500 }),
  
  // --- AI 额度 (MVP 简化) ---
  aiCreateQuotaToday: integer("ai_create_quota_today").default(3).notNull(),
  aiQuotaResetAt: timestamp("ai_quota_reset_at"),
  
  // --- 统计 ---
  activitiesCreatedCount: integer("activities_created_count").default(0).notNull(),
  participationCount: integer("participation_count").default(0).notNull(),
  
  // --- 系统 ---
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

**MVP 移除的字段**：
- `lastLoginIp`, `lastLoginAt` - 审计功能，MVP 不需要
- `bio`, `gender` - 社交资料，MVP 简化
- `fulfillmentCount`, `disputeCount`, `feedbackReceivedCount` - 复杂靠谱度，MVP 不做
- `membershipType`, `membershipExpiresAt` - 会员系统，MVP 砍掉
- `aiSearchQuotaToday` - 搜索功能砍掉，只保留创建额度
- `lastLocation`, `lastActiveAt` - LBS 追踪，MVP 不需要
- `interestTags` - 标签系统，MVP 不做
- `isRegistered`, `isRealNameVerified`, `isBlocked` - 复杂状态，MVP 简化

### 2. activities 表 (MVP 精简版)

```typescript
// packages/db/src/schema/activities.ts
export const activities = pgTable("activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  creatorId: uuid("creator_id").notNull().references(() => users.id),

  // --- 基础信息 ---
  title: varchar("title", { length: 100 }).notNull(),
  description: text("description"),
  
  // --- 位置 (保留 PostGIS) ---
  location: geometry("location", { type: "point", mode: "xy", srid: 4326 }).notNull(),
  locationName: varchar("location_name", { length: 100 }).notNull(),
  address: varchar("address", { length: 255 }),
  locationHint: varchar("location_hint", { length: 100 }).notNull(), // 重庆地形必填
  
  // --- 时间 ---
  startAt: timestamp("start_at").notNull(),

  // --- 活动属性 ---
  type: activityTypeEnum("type").notNull(),
  maxParticipants: integer("max_participants").default(4).notNull(),
  currentParticipants: integer("current_participants").default(1).notNull(),
  
  // --- 状态 (MVP 简化) ---
  status: activityStatusMvpEnum("status").default("active").notNull(),
  
  // --- 群聊状态 (动态计算，不存字段) ---
  // isArchived = now > (startAt + 24h)
  // 在 API 层返回时临时计算，避免 Cron Job 维护成本

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

**MVP 移除的字段**：
- `images` - 图片上传，MVP 不做
- `endAt` - 结束时间，MVP 只用开始时间
- `feeType`, `estimatedCost` - 费用系统，MVP 简化
- `joinMode` - 审批模式，MVP 只做即时加入
- `riskScore`, `riskLevel` - 风控系统，MVP 不做
- `tags`, `genderRequirement`, `minReliabilityRate` - 筛选条件，MVP 不做
- `isConfirmed`, `confirmedAt` - 履约确认移到状态枚举
- `isLocationBlurred` - 隐私设置，MVP 不做
- `isBoosted`, `boostExpiresAt`, `boostCount`, `isPinPlus`, `pinPlusExpiresAt` - 增值服务，MVP 砍掉
- `isGhost`, `ghostAnchorType`, `ghostSuggestedType` - 幽灵锚点，MVP 砍掉

### 3. participants 表 (MVP 精简版)

```typescript
// packages/db/src/schema/participants.ts
export const participants = pgTable("participants", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  activityId: uuid("activity_id").notNull().references(() => activities.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  
  // --- 状态 (MVP 简化) ---
  status: participantStatusMvpEnum("status").default("joined").notNull(),
  
  joinedAt: timestamp("joined_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

**MVP 移除的字段**：
- `applicationMsg` - 申请消息，MVP 不做审批
- `isFastPass` - 优先入场券，MVP 砍掉
- `confirmedAt`, `isDisputed`, `disputedAt`, `disputeExpiresAt` - 复杂履约，MVP 简化

### 4. chat_messages 表 (保持不变)

```typescript
// packages/db/src/schema/chat_messages.ts
export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  activityId: uuid("activity_id").notNull().references(() => activities.id),
  senderId: uuid("sender_id").references(() => users.id), // 可为空：系统消息无 sender
  
  type: messageTypeEnum("type").default("text").notNull(),
  content: text("content").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**设计说明**：
- `senderId` 可为空：系统消息（如"张三退出了活动"）不需要 sender，前端渲染时显示"系统通知"

**MVP 移除的字段**：
- `metadata` - 扩展数据，MVP 不需要
- `isRevoked` - 撤回功能，MVP 不做

### 5. notifications 表 (MVP 新增)

```typescript
// packages/db/src/schema/notifications.ts
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  userId: uuid("user_id").notNull().references(() => users.id),
  
  type: notificationTypeMvpEnum("type").notNull(),
  title: varchar("title", { length: 100 }).notNull(),
  content: text("content"),
  
  // --- 关联 ---
  activityId: uuid("activity_id").references(() => activities.id),
  
  isRead: boolean("is_read").default(false).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### 6. enums (MVP 专用)

```typescript
// packages/db/src/schema/enums.ts

// 活动类型 (保持不变)
export const activityTypeEnum = pgEnum("activity_type", [
  "food",
  "entertainment", 
  "sports",
  "boardgame",
  "other"
]);

// 活动状态 (MVP 简化)
export const activityStatusMvpEnum = pgEnum("activity_status_mvp", [
  "active",     // 进行中
  "completed",  // 已成局
  "cancelled"   // 已取消
]);

// 参与者状态 (MVP 简化)
export const participantStatusMvpEnum = pgEnum("participant_status_mvp", [
  "joined",  // 已加入
  "quit"     // 已退出
]);

// 消息类型 (MVP 简化)
export const messageTypeMvpEnum = pgEnum("message_type_mvp", [
  "text",    // 文本消息
  "system"   // 系统消息
]);

// 通知类型 (MVP)
export const notificationTypeMvpEnum = pgEnum("notification_type_mvp", [
  "join",           // 有人报名
  "quit",           // 有人退出
  "activity_start", // 活动即将开始
  "completed",      // 活动成局
  "cancelled"       // 活动取消
]);
```

---

## API Interface Definitions

### 模块划分 (MVP 5 模块)

| 模块 | 路径前缀 | 职责 |
|------|---------|------|
| `auth` | `/auth` | 微信登录、手机号绑定 |
| `users` | `/users` | 用户资料管理 |
| `activities` | `/activities` | 活动 CRUD、我的活动 |
| `chat` | `/chat` | 群聊消息 |
| `ai` | `/ai` | AI 解析 |

### 1. Auth 模块

```typescript
// POST /auth/login
// 微信静默登录
Request: { code: string }
Response: { token: string, user: UserBasic, isNewUser: boolean }

// POST /auth/bindPhone
// 绑定手机号 (延迟验证)
Request: { code: string } // getPhoneNumber 返回的 code
Response: { success: boolean, phoneNumber: string }
```

### 2. Users 模块

```typescript
// GET /users/me
// 获取当前用户信息
Response: UserProfile

// PATCH /users/me
// 更新用户资料
Request: { nickname?: string, avatarUrl?: string }
Response: UserProfile

// GET /users/me/quota
// 获取今日额度
Response: { aiCreateQuota: number, resetAt: string }
```

### 3. Activities 模块

```typescript
// POST /activities
// 创建活动
Request: CreateActivityInput
Response: Activity

// GET /activities/:id
// 获取活动详情
Response: ActivityDetail

// GET /activities/mine
// 获取我相关的活动 (发布的 + 参与的)
Query: { type?: 'created' | 'joined' }
Response: Activity[]

// PATCH /activities/:id/status
// 更新活动状态 (发起人操作)
Request: { status: 'completed' | 'cancelled' }
Response: Activity

// DELETE /activities/:id
// 删除活动 (仅 active 状态可删)
Response: { success: boolean }

// POST /activities/:id/join
// 报名活动
Response: Participant

// POST /activities/:id/quit
// 退出活动
Response: { success: boolean }
```

### 4. Chat 模块

```typescript
// GET /chat/:activityId/messages
// 获取消息列表 (轮询)
Query: { since?: string, limit?: number }
Response: ChatMessage[]

// POST /chat/:activityId/messages
// 发送消息
Request: { content: string }
Response: ChatMessage
```

### 5. AI 模块

```typescript
// POST /ai/parse
// AI 解析自然语言 (SSE 流式响应)
Request: { text: string, location?: { lat: number, lng: number } }
Response (SSE Events):
  - { event: "thinking", data: { message: string } }
  - { event: "location", data: { name: string, lat: number, lng: number } }
  - { event: "draft", data: ActivityDraft }
  - { event: "error", data: { message: string } }
  - { event: "done" }
```

### TypeBox Schema 派生示例

```typescript
// apps/api/src/modules/activities/activities.model.ts
import { t } from 'elysia';
import { selectActivitySchema, insertActivitySchema } from '@juchang/db';

// ✅ 正确：从 DB 派生
export const activityResponseSchema = t.Pick(selectActivitySchema, [
  'id', 'title', 'description', 'locationName', 'locationHint',
  'startAt', 'type', 'maxParticipants', 'currentParticipants', 'status'
]);

// ✅ 正确：创建输入 (Omit 系统字段)
export const createActivityInputSchema = t.Omit(insertActivitySchema, [
  'id', 'creatorId', 'currentParticipants', 'status', 
  'chatStatus', 'chatArchivedAt', 'createdAt', 'updatedAt'
]);

// ✅ 允许：纯瞬态参数
export const paginationSchema = t.Object({
  page: t.Optional(t.Number({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 50, default: 20 })),
});
```

---

## Component Architecture

### 小程序目录结构

```
apps/miniprogram/
├── app.ts                    # 应用入口
├── app.json                  # 全局配置
├── app.less                  # 全局样式
│
├── pages/                    # 主包页面 (Tab 页)
│   ├── home/                 # 首页 (地图 + AI)
│   │   ├── index.ts
│   │   ├── index.wxml
│   │   ├── index.less
│   │   └── index.json
│   ├── message/              # 消息中心
│   ├── my/                   # 个人中心
│   │   ├── index.*           # 主页
│   │   └── info-edit/        # 资料编辑页 (分包)
│   └── chat/                 # 群聊页 (分包)
│
├── subpackages/              # 分包
│   └── activity/             # 活动分包
│       ├── detail/           # 活动详情页
│       ├── create/           # 手动创建页
│       ├── confirm/          # AI 解析确认页
│       └── not-found/        # 活动不存在页 (404)
│
├── components/               # 公共组件
│   ├── ai-input-bar/         # AI 输入栏
│   ├── cui-panel/            # CUI 副驾面板
│   ├── draft-card/           # 创建草稿卡片
│   ├── activity-card/        # 活动卡片
│   ├── custom-navbar/        # 自定义导航栏
│   ├── phone-auth-modal/     # 手机号绑定弹窗
│   └── profile-modal/        # 资料完善弹窗
│
├── stores/                   # Zustand Vanilla Stores
│   ├── user.ts               # 用户状态
│   ├── copilot.ts            # AI 副驾状态
│   └── chat.ts               # 群聊状态
│
├── services/                 # API 服务层
│   ├── api.ts                # Orval 生成的 SDK
│   └── request.ts            # 请求封装
│
└── utils/                    # 工具函数
    ├── auth.ts               # 认证相关
    └── share.ts              # 分享相关
```

### MVP 完整页面清单

**设计原则**：保持正常 App 交互体验，不为层级优化牺牲用户体验

| 页面 | 路径 | 类型 | 说明 |
|-----|------|------|------|
| **Tab 页** | | | |
| 首页 | `pages/home/index` | Tab | 地图 + AI 输入栏 |
| 消息 | `pages/message/index` | Tab | 通知 + 群聊列表 |
| 我的 | `pages/my/index` | Tab | 个人中心入口 |
| **我的子页面** | | | |
| 资料编辑 | `pages/my/info-edit/index` | 分包 | 头像昵称编辑 |
| 我的活动 | `pages/my/activities/index` | 分包 | 我发布的/我参与的列表 |
| 设置 | `pages/my/settings/index` | 分包 | 设置页（通知开关、清除缓存等） |
| 关于我们 | `pages/my/about/index` | 分包 | 版本号、开发者信息、法律文档入口 |
| **活动相关** | | | |
| 活动详情 | `subpackages/activity/detail/index` | 分包 | 活动详情页 |
| 手动创建 | `subpackages/activity/create/index` | 分包 | 手动创建活动 |
| AI 确认 | `subpackages/activity/confirm/index` | 分包 | AI 解析确认页 |
| 群聊 | `pages/chat/index` | 分包 | 活动群聊 |
| 活动不存在 | `subpackages/activity/not-found/index` | 分包 | 404 页面 |
| **法律文档** | | | |
| 用户协议 | `subpackages/legal/user-agreement/index` | 分包 | ⚠️ 审核必须 |
| 隐私政策 | `subpackages/legal/privacy-policy/index` | 分包 | ⚠️ 审核必须 |

**总计：14 个页面**

**典型用户路径层级**：
- 我的(1) → 设置(2) → 关于我们(3) → 用户协议(4) = 4 层 ✅
- 我的(1) → 我的活动(2) → 活动详情(3) → 群聊(4) = 4 层 ✅
- 首页(1) → AI确认(2) → 分享成功 = 2 层 ✅

**MVP 移除的页面**：
- `pages/search/` - 搜索功能砍掉
- `pages/login/` - 延迟验证，不需要独立登录页
- `subpackages/safety/` - 安全中心 MVP 不做

**全局组件**：
- `components/phone-auth-modal/` - 手机号绑定弹窗（含协议勾选）
- `components/location-guide-modal/` - 位置授权引导弹窗
- `components/network-error/` - 网络错误提示组件

### 核心组件设计

#### 1. ai-input-bar (AI 输入栏)

```typescript
// components/ai-input-bar/index.ts
Component({
  properties: {
    placeholder: { type: String, value: '本周想玩什么...' }
  },
  data: {
    inputValue: '',
    isExpanded: false,  // 是否展开 CUI Panel
    isRecording: false  // 是否录音中
  },
  methods: {
    onTap() {
      // 展开 CUI Panel
      this.setData({ isExpanded: true });
      this.triggerEvent('expand');
    },
    onInput(e: WechatMiniprogram.Input) {
      // 防抖 800ms 后触发 AI 解析
      this.debounceParseInput(e.detail.value);
    },
    onVoiceStart() {
      // 开始录音
      wx.startRecord({ ... });
    },
    onVoiceEnd() {
      // 结束录音，转文字
      wx.stopRecord();
    }
  }
});
```

#### 2. cui-panel (CUI 副驾面板)

```typescript
// components/cui-panel/index.ts
Component({
  properties: {
    visible: { type: Boolean, value: false }
  },
  data: {
    status: 'idle' as 'idle' | 'thinking' | 'locating' | 'done' | 'error',
    thinkingText: '',
    draft: null as ActivityDraft | null
  },
  methods: {
    // 处理 SSE 流式响应
    handleSSEEvent(event: SSEEvent) {
      switch (event.type) {
        case 'thinking':
          this.setData({ status: 'thinking', thinkingText: event.data.message });
          break;
        case 'location':
          this.setData({ status: 'locating' });
          this.triggerEvent('flyToLocation', event.data);
          break;
        case 'draft':
          this.setData({ status: 'done', draft: event.data });
          break;
        case 'error':
          this.setData({ status: 'error', thinkingText: event.data.message });
          break;
      }
    },
    onConfirmDraft() {
      // 跳转到确认页
      wx.navigateTo({
        url: `/subpackages/activity/confirm/index?draft=${encodeURIComponent(JSON.stringify(this.data.draft))}`
      });
    }
  }
});
```

#### 3. custom-navbar (自定义导航栏)

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
    menuButtonHeight: 0
  },
  lifetimes: {
    attached() {
      // 动态计算导航栏高度 (适配不同机型)
      const { statusBarHeight } = wx.getSystemInfoSync();
      const menuButton = wx.getMenuButtonBoundingClientRect();
      // 公式: (胶囊Top - 状态栏Height) * 2 + 胶囊Height
      const navBarHeight = (menuButton.top - statusBarHeight) * 2 + menuButton.height;
      
      this.setData({ 
        statusBarHeight,
        navBarHeight,
        menuButtonHeight: menuButton.height
      });
    }
  },
  methods: {
    onBack() {
      const pages = getCurrentPages();
      if (pages.length > 1) {
        // 正常返回
        wx.navigateBack();
      } else {
        // 单页进入，跳转首页
        wx.switchTab({ url: '/pages/home/index' });
      }
    }
  }
});
```

### Zustand Store 设计

#### 1. copilot.ts (AI 副驾状态)

```typescript
// stores/copilot.ts
import { createStore } from 'zustand/vanilla';

interface CopilotState {
  status: 'idle' | 'thinking' | 'locating' | 'done' | 'error';
  thinkingText: string;
  draft: ActivityDraft | null;
  targetLocation: { lat: number; lng: number } | null;
}

interface CopilotActions {
  setStatus: (status: CopilotState['status']) => void;
  setThinkingText: (text: string) => void;
  setDraft: (draft: ActivityDraft | null) => void;
  setTargetLocation: (location: { lat: number; lng: number } | null) => void;
  reset: () => void;
}

export const copilotStore = createStore<CopilotState & CopilotActions>((set) => ({
  status: 'idle',
  thinkingText: '',
  draft: null,
  targetLocation: null,
  
  setStatus: (status) => set({ status }),
  setThinkingText: (thinkingText) => set({ thinkingText }),
  setDraft: (draft) => set({ draft }),
  setTargetLocation: (targetLocation) => set({ targetLocation }),
  reset: () => set({ status: 'idle', thinkingText: '', draft: null, targetLocation: null }),
}));
```

#### 2. chat.ts (群聊状态)

```typescript
// stores/chat.ts
import { createStore } from 'zustand/vanilla';

interface ChatState {
  messages: ChatMessage[];
  lastMessageId: string | null;
  isPolling: boolean;
  isArchived: boolean;
}

interface ChatActions {
  setMessages: (messages: ChatMessage[]) => void;
  appendMessages: (messages: ChatMessage[]) => void;
  setPolling: (isPolling: boolean) => void;
  setArchived: (isArchived: boolean) => void;
}

export const chatStore = createStore<ChatState & ChatActions>((set, get) => ({
  messages: [],
  lastMessageId: null,
  isPolling: false,
  isArchived: false,
  
  setMessages: (messages) => set({ 
    messages, 
    lastMessageId: messages[messages.length - 1]?.id || null 
  }),
  appendMessages: (newMessages) => {
    const { messages } = get();
    set({ 
      messages: [...messages, ...newMessages],
      lastMessageId: newMessages[newMessages.length - 1]?.id || get().lastMessageId
    });
  },
  setPolling: (isPolling) => set({ isPolling }),
  setArchived: (isArchived) => set({ isArchived }),
}));
```

**Implementation Note (Polling Strategy)**:
- `chatStore` 仅保存 `isPolling` 状态标记，**不保存** `setInterval` 的 ID
- 实际的定时器逻辑必须在 **Page Level** (`subpackages/activity/chat/index.ts`) 实现：
  - `onShow`: 检查 `store.isPolling`，若需要开启，启动 `setInterval` 并保存 `timerId` 到页面实例 (`this.timer`)
  - `onHide` / `onUnload`: 读取 `this.timer` 并执行 `clearInterval`，防止内存泄漏
- 轮询间隔：5-10 秒（可配置）

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### 1. 数据一致性属性

**Property 1: 参与者计数一致性**
*For any* 活动, `currentParticipants` 必须等于 `participants` 表中 `status='joined'` 的记录数
**Validates: Requirements 7.4, 10.2**

**Property 2: 活动创建计数一致性**
*For any* 用户, `activitiesCreatedCount` 必须等于 `activities` 表中该用户创建的记录数
**Validates: Requirements 5.6**

**Property 3: 活动状态约束**
*For any* 状态为 `cancelled` 或 `completed` 的活动, 不允许新增参与者
**Validates: Requirements 7.7, 10.2, 10.3**

### 2. 业务规则属性

**Property 4: 每日发布额度限制**
*For any* 用户, 当日创建活动次数不超过 `aiCreateQuotaToday` (默认 3 次)
**Validates: Requirements 5.7**

**Property 5: 活动管理权限**
*For any* 活动状态更新操作 (completed/cancelled), 只有活动创建者可以执行
**Validates: Requirements 10.1, 10.2, 10.3**

**Property 6: 活动删除约束**
*For any* 活动删除操作, 只有 `active` 状态且未开始的活动可以被删除
**Validates: Requirements 10.5, 10.6**

**Property 7: 群聊归档时机**
*For any* 活动, 当 `now > startAt + 24 小时` 时, API 返回的 `isArchived` 必须为 `true`（动态计算，非存储字段）
**Validates: Requirements 9.7, 9.8**

**Property 8: Location_Hint 必填约束**
*For any* 活动创建请求, `locationHint` 字段不能为空
**Validates: Requirements 5.3**

### 3. 认证规则属性

**Property 9: 延迟验证 - 发布/报名需绑定手机号**
*For any* 未绑定手机号的用户, 尝试发布活动或报名活动时, 必须弹出手机号绑定弹窗
**Validates: Requirements 5.4, 7.2, 13.2, 13.3**

**Property 10: 自我报名禁止**
*For any* 用户, 不能报名自己创建的活动
**Validates: Requirements 7.4**

**Property 11: 游客浏览权限**
*For any* 未登录用户, 可以浏览地图、查看活动详情、尝试 AI 解析
**Validates: Requirements 13.1**

### 4. 前端状态属性

**Property 12: 单页进入返回逻辑**
*For any* 页面栈长度为 1 的情况, 点击返回按钮必须调用 `wx.switchTab` 跳转到首页; 页面栈长度大于 1 时, 调用 `wx.navigateBack`
**Validates: Requirements 7.6, 8.2, 8.3**

**Property 13: 群聊轮询生命周期**
*For any* 群聊页面, 进入后台 (onHide) 时必须停止轮询, 回到前台 (onShow) 时必须立即发起一次请求并恢复轮询
**Validates: Requirements 9.5, 9.6**

**Property 14: 未读消息角标显示**
*For any* 未读消息数量 > 0 的情况, 消息 Tab 必须显示对应数量的角标
**Validates: Requirements 1.4, 11.5**

### 5. AI 解析属性

**Property 15: 防抖机制**
*For any* 用户输入, 停止输入 800ms 后才触发 AI 解析请求; 800ms 内的连续输入不触发请求
**Validates: Requirements 2.6**

**Property 16: 活动类型图标映射**
*For any* Activity_Type, 必须映射到对应的图标 (food→🍲, sports→⚽️, boardgame→🎴, entertainment→🎬, other→📍)
**Validates: Requirements 4.6**

**Property 17: 分享卡片地图参数**
*For any* Share_Card 生成, 地图预览图必须使用 Zoom Level 16, 包含红色 Marker, 比例 5:4
**Validates: Requirements 6.4**

### 6. 通知属性

**Property 18: 活动状态变更通知**
*For any* 活动状态从 `active` 变为 `completed` 或 `cancelled`, 必须向所有参与者发送通知
**Validates: Requirements 10.4, 11.2, 11.3**

### 7. 用户资料属性

**Property 19: 默认资料值**
*For any* 未完善资料的用户, 必须显示默认头像和"匿名搭子"昵称
**Validates: Requirements 12.2, 14.4**

**Property 20: 活动列表过滤**
*For any* "我发布的"列表, 只包含当前用户创建的活动; "我参与的"列表, 只包含当前用户参与的活动
**Validates: Requirements 12.4, 12.5**

---

## Type Definitions

```typescript
// 用户基础信息
interface UserBasic {
  id: string;
  nickname: string | null;
  avatarUrl: string | null;
}

// 用户完整资料
interface UserProfile extends UserBasic {
  phoneNumber: string | null;
  activitiesCreatedCount: number;
  participationCount: number;
}

// 活动草稿 (AI 解析结果)
interface ActivityDraft {
  title: string;
  description?: string;
  locationName: string;
  lat: number;
  lng: number;
  startAt: string;
  type: ActivityType;
  maxParticipants: number;
}

// 活动类型
type ActivityType = 'food' | 'entertainment' | 'sports' | 'boardgame' | 'other';

// 活动状态
type ActivityStatus = 'active' | 'completed' | 'cancelled';

// 参与者状态
type ParticipantStatus = 'joined' | 'quit';

// 群聊消息
interface ChatMessage {
  id: string;
  activityId: string;
  senderId: string | null;
  senderNickname?: string;
  senderAvatarUrl?: string;
  type: 'text' | 'system';
  content: string;
  createdAt: string;
}

// SSE 事件
type SSEEvent = 
  | { type: 'thinking'; data: { message: string } }
  | { type: 'location'; data: { name: string; lat: number; lng: number } }
  | { type: 'draft'; data: ActivityDraft }
  | { type: 'error'; data: { message: string } }
  | { type: 'done' };
```
