# Design Document

## Introduction

本文档定义聚场(JuChang)小程序 v3.0 Chat-First 架构的技术设计，基于 requirements.md 中的 16 个需求。

**设计原则**：
1. **Database First** - `@juchang/db` 是绝对数据源，TypeBox Schema 从 Drizzle 自动派生
2. **Chat-First** - 首页即对话，所有功能封装在 Widget 气泡中
3. **Soft Tech** - 疗愈科技视觉风格，矢车菊蓝 + 空气感渐变 + 实心白卡
4. **AI 友好型实现** - 避免性能陷阱，使用可靠的 CSS 方案

**技术栈**：
| 层级 | 技术选型 | 说明 |
|------|---------|------|
| 渲染引擎 | WebView (默认) | 保持兼容性，新页面可选 Skyline |
| 样式方案 | LESS + CSS Variables | 项目已使用 LESS，保持一致 |
| 组件库 | TDesign (基础组件) | 仅用基础组件，Widget 自定义 |
| 图标库 | Lucide Icons (iconfont) | 线性、简洁、现代 |
| 状态管理 | Zustand Vanilla (^5.0.8) | 已安装，轻量级 |
| 框架 | 原生微信小程序 + TypeScript | 不使用 Taro |
| API SDK | Orval 生成 | 已配置 |

**图标清单 (Lucide)**：
```
导航: menu, more-horizontal, chevron-left, chevron-right
输入: clipboard-paste, mic, send, keyboard
活动: map-pin, clock, users, calendar
类型: utensils (美食), gamepad-2 (娱乐), dumbbell (运动), dice-5 (桌游), circle-dot (其他)
操作: share-2, check, x, edit-2, trash-2
状态: bell, message-circle, check-circle, alert-circle
用户: user, phone, settings, info
```

---

## Architecture Overview

### 页面架构 (7 个物理页面)

```
apps/miniprogram/
├── pages/
│   ├── home/                 # 首页 (Chat-First)
│   ├── profile/              # 个人中心
│   ├── message/              # 消息中心
│   └── chat/                 # 活动群聊 (Lite_Chat)
│
├── subpackages/
│   └── activity/
│       ├── detail/           # 活动详情页
│       ├── confirm/          # 活动确认页
│       ├── list/             # 活动列表页 (通用，参数区分)
│       ├── map-picker/       # 地图选点页
│       └── explore/          # 沉浸式地图页 (Generative UI)
```

### 组件架构

```
apps/miniprogram/components/
├── custom-navbar/            # 自定义导航栏
├── ai-dock/                  # 超级输入坞
├── chat-stream/              # 对话流容器
├── widget-dashboard/         # 进场欢迎卡片
├── widget-draft/             # 意图解析卡片
├── widget-share/             # 创建成功卡片
├── widget-explore/           # 探索卡片 (Generative UI)
├── message-bubble/           # 消息气泡 (用户/AI)
├── activity-mini-card/       # 活动迷你卡片 (用于 Dashboard)
├── activity-list-item/       # 活动列表项 (用于 Explore)
├── dropmenu/                 # 下拉菜单
├── phone-auth-modal/         # 手机号绑定弹窗
├── filter-bar/               # 筛选栏 (用于 Explore Map)
└── profile-modal/            # 资料编辑弹窗
```

---

## Database Schema

### Schema 变更 (v3.0 Chat-First)

为了支持 Chat-First 架构，需要新增一张表并调整活动状态枚举：

| 表 | 说明 | 变更 |
|---|------|------|
| `users` | 用户表：认证 + AI 额度 + 统计 | 不变 |
| `activities` | 活动表：基础信息 + 位置 + 状态 | **状态枚举新增 `draft`** |
| `participants` | 参与者表：报名/退出 | 不变 |
| `home_messages` | **新增：首页 AI 对话流** | 核心新表 |
| `group_messages` | 活动群聊消息表 (原 chat_messages) | **重命名** |
| `notifications` | 通知表 | 不变 |

### 新增表：home_messages (AI 对话流)

这是 v3.0 的视觉核心，存储用户和 AI 的交互历史。

```typescript
// packages/db/src/schema/home_messages.ts
import { pgTable, uuid, varchar, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';
import { activities } from './activities';

// 消息角色枚举
export const homeMessageRoleEnum = pgEnum('home_message_role', ['user', 'ai']);

### 消息类型枚举

```typescript
// 消息类型枚举 (v3.2 新增 widget_explore)
export const homeMessageTypeEnum = pgEnum('home_message_type', [
  'text',              // 普通文本
  'widget_dashboard',  // 进场欢迎卡片
  'widget_draft',      // 意图解析卡片 (带地图选点)
  'widget_share',      // 创建成功卡片
  'widget_explore',    // 探索卡片 (Generative UI)
  'widget_error'       // 错误提示卡片
]);
```

export const homeMessages = pgTable('home_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  
  // 角色：用户说的 or AI 回复的
  role: homeMessageRoleEnum('role').notNull(),
  
  // 类型：Chat-First 的灵魂
  type: homeMessageTypeEnum('type').notNull(),
  
  // 内容：JSONB 存储灵活的卡片数据
  // widget_draft: { title, lat, lng, startAt, type, ... }
  // widget_share: { activityId, title, shareTitle, ... }
  content: jsonb('content').notNull(),
  
  // 关联：如果卡片对应真实活动
  activityId: uuid('activity_id').references(() => activities.id),
  
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// TypeBox Schemas
export const insertHomeMessageSchema = createInsertSchema(homeMessages);
export const selectHomeMessageSchema = createSelectSchema(homeMessages);
export type HomeMessage = typeof homeMessages.$inferSelect;
export type NewHomeMessage = typeof homeMessages.$inferInsert;
```

### 活动状态枚举变更

```typescript
// packages/db/src/schema/enums.ts
export const activityStatusEnum = pgEnum('activity_status', [
  'draft',      // 新增：AI 生成了，用户还没点确认
  'active',     // 用户确认了，正式发布 (地图可见)
  'completed',  // 成局
  'cancelled'   // 取消
]);
```

### 重命名：chat_messages → group_messages

为了区分"两个聊天"场景：
- **Home Chat**: 用户 vs AI (独角戏，存 home_messages)
- **Group Chat**: 用户 vs 用户 (活动群聊，存 group_messages)

```typescript
// packages/db/src/schema/group_messages.ts (原 chat_messages.ts)
export const groupMessages = pgTable('group_messages', {
  // ... 字段不变，仅表名变更 ...
});
```

### 数据流变化

**旧逻辑 (v2.0)**：
```
前端内存存草稿 → 用户提交 → DB 插入 active 活动
```

**新逻辑 (v3.0)**：
```
AI 解析完成 → DB 插入 draft 活动 + home_messages 卡片记录
→ 用户点击确认 → DB 更新活动为 active
```

**为什么 DB 要存 draft？**
- Chat-First 是异步的
- 用户可能今天生成卡片，明天再确认
- 保证 App 有"记忆"，AI 是连贯的

### 查询重心变化

**首页 onLoad 查询**：
```sql
-- 旧版：查活动
SELECT * FROM activities WHERE creator_id = :userId

-- 新版：查对话流
SELECT * FROM home_messages 
WHERE user_id = :userId 
ORDER BY created_at DESC 
LIMIT 20
```

---

## API Interface Definitions

### 模块划分 (v3.2 按功能领域划分)

**设计原则**：API 模块按功能领域划分，而非按页面划分。

| 模块 | 路径前缀 | 职责 |
|------|---------|------|
| `auth` | `/auth` | 微信登录、手机号绑定 |
| `users` | `/users` | 用户资料管理 |
| `activities` | `/activities` | 活动 CRUD、我的活动、**附近活动搜索** |
| `chat` | `/chat` | 活动群聊消息 (group_messages) |
| `ai` | `/ai` | AI 解析 + **AI 对话历史管理** (home_messages) |

**注意**：`home_messages` 表存储的是用户与 AI 的对话历史，属于 AI 功能领域，因此归入 `ai` 模块而非创建独立的 `home` 模块。

### API 接口

```typescript
// Auth
POST /auth/login          // 微信静默登录
POST /auth/bindPhone      // 绑定手机号

// Users
GET  /users/me            // 获取当前用户信息
PATCH /users/me           // 更新用户资料
GET  /users/me/quota      // 获取今日额度

// Activities
POST /activities          // 创建活动 (从 draft 变 active)
GET  /activities/:id      // 获取活动详情
GET  /activities/mine     // 获取我相关的活动 (type=created|joined|archived)
GET  /activities/nearby   // **新增：附近活动搜索** (lat, lng, type?, radius?)
PATCH /activities/:id/status  // 更新活动状态
DELETE /activities/:id    // 删除活动
POST /activities/:id/join // 报名活动
POST /activities/:id/quit // 退出活动

// Chat (活动群聊)
GET  /chat/:activityId/messages  // 获取消息列表
POST /chat/:activityId/messages  // 发送消息

// AI (v3.2 扩展：AI 解析 + 对话历史)
POST /ai/parse            // AI 解析 (SSE 流式响应)
                          // 成功时自动创建 draft 活动 + 对话记录
GET  /ai/conversations    // **新增：获取 AI 对话历史** (分页)
POST /ai/conversations    // **新增：添加用户消息到对话**
DELETE /ai/conversations  // **新增：清空对话历史** (新对话)
```

### AI 解析流程变更

```typescript
// POST /ai/parse 的新行为
// 1. 接收用户输入
// 2. 调用 LLM 解析意图
// 3. 如果解析出活动意图：
//    - 创建 draft 状态的 activity 记录
//    - 创建 widget_draft 类型的对话记录 (home_messages)
// 4. 返回 SSE 流式响应

// GET /ai/conversations 的行为
// 获取当前用户的 AI 对话历史，支持分页
// 返回 home_messages 表中的记录

// POST /ai/conversations 的行为
// 添加用户消息到对话历史
// 用于记录用户发送的文本消息

// DELETE /ai/conversations 的行为
// 清空当前用户的对话历史（开始新对话）
```

---

## Component Architecture

### 1. custom-navbar (自定义导航栏)

```typescript
// components/custom-navbar/index.ts
Component({
  properties: {
    showMenu: { type: Boolean, value: true },
    showMore: { type: Boolean, value: true },
    title: { type: String, value: '聚场' },
    showBack: { type: Boolean, value: false }
  },
  data: {
    statusBarHeight: 0,
    navBarHeight: 0,
    showDropmenu: false
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
    onMenuTap() {
      // 跳转个人中心
      wx.navigateTo({ url: '/pages/profile/index' });
    },
    onMoreTap() {
      // 显示下拉菜单
      this.setData({ showDropmenu: !this.data.showDropmenu });
    },
    onBackTap() {
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

### 2. ai-dock (超级输入坞)

```typescript
// components/ai-dock/index.ts
Component({
  properties: {
    placeholder: { type: String, value: '粘贴文字，或直接告诉我...' }
  },
  data: {
    inputValue: '',
    isFocused: false,
    isRecording: false
  },
  methods: {
    onInput(e: WechatMiniprogram.Input) {
      this.setData({ inputValue: e.detail.value });
      // 防抖 800ms 后触发解析
      this.debounceParseInput(e.detail.value);
    },
    onPasteTap() {
      wx.getClipboardData({
        success: (res) => {
          this.setData({ inputValue: res.data });
          this.triggerEvent('paste', { text: res.data });
        }
      });
    },
    onVoiceTap() {
      // 启动语音识别
      this.setData({ isRecording: true });
      // ... 语音识别逻辑
    },
    onSend() {
      if (!this.data.inputValue.trim()) return;
      this.triggerEvent('send', { text: this.data.inputValue });
      this.setData({ inputValue: '' });
    },
    debounceParseInput: (() => {
      let timer: number | null = null;
      return function(this: any, text: string) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          this.triggerEvent('parse', { text });
        }, 800);
      };
    })()
  }
});
```

### 3. chat-stream (对话流容器)

```typescript
// components/chat-stream/index.ts
Component({
  properties: {
    messages: { type: Array, value: [] }
  },
  data: {
    scrollToMessage: ''
  },
  observers: {
    'messages': function(messages: ChatMessage[]) {
      // 新消息时滚动到底部
      if (messages.length > 0) {
        this.setData({ scrollToMessage: `msg-${messages.length - 1}` });
      }
    }
  }
});
```

### 4. widget-dashboard (进场欢迎卡片)

```typescript
// components/widget-dashboard/index.ts
Component({
  properties: {
    nickname: { type: String, value: '搭子' },
    activities: { type: Array, value: [] }
  },
  data: {
    greeting: ''
  },
  lifetimes: {
    attached() {
      this.updateGreeting();
    }
  },
  methods: {
    updateGreeting() {
      const hour = new Date().getHours();
      const day = new Date().getDay();
      const nickname = this.properties.nickname || '搭子';
      
      let greeting = '';
      if (day === 5 && hour >= 18) {
        greeting = `Hi ${nickname}，周五晚上了，不组个局吗？`;
      } else if (day === 0 || day === 6) {
        greeting = `周末愉快，${nickname}，今天想玩什么？`;
      } else if (hour >= 6 && hour < 12) {
        greeting = `早上好，${nickname}`;
      } else if (hour >= 12 && hour < 18) {
        greeting = `下午好，${nickname}`;
      } else {
        greeting = `晚上好，${nickname}`;
      }
      
      this.setData({ greeting });
    },
    onActivityTap(e: WechatMiniprogram.TouchEvent) {
      const { id } = e.currentTarget.dataset;
      wx.navigateTo({ url: `/subpackages/activity/detail/index?id=${id}` });
    }
  }
});
```

### 5. widget-draft (意图解析卡片)

```typescript
// components/widget-draft/index.ts
Component({
  properties: {
    draft: { type: Object, value: null }
  },
  methods: {
    onAdjustLocation() {
      const { draft } = this.properties;
      wx.navigateTo({
        url: `/subpackages/activity/map-picker/index?lat=${draft.lat}&lng=${draft.lng}`
      });
    },
    onConfirm() {
      this.triggerEvent('confirm', { draft: this.properties.draft });
    }
  }
});
```

### 6. widget-explore (探索卡片 - Generative UI)

**设计理念**：Static Preview + Immersive Expansion（静态预览 + 沉浸式展开）

解决小程序 `<map>` 与 `<scroll-view>` 的手势冲突问题：
- 在 Chat_Stream 中显示静态地图图片（避免手势冲突）
- 点击后展开为全屏可交互地图（沉浸式接管）

```typescript
// components/widget-explore/index.ts
Component({
  properties: {
    // 搜索结果
    results: { 
      type: Array, 
      value: [] as ExploreResult[]
    },
    // 搜索中心点
    center: {
      type: Object,
      value: { lat: 29.5647, lng: 106.5507, name: '观音桥' }
    },
    // 标题
    title: {
      type: String,
      value: '为你找到附近的热门活动'
    }
  },
  data: {
    staticMapUrl: '',
    displayResults: [] as ExploreResult[] // 最多显示 3 个
  },
  observers: {
    'results, center': function(results, center) {
      this.generateStaticMap(results, center);
      this.setData({
        displayResults: results.slice(0, 3)
      });
    }
  },
  methods: {
    // 生成静态地图 URL（带多个 Marker）
    generateStaticMap(results: ExploreResult[], center: { lat: number; lng: number }) {
      const markers = results.slice(0, 5).map((r, i) => 
        `${r.lat},${r.lng}`
      ).join('|');
      
      const isDark = wx.getSystemInfoSync().theme === 'dark';
      const styleId = isDark ? '&styleid=4' : '';
      
      const url = `https://apis.map.qq.com/ws/staticmap/v2/` +
        `?center=${center.lat},${center.lng}` +
        `&zoom=14` +
        `&size=600*300` +
        `&markers=color:0x5B75FB|${markers}` +
        `&key=${TENCENT_MAP_KEY}${styleId}`;
      
      this.setData({ staticMapUrl: url });
    },
    
    // 点击展开沉浸式地图
    onExpandMap() {
      const { results, center } = this.properties;
      // 使用 page-container 或跳转到 explore 页面
      wx.navigateTo({
        url: `/subpackages/activity/explore/index?lat=${center.lat}&lng=${center.lng}&results=${encodeURIComponent(JSON.stringify(results))}`
      });
    },
    
    // 点击活动项
    onActivityTap(e: WechatMiniprogram.TouchEvent) {
      const { id } = e.currentTarget.dataset;
      wx.navigateTo({
        url: `/subpackages/activity/detail/index?id=${id}`
      });
    }
  }
});

// 探索结果类型
interface ExploreResult {
  id: string;
  title: string;
  type: ActivityType;
  lat: number;
  lng: number;
  locationName: string;
  distance: number; // 米
  startAt: string;
  currentParticipants: number;
  maxParticipants: number;
}
```

**WXML 结构**：
```xml
<!-- components/widget-explore/index.wxml -->
<view class="widget-explore soft-card">
  <!-- Header -->
  <view class="explore-header">
    <view class="icon-circle icon-circle--blue">
      <text class="icon icon-map-pin"></text>
    </view>
    <text class="explore-title">{{title}}</text>
  </view>
  
  <!-- 静态地图预览 (Halo Card 核心) -->
  <view class="explore-map-preview" bindtap="onExpandMap">
    <image 
      class="static-map" 
      src="{{staticMapUrl}}" 
      mode="aspectFill"
      binderror="onMapError"
    />
    <view class="map-overlay">
      <text class="map-hint">点击查看完整地图</text>
    </view>
  </view>
  
  <!-- 活动列表 (最多 3 个) -->
  <view class="explore-list">
    <view 
      wx:for="{{displayResults}}" 
      wx:key="id"
      class="explore-item"
      data-id="{{item.id}}"
      bindtap="onActivityTap"
    >
      <view class="item-icon icon-circle icon-circle--{{item.type === 'food' ? 'mint' : 'purple'}}">
        <text class="icon icon-{{item.type}}"></text>
      </view>
      <view class="item-content">
        <text class="item-title">{{item.title}}</text>
        <text class="item-meta">{{item.distance}}m · {{item.startAt}}</text>
      </view>
      <text class="icon icon-chevron-right"></text>
    </view>
  </view>
  
  <!-- Action 按钮 -->
  <view class="explore-action">
    <button class="btn-secondary" bindtap="onExpandMap">
      <text class="icon icon-map"></text>
      <text>展开地图查看更多</text>
    </button>
  </view>
</view>
```

**LESS 样式**：
```less
// components/widget-explore/index.less
.widget-explore {
  padding: 32rpx;
  
  .explore-header {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-bottom: 24rpx;
    
    .explore-title {
      font-size: 32rpx;
      font-weight: 500;
      color: var(--text-main);
    }
  }
  
  .explore-map-preview {
    position: relative;
    border-radius: var(--radius-md);
    overflow: hidden;
    margin-bottom: 24rpx;
    
    .static-map {
      width: 100%;
      height: 300rpx;
    }
    
    .map-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 16rpx;
      background: linear-gradient(transparent, rgba(0,0,0,0.3));
      
      .map-hint {
        color: #FFFFFF;
        font-size: 24rpx;
      }
    }
  }
  
  .explore-list {
    .explore-item {
      display: flex;
      align-items: center;
      padding: 20rpx 0;
      border-bottom: 1rpx solid var(--border-card);
      
      &:last-child {
        border-bottom: none;
      }
      
      .item-content {
        flex: 1;
        margin-left: 16rpx;
        
        .item-title {
          font-size: 28rpx;
          color: var(--text-main);
          display: block;
        }
        
        .item-meta {
          font-size: 24rpx;
          color: var(--text-sub);
          margin-top: 4rpx;
        }
      }
    }
  }
  
  .explore-action {
    margin-top: 24rpx;
    
    .btn-secondary {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8rpx;
      width: 100%;
    }
  }
}
```

---

## Explore Map Page (沉浸式地图页)

**设计理念**：这是 Generative UI 的"沉浸式接管"阶段，用户从 Widget_Explore 点击进入后，静态地图"放大"成全屏可交互地图。

### 页面结构

```
┌─────────────────────────────────────────────────────────┐
│  [←]              探索附近              [筛选]          │  ← Custom Navbar
├─────────────────────────────────────────────────────────┤
│                                                         │
│                    Full Screen Map                      │  ← 全屏可交互地图
│                                                         │
│         📍          📍                                  │  ← Activity Pins
│                📍                                       │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐   │
│  │ ═══════════════════════════════════════════════ │   │  ← 拖拽指示条
│  │                                                 │   │
│  │ 🍲 观音桥火锅局 · 500m · 今晚 19:00         [>] │   │  ← 活动列表
│  │ 🎴 麻将局·3缺1 · 800m · 明天 14:00          [>] │   │
│  │ ⚽ 足球约战 · 1.2km · 周六 15:00             [>] │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │  ← Bottom Sheet
└─────────────────────────────────────────────────────────┘
```

### 页面实现

```typescript
// subpackages/activity/explore/index.ts
Page({
  data: {
    // 地图状态
    latitude: 29.5647,
    longitude: 106.5507,
    markers: [] as MapMarker[],
    
    // 活动列表
    activities: [] as ExploreResult[],
    isLoading: false,
    
    // 筛选
    activeFilter: 'all' as ActivityType | 'all',
    filters: [
      { key: 'all', label: '全部' },
      { key: 'food', label: '美食', icon: 'utensils' },
      { key: 'sports', label: '运动', icon: 'dumbbell' },
      { key: 'boardgame', label: '桌游', icon: 'dice-5' },
      { key: 'entertainment', label: '娱乐', icon: 'gamepad-2' },
    ],
    
    // Bottom Sheet 状态
    sheetHeight: 300, // rpx
    isSheetExpanded: false,
    
    // 选中的活动
    selectedActivity: null as ExploreResult | null,
  },
  
  onLoad(options) {
    const { lat, lng, results } = options;
    
    if (lat && lng) {
      this.setData({
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
      });
    }
    
    if (results) {
      const activities = JSON.parse(decodeURIComponent(results));
      this.setData({ activities });
      this.updateMarkers(activities);
    } else {
      this.loadNearbyActivities();
    }
  },
  
  // 加载附近活动
  async loadNearbyActivities() {
    this.setData({ isLoading: true });
    try {
      const { latitude, longitude, activeFilter } = this.data;
      const res = await getActivitiesNearby({
        lat: latitude,
        lng: longitude,
        type: activeFilter === 'all' ? undefined : activeFilter,
        radius: 5000, // 5km
      });
      
      if (res.status === 200 && res.data) {
        this.setData({ activities: res.data });
        this.updateMarkers(res.data);
      }
    } finally {
      this.setData({ isLoading: false });
    }
  },
  
  // 更新地图 Markers
  updateMarkers(activities: ExploreResult[]) {
    const markers = activities.map((a, index) => ({
      id: index,
      latitude: a.lat,
      longitude: a.lng,
      iconPath: `/assets/icons/pin-${a.type}.png`,
      width: 40,
      height: 50,
      callout: {
        content: a.title,
        display: 'BYCLICK',
        borderRadius: 8,
        padding: 8,
        bgColor: '#FFFFFF',
        color: '#1F2937',
      },
      customCallout: {
        anchorY: 0,
        anchorX: 0,
      },
      activityId: a.id, // 自定义属性
    }));
    
    this.setData({ markers });
  },
  
  // 地图区域变化（拖拽后）
  onRegionChange(e: WechatMiniprogram.MapOnRegionChange) {
    if (e.type === 'end' && e.causedBy === 'drag') {
      // 获取新的中心点
      const mapCtx = wx.createMapContext('exploreMap');
      mapCtx.getCenterLocation({
        success: (res) => {
          this.setData({
            latitude: res.latitude,
            longitude: res.longitude,
          });
          this.loadNearbyActivities();
        }
      });
    }
  },
  
  // 点击 Marker
  onMarkerTap(e: WechatMiniprogram.MapOnMarkerTap) {
    const { markerId } = e;
    const activity = this.data.activities[markerId];
    if (activity) {
      this.setData({ selectedActivity: activity });
    }
  },
  
  // 筛选切换
  onFilterChange(e: WechatMiniprogram.TouchEvent) {
    const { key } = e.currentTarget.dataset;
    this.setData({ activeFilter: key });
    this.loadNearbyActivities();
  },
  
  // 点击活动项
  onActivityTap(e: WechatMiniprogram.TouchEvent) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/subpackages/activity/detail/index?id=${id}`
    });
  },
  
  // 返回（收缩动画）
  onBack() {
    // TODO: 实现收缩动画效果
    wx.navigateBack();
  },
});
```

### WXML 结构

```xml
<!-- subpackages/activity/explore/index.wxml -->
<view class="explore-page">
  <!-- 自定义导航栏 -->
  <custom-navbar 
    title="探索附近" 
    showBack="{{true}}"
    bindback="onBack"
  >
    <view slot="right" class="filter-trigger" bindtap="toggleFilter">
      <text class="icon icon-filter"></text>
    </view>
  </custom-navbar>
  
  <!-- 筛选栏 -->
  <scroll-view class="filter-bar" scroll-x>
    <view 
      wx:for="{{filters}}" 
      wx:key="key"
      class="filter-item {{activeFilter === item.key ? 'active' : ''}}"
      data-key="{{item.key}}"
      bindtap="onFilterChange"
    >
      <text wx:if="{{item.icon}}" class="icon icon-{{item.icon}}"></text>
      <text>{{item.label}}</text>
    </view>
  </scroll-view>
  
  <!-- 全屏地图 -->
  <map
    id="exploreMap"
    class="explore-map"
    latitude="{{latitude}}"
    longitude="{{longitude}}"
    markers="{{markers}}"
    scale="14"
    show-location
    bindregionchange="onRegionChange"
    bindmarkertap="onMarkerTap"
  />
  
  <!-- 选中活动的浮层卡片 -->
  <view wx:if="{{selectedActivity}}" class="selected-card soft-card" bindtap="onActivityTap" data-id="{{selectedActivity.id}}">
    <view class="card-content">
      <text class="card-title">{{selectedActivity.title}}</text>
      <text class="card-meta">{{selectedActivity.distance}}m · {{selectedActivity.startAt}}</text>
    </view>
    <text class="icon icon-chevron-right"></text>
  </view>
  
  <!-- Bottom Sheet 活动列表 -->
  <view class="bottom-sheet" style="height: {{sheetHeight}}rpx">
    <view class="sheet-handle"></view>
    <scroll-view class="sheet-content" scroll-y>
      <view 
        wx:for="{{activities}}" 
        wx:key="id"
        class="activity-item"
        data-id="{{item.id}}"
        bindtap="onActivityTap"
      >
        <view class="item-icon icon-circle icon-circle--{{item.type === 'food' ? 'mint' : 'purple'}}">
          <text class="icon icon-{{item.type}}"></text>
        </view>
        <view class="item-content">
          <text class="item-title">{{item.title}}</text>
          <text class="item-meta">{{item.distance}}m · {{item.locationName}} · {{item.startAt}}</text>
        </view>
        <text class="icon icon-chevron-right"></text>
      </view>
      
      <view wx:if="{{activities.length === 0 && !isLoading}}" class="empty-state">
        <text>附近暂无活动，试试扩大搜索范围？</text>
      </view>
    </scroll-view>
  </view>
</view>
```

---

## AI Intent Classification (意图分类)

**核心逻辑**：AI 需要区分用户的"明确创建意图"和"模糊探索意图"，返回最合适的 Widget 类型。

### 意图分类规则

| 意图类型 | 触发条件 | 返回 Widget |
|---------|---------|-------------|
| 明确创建 | 包含时间 + 地点 + 活动类型 | Widget_Draft |
| 模糊探索 | "附近有什么"、"推荐"、"有什么好玩的" | Widget_Explore |
| 无法识别 | 无法解析意图 | 文本消息（引导重新描述） |

### 示例

| 用户输入 | 意图 | 返回 |
|---------|------|------|
| "明晚观音桥打麻将，3缺1" | 明确创建 | Widget_Draft |
| "周六下午踢球，解放碑" | 明确创建 | Widget_Draft |
| "观音桥附近有什么好玩的活动" | 模糊探索 | Widget_Explore |
| "推荐一下附近的局" | 模糊探索 | Widget_Explore |
| "今天天气怎么样" | 无法识别 | 文本消息 |

### API 响应变更

```typescript
// POST /ai/parse 的响应类型扩展
type AIParseResponse = 
  | { intent: 'create'; widget: 'widget_draft'; data: ActivityDraft & { activityId: string } }
  | { intent: 'explore'; widget: 'widget_explore'; data: ExploreResponse }
  | { intent: 'unknown'; widget: 'text'; data: { message: string } };

interface ExploreResponse {
  center: { lat: number; lng: number; name: string };
  results: ExploreResult[];
  title: string; // "为你找到观音桥附近的 5 个热门活动"
}
```

### SSE 事件扩展

```typescript
// 探索场景的 SSE 事件
type SSEEvent = 
  // 通用
  | { type: 'thinking'; data: { message: string } }
  
  // 创建场景
  | { type: 'location'; data: { name: string; lat: number; lng: number } }
  | { type: 'draft'; data: ActivityDraft & { activityId: string } }
  
  // 探索场景 (新增)
  | { type: 'searching'; data: { message: string; center: { lat: number; lng: number; name: string } } }
  | { type: 'explore'; data: ExploreResponse }
  
  // 通用
  | { type: 'error'; data: { message: string } }
  | { type: 'done' };
```

### 流式渲染策略

**探索场景的渲染顺序**：
1. `thinking` → 显示 "正在理解你的需求..."
2. `searching` → 显示 "正在搜索观音桥附近的活动..."
3. `explore` → 逐步渲染 Widget_Explore：
   - 先显示 Header（"为你找到 5 个热门活动"）
   - 再显示静态地图预览（带 Markers）
   - 最后显示活动列表
4. `done` → 显示 Action 按钮

---

## Zustand Store Design

### 使用模式说明

项目使用 Zustand + Immer + Persist 中间件组合：
- `create` - 创建 store（支持中间件）
- `immer` - 不可变状态更新
- `persist` - 持久化到微信存储

在原生小程序中使用 Zustand 的关键：
1. 使用 `getState()` 获取当前状态
2. 使用 `subscribe()` 订阅变化
3. 在 `onLoad` 中订阅，在 `onUnload` 中取消订阅
4. 状态变化时手动调用 `setData()` 更新页面

### 1. homeStore (首页对话状态)

```typescript
// stores/home.ts
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { persist, createJSONStorage } from 'zustand/middleware'
import { getAiConversations, postAiConversations, deleteAiConversations } from '../api/endpoints/ai/ai'

interface HomeMessage {
  id: string;
  role: 'user' | 'ai';
  type: 'text' | 'widget_dashboard' | 'widget_draft' | 'widget_share' | 'widget_error';
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

interface HomeActions {
  loadMessages: () => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  addUserMessage: (content: string) => Promise<void>;
  addAIMessage: (type: string, content: any, activityId?: string) => void;
  clearMessages: () => Promise<void>;
  setLoading: (loading: boolean) => void;
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
      
      loadMessages: async () => {
        set((state) => { state.isLoading = true })
        try {
          const res = await getHomeMessages({ limit: 20 })
          if (res.status === 200 && res.data) {
            set((state) => {
              state.messages = res.data.items
              state.hasMore = res.data.hasMore
              state.cursor = res.data.cursor
            })
          }
        } finally {
          set((state) => { state.isLoading = false })
        }
      },
      
      loadMoreMessages: async () => {
        const { cursor, hasMore } = get()
        if (!hasMore || !cursor) return
        
        const res = await getHomeMessages({ cursor, limit: 20 })
        if (res.status === 200 && res.data) {
          set((state) => {
            state.messages = [...state.messages, ...res.data.items]
            state.hasMore = res.data.hasMore
            state.cursor = res.data.cursor
          })
        }
      },
      
      addUserMessage: async (content) => {
        // 乐观更新
        const tempMessage: HomeMessage = {
          id: `temp-${Date.now()}`,
          role: 'user',
          type: 'text',
          content: { text: content },
          createdAt: new Date().toISOString()
        }
        set((state) => { state.messages.push(tempMessage) })
        
        // 同步到后端
        await postHomeMessages({ content })
      },
      
      addAIMessage: (type, content, activityId) => {
        const message: HomeMessage = {
          id: `ai-${Date.now()}`,
          role: 'ai',
          type: type as any,
          content,
          activityId,
          createdAt: new Date().toISOString()
        }
        set((state) => { state.messages.push(message) })
      },
      
      clearMessages: async () => {
        await deleteHomeMessages()
        set((state) => {
          state.messages = []
          state.cursor = null
          state.hasMore = true
        })
      },
      
      setLoading: (isLoading) => set((state) => { state.isLoading = isLoading })
    })),
    {
      name: 'home-store',
      storage: createJSONStorage(() => wechatStorage),
      partialize: (state) => ({
        messages: state.messages.slice(-50), // 只缓存最近 50 条
      }),
    }
  )
)
```

### 2. 页面中使用 Store

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
    // 4. 取消订阅，防止内存泄漏
    if (this.unsub) {
      this.unsub()
    }
  },
  
  onSend(e: WechatMiniprogram.CustomEvent) {
    const { text } = e.detail
    useHomeStore.getState().addUserMessage(text)
  },
  
  onClearChat() {
    useHomeStore.getState().clearMessages()
  },
})
```

### 2. userStore (用户状态)

```typescript
// stores/user.ts
import { createStore } from 'zustand/vanilla';

interface UserState {
  user: UserProfile | null;
  isLoggedIn: boolean;
  token: string | null;
}

interface UserActions {
  setUser: (user: UserProfile | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const userStore = createStore<UserState & UserActions>((set) => ({
  user: null,
  isLoggedIn: false,
  token: null,
  
  setUser: (user) => set({ user, isLoggedIn: !!user }),
  setToken: (token) => set({ token }),
  logout: () => set({ user: null, isLoggedIn: false, token: null })
}));
```

---

## Visual Design System: Soft Tech

### 技术实现说明

**Skyline 渲染引擎配置（可选，仅新页面）**：
```json
// 页面级配置 pages/home/index.json
{
  "renderer": "skyline",
  "componentFramework": "glass-easel"
}
```

**CSS Variables 定义（支持深色模式）**：
```less
/* app.less - 语义化变量，自动适配深色模式 */

/* 1. 默认浅色变量 */
page {
  /* 主色 (Brand) - 矢车菊蓝 */
  --color-primary: #5B75FB;
  --color-primary-light: #708DFD;
  --color-primary-dark: #4A63E8;
  
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
  --text-tertiary: #9CA3AF;
  
  /* 语义化卡片样式 */
  --border-card: transparent;
  --shadow-card: 0 8rpx 24rpx rgba(91, 117, 251, 0.06);
  
  /* 圆角 */
  --radius-sm: 16rpx;
  --radius-md: 24rpx;
  --radius-lg: 32rpx;
  --radius-xl: 48rpx;
}

/* 2. 深色模式重写 */
@media (prefers-color-scheme: dark) {
  page {
    --color-primary: #6380FF; /* 稍微提亮 */
    
    --bg-page: #0F172A;       /* Slate-900 深邃蓝黑 */
    --bg-card: #1E293B;       /* Slate-800 深板岩灰 */
    --bg-gradient-top: #1E1B4B; /* 深蓝紫光晕 */
    
    --text-main: #F1F5F9;     /* Slate-100 亮灰白 */
    --text-sub: #94A3B8;      /* Slate-400 淡蓝灰 */
    --text-tertiary: #64748B;
    
    /* 深色模式：边框代替阴影 */
    --border-card: 1px solid rgba(255, 255, 255, 0.1);
    --shadow-card: none;
  }
}
```

### 配色方案

| 用途 | 变量名 | 色值 | 说明 |
|------|--------|------|------|
| 主色 | --color-primary | #5B75FB | 用户气泡、主按钮、发送按钮 |
| 主色浅 | --color-primary-light | #708DFD | 渐变终点 |
| 主色深 | --color-primary-dark | #4A63E8 | Active 状态 |
| 淡蓝 | --color-blue-light | #93C5FD | Widget 图标底色 |
| 淡紫 | --color-purple-light | #C4B5FD | Widget 图标底色 |
| 薄荷青 | --color-mint-light | #6EE7B7 | Widget 图标底色 |
| 背景顶部 | --color-bg-top | #E6EFFF | 空气感渐变起点 |
| 背景主体 | --color-bg-main | #F5F7FA | 空气感渐变终点 |
| 主文字 | --color-text-primary | #1F2937 | 标题、正文 |
| 次文字 | --color-text-secondary | #6B7280 | 描述、时间 |
| 三级文字 | --color-text-tertiary | #9CA3AF | Placeholder |

### 卡片样式 (Soft Card - 自动适配深色模式)

```less
/* 实心白卡 - 使用语义化变量 */
.soft-card {
  background: var(--bg-card);
  color: var(--text-main);
  border: var(--border-card);
  box-shadow: var(--shadow-card);
  border-radius: var(--radius-lg);
}

/* 页面背景 - 空气感渐变 */
.page-bg {
  background: linear-gradient(180deg, 
    var(--bg-gradient-top) 0%, 
    var(--bg-page) 30%, 
    var(--bg-page) 100%
  );
  min-height: 100vh;
}

/* 用户消息气泡 */
.user-bubble {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
  color: #FFFFFF;
  border-radius: var(--radius-lg) var(--radius-lg) var(--radius-sm) var(--radius-lg);
  padding: 24rpx 32rpx;
}

/* AI 消息气泡 */
.ai-bubble {
  background: transparent;
  color: var(--text-main);
  border-radius: var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm);
  padding: 24rpx 32rpx;
}

/* 主按钮 */
.btn-primary {
  background: var(--color-primary);
  color: #FFFFFF;
  border-radius: var(--radius-md);
  padding: 24rpx 48rpx;
  font-weight: 500;
}

/* 次按钮 */
.btn-secondary {
  background: transparent;
  color: var(--color-primary);
  border: 2rpx solid var(--color-primary);
  border-radius: var(--radius-md);
  padding: 24rpx 48rpx;
}

/* 同色系淡色图标容器 */
.icon-circle {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.icon-circle--blue { background: rgba(147, 197, 253, 0.3); }
.icon-circle--purple { background: rgba(196, 181, 253, 0.3); }
.icon-circle--mint { background: rgba(110, 231, 183, 0.3); }
```

### 静态地图深色模式适配

```typescript
// 根据系统主题切换地图样式
const isDark = wx.getSystemInfoSync().theme === 'dark';
const mapStyleId = isDark ? '&styleid=4' : ''; // 4 是腾讯地图深色样式 ID
const staticMapUrl = `https://apis.map.qq.com/ws/staticmap/v2/?...${mapStyleId}`;
```

### 图标字体 (Lucide Icons)

```css
/* iconfont 引入 */
@font-face {
  font-family: 'juchang-icons';
  src: url('/assets/fonts/juchang-icons.woff2') format('woff2');
}

.icon {
  font-family: 'juchang-icons';
  font-size: 40rpx;
  font-style: normal;
  color: var(--color-text-secondary);
}

.icon-primary { color: var(--color-primary); }
.icon-blue { color: #3B82F6; }
.icon-purple { color: #8B5CF6; }
.icon-mint { color: #10B981; }
.icon-white { color: #FFFFFF; }
```

### 空气感背景

```less
/* pages/home/index.less */
.home-page {
  min-height: 100vh;
  background: linear-gradient(180deg, 
    var(--bg-gradient-top) 0%, 
    var(--bg-page) 30%, 
    var(--bg-page) 100%
  );
}
```

**效果说明**：
- 浅色模式：顶部淡蓝紫光晕 → 浅灰白
- 深色模式：顶部深蓝紫光晕 → 深邃蓝黑
- 自动适配，无需额外代码

---

## Type Definitions

```typescript
// types/index.ts

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
  locationHint: string;
  lat: number;
  lng: number;
  startAt: string;
  type: ActivityType;
  maxParticipants: number;
}

// 活动类型
type ActivityType = 'food' | 'entertainment' | 'sports' | 'boardgame' | 'other';

// 活动状态 (v3.0 新增 draft)
type ActivityStatus = 'draft' | 'active' | 'completed' | 'cancelled';

// 首页消息角色
type HomeMessageRole = 'user' | 'ai';

// 首页消息类型 (v3.2 新增 widget_explore)
type HomeMessageType = 
  | 'text'              // 普通文本
  | 'widget_dashboard'  // 进场欢迎卡片
  | 'widget_draft'      // 意图解析卡片
  | 'widget_share'      // 创建成功卡片
  | 'widget_explore'    // 探索卡片 (Generative UI)
  | 'widget_error';     // 错误提示卡片

// 首页消息 (对应 home_messages 表)
interface HomeMessage {
  id: string;
  userId: string;
  role: HomeMessageRole;
  type: HomeMessageType;
  content: HomeMessageContent;
  activityId?: string;
  createdAt: string;
}

// 消息内容 (JSONB)
type HomeMessageContent = 
  | { text: string }                                    // text
  | { greeting: string; activities: ActivityMini[] }    // widget_dashboard
  | ActivityDraft                                       // widget_draft
  | { activityId: string; shareTitle: string }          // widget_share
  | ExploreContent                                      // widget_explore (新增)
  | { message: string };                                // widget_error

// 探索卡片内容 (Generative UI)
interface ExploreContent {
  title: string;                    // "为你找到观音桥附近的 5 个热门活动"
  center: {
    lat: number;
    lng: number;
    name: string;
  };
  results: ExploreResult[];
}

// 探索结果项
interface ExploreResult {
  id: string;
  title: string;
  type: ActivityType;
  lat: number;
  lng: number;
  locationName: string;
  distance: number;                 // 米
  startAt: string;
  currentParticipants: number;
  maxParticipants: number;
}

// 活动迷你卡片 (用于 Dashboard)
interface ActivityMini {
  id: string;
  title: string;
  type: ActivityType;
  startAt: string;
  locationName: string;
}

// SSE 事件
type SSEEvent = 
  | { type: 'thinking'; data: { message: string } }
  | { type: 'location'; data: { name: string; lat: number; lng: number } }
  | { type: 'draft'; data: ActivityDraft & { activityId: string } }
  | { type: 'error'; data: { message: string } }
  | { type: 'done' };
```

---

## Page Flow

### 首页交互流程 (创建场景)

```
用户打开 App
    ↓
显示 Widget_Dashboard (问候语 + 待参加活动)
    ↓
用户输入文本 / 点击粘贴
    ↓
显示用户消息气泡 (右侧)
    ↓
调用 AI 解析 API (SSE)
    ↓
显示 AI 思考态 ("收到，正在解析...")
    ↓
AI 解析完成 (明确创建意图)
    ↓
显示 Widget_Draft (意图解析卡片)
    ↓
用户点击 [确认发布]
    ↓
检查手机号绑定状态
    ↓
跳转活动确认页
    ↓
用户确认发布
    ↓
返回首页，显示 Widget_Share (创建成功卡片)
```

### 首页交互流程 (探索场景 - Generative UI)

```
用户打开 App
    ↓
显示 Widget_Dashboard (问候语 + 待参加活动)
    ↓
用户输入探索性问题 ("观音桥附近有什么好玩的")
    ↓
显示用户消息气泡 (右侧)
    ↓
调用 AI 解析 API (SSE)
    ↓
显示 AI 思考态 ("正在理解你的需求...")
    ↓
显示 AI 搜索态 ("正在搜索观音桥附近的活动...")
    ↓
AI 返回探索结果
    ↓
逐步渲染 Widget_Explore (Halo Card):
  1. Header ("为你找到 5 个热门活动")
  2. 静态地图预览 (带 Markers)
  3. 活动列表 (2-3 个)
  4. Action 按钮 ([🗺️ 展开地图])
    ↓
用户点击 Widget_Explore 或 [🗺️ 展开地图]
    ↓
沉浸式展开 → 全屏可交互地图
    ↓
用户在地图上探索、筛选、点击 Pin
    ↓
用户点击活动 → 跳转活动详情页
    ↓
用户点击 [收起] → 收缩动画返回 Chat_Stream
```

### 分享卡片进入流程

```
用户点击微信群中的分享卡片
    ↓
打开活动详情页 (页面栈长度 = 1)
    ↓
用户点击返回
    ↓
Custom_Navbar 检测页面栈长度
    ↓
调用 wx.reLaunch 跳转首页
    ↓
显示 Widget_Dashboard
```



---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### 1. 消息对齐属性

**Property 1: 消息气泡对齐一致性**
*For any* 消息在 Chat_Stream 中渲染时，用户消息必须右侧对齐，AI 消息必须左侧对齐
**Validates: Requirements 3.1**

### 2. 问候语生成属性

**Property 2: 时间感知问候语**
*For any* 时间点，Widget_Dashboard 的问候语必须符合以下规则：
- 周五 18:00 后 → "Hi [昵称]，周五晚上了，不组个局吗？"
- 周末 → "周末愉快，[昵称]，今天想玩什么？"
- 6:00-12:00 → "早上好，[昵称]"
- 12:00-18:00 → "下午好，[昵称]"
- 18:00-6:00 → "晚上好，[昵称]"
**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

### 3. 活动卡片数量限制

**Property 3: Dashboard 活动卡片上限**
*For any* 用户的待参加活动数量 N，Widget_Dashboard 显示的活动卡片数量必须为 min(N, 3)
**Validates: Requirements 4.6**

### 4. 防抖机制属性

**Property 4: 输入防抖一致性**
*For any* 用户输入序列，只有在停止输入 800ms 后才触发 AI 解析请求；800ms 内的连续输入不触发请求
**Validates: Requirements 5.8**

### 5. 轮询生命周期属性

**Property 5: 群聊轮询生命周期**
*For any* Lite_Chat 页面，进入后台 (onHide) 时必须停止轮询，回到前台 (onShow) 时必须立即发起一次请求并恢复轮询
**Validates: Requirements 11.5, 11.6**

### 6. 延迟验证属性

**Property 6: 手机号绑定触发**
*For any* 未绑定手机号的用户，尝试发布活动或报名活动时，必须弹出手机号绑定弹窗
**Validates: Requirements 12.2, 12.3**

### 7. 页面栈导航属性

**Property 7: 返回导航逻辑**
*For any* 页面栈长度为 1 的情况，点击返回按钮必须调用 wx.reLaunch 跳转到首页；页面栈长度大于 1 时，调用 wx.navigateBack 正常返回
**Validates: Requirements 14.2, 14.3**

### 8. 活动管理权限属性

**Property 8: 活动状态更新权限**
*For any* 活动状态更新操作 (completed/cancelled)，只有活动创建者可以执行
**Validates: Requirements 16.2, 16.3**

### 9. 群聊归档属性

**Property 9: 群聊归档时机**
*For any* 活动，当 `now > startAt + 24 小时` 时，Lite_Chat 必须变为只读/归档状态
**Validates: Requirements 11.7, 11.8**

### 10. 未读消息显示属性

**Property 10: 未读消息角标**
*For any* 群聊项，未读消息数量 > 0 时必须显示对应数量的角标
**Validates: Requirements 9.4**

### 11. 意图分类属性

**Property 11: AI 意图分类一致性**
*For any* 用户输入，如果包含明确的时间、地点、活动类型信息，AI 必须返回 Widget_Draft；如果包含探索性关键词（"附近有什么"、"推荐"、"有什么好玩的"），AI 必须返回 Widget_Explore
**Validates: Requirements 19.1, 19.2**

### 12. 探索卡片静态地图属性

**Property 12: Widget_Explore 地图静态性**
*For any* Widget_Explore 在 Chat_Stream 中渲染时，地图预览必须为静态图片（非可交互 map 组件），以避免手势冲突
**Validates: Requirements 17.3**

### 13. 沉浸式地图展开属性

**Property 13: 探索地图沉浸式展开**
*For any* Widget_Explore 点击事件，必须触发沉浸式地图页展开，而非标准页面跳转动画
**Validates: Requirements 17.4, 18.8**

### 14. 地图区域变化加载属性

**Property 14: 地图拖拽自动加载**
*For any* 沉浸式地图页的地图拖拽操作，拖拽结束后必须自动加载新区域的活动数据
**Validates: Requirements 18.5**

### 15. 草稿过期校验属性

**Property 15: 草稿过期发布拦截**
*For any* `draft` 状态的活动，当 `startAt < now` 时，后端必须拒绝发布请求（返回 400 错误），前端必须显示灰色禁用状态
**Validates: Requirements 6.8, CP-19**

---

## Error Handling

### API 错误处理

| 错误类型 | 处理方式 |
|---------|---------|
| 网络错误 | 显示 Toast "网络异常，请重试" |
| 401 未授权 | 清除 token，重新静默登录 |
| 403 无权限 | 显示 Toast "无权限执行此操作" |
| 404 资源不存在 | 跳转到 404 页面 |
| 500 服务器错误 | 显示 Toast "服务器繁忙，请稍后重试" |

### AI 解析错误处理

| 错误类型 | 处理方式 |
|---------|---------|
| 解析失败 | 显示 AI 消息 "抱歉，我没理解你的意思，试试换个说法？" |
| 超时 | 显示 AI 消息 "思考超时了，请重试" |
| 额度用尽 | 显示 AI 消息 "今日 AI 创建额度已用完，明天再来吧" |

---

## Testing Strategy

### 单元测试

- 问候语生成函数 (getGreeting)
- 防抖函数 (debounce)
- 页面栈导航逻辑 (handleBack)
- 时间计算函数 (isArchived)

### 属性测试

使用 fast-check 进行属性测试：

1. **问候语属性测试**：生成随机时间点，验证问候语符合规则
2. **防抖属性测试**：生成随机输入序列，验证只有最后一次触发解析
3. **活动卡片数量测试**：生成随机活动数量，验证显示数量 ≤ 3

### 集成测试

- 首页加载流程
- AI 解析流程
- 活动创建流程
- 分享卡片进入流程

---

## Implementation Notes

### 性能优化

1. **空气感背景**：使用 CSS linear-gradient，避免图片加载
2. **卡片样式**：使用纯白 + box-shadow，无 backdrop-filter
3. **消息列表**：使用虚拟滚动优化长列表性能
4. **图片懒加载**：地图切片使用 lazy-load
5. **Widget_Explore 静态地图**：使用腾讯地图静态图 API，避免 map 组件在 scroll-view 中的手势冲突

### 小程序限制

1. **剪贴板**：必须用户主动触发，不能静默读取
2. **分享**：只能使用 onShareAppMessage，不能自动触发
3. **导航**：页面栈最多 10 层，需要合理规划
4. **map 组件**：原生组件层级最高，不能在 scroll-view 中嵌入可交互地图

### 🚨 Generative UI 实现要点

#### 1. Static Preview + Immersive Expansion 模式
- **问题**：`<map>` 是原生组件，层级最高，与 `<scroll-view>` 存在手势冲突
- **解决**：Widget_Explore 在 Chat_Stream 中使用静态地图图片，点击后展开为全屏可交互地图
- **动效**：使用 `page-container` 或自定义动画实现"卡片放大"效果，而非标准页面跳转

#### 2. 意图分类的 Prompt Engineering
- 明确创建意图：包含时间 + 地点 + 活动类型
- 模糊探索意图：包含"附近"、"推荐"、"有什么好玩的"等关键词
- 需要在 AI 服务端实现意图分类逻辑

#### 3. 流式渲染的分阶段策略
- Widget_Explore 需要分阶段渲染：Header → Map → List → Action
- 使用 SSE 事件控制渲染节奏
- 避免一次性渲染大量内容导致卡顿

#### 4. 地图 Markers 的性能优化
- 限制同时显示的 Markers 数量（建议 ≤ 20 个）
- 使用聚合算法合并密集的 Markers
- 地图拖拽时使用防抖加载新数据

### 🚨 实战关键点 (Implementation Checklist)

#### 1. 键盘顶起页面的"跳动"问题
- 在 ai-dock 组件中监听 `bindfocus` 获取键盘高度
- 设置 `adjust-position="{{false}}"` 禁用默认推页面
- 手动给 Chat Stream 容器加 `padding-bottom`，高度 = 键盘高度 + 输入坞高度
- 键盘弹起/收起时平滑过渡

#### 2. SSE 流式渲染的"粘包"处理
- 维护一个 buffer 字符串
- 收到 chunk 后拼接到 buffer
- 按 `\n\n` 分割，能 parse 成功的就渲染
- 不能 parse 的留着等下一个 chunk
- 处理半个汉字（乱码）的情况

#### 3. 草稿的"时效性"与"修改权"
- 后端发布接口校验时间，过去时间报错
- 活动确认页必须允许修改时间和标题
- Draft Card 过期后显示"已过期"状态

#### 6. 分享卡片落地页逻辑
**场景**：用户从分享卡片进入活动详情页，没有对话历史。

**实现要点**：
- 分享卡片进入时，页面栈长度为 1
- 点击返回时，调用 `wx.reLaunch('/pages/home/index')` 跳转首页
- 首页 Chat_Stream 为空，显示 Widget_Dashboard
- **MVP**：使用默认问候语即可
- **优化（可选）**：通过 URL 参数 `?from=share&activityId=xxx` 识别来源，显示定制问候语："看完活动了？要不你也来组一个？"

```typescript
// custom-navbar 返回逻辑
onBack() {
  const pages = getCurrentPages();
  if (pages.length > 1) {
    wx.navigateBack();
  } else {
    // 单页进入（如分享卡片），返回首页
    wx.reLaunch({ url: '/pages/home/index' });
  }
}
```

#### 7. 草稿过期处理 (Widget_Draft)
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

```typescript
// 前端判断草稿是否过期
const isExpired = (draft: ActivityDraft) => {
  return new Date(draft.startAt) < new Date();
};
```

```xml
<!-- widget-draft/index.wxml -->
<view class="widget-draft soft-card {{isExpired ? 'expired' : ''}}">
  <view wx:if="{{isExpired}}" class="expired-badge">已过期</view>
  <!-- ... 其他内容 ... -->
  <button 
    class="btn-primary" 
    disabled="{{isExpired}}"
    bindtap="onConfirm"
  >
    {{isExpired ? '活动已过期' : '确认发布'}}
  </button>
</view>
```

```less
// widget-draft/index.less
.widget-draft.expired {
  opacity: 0.6;
  
  .expired-badge {
    position: absolute;
    top: 16rpx;
    right: 16rpx;
    background: var(--text-sub);
    color: #FFFFFF;
    font-size: 24rpx;
    padding: 4rpx 12rpx;
    border-radius: var(--radius-sm);
  }
}
```

#### 4. 深色模式支持 (Dark Mode)
- **从 Day 1 支持**：使用语义化 CSS 变量，一套代码适配两种模式
- 浅色模式：靠阴影区分层级
- 深色模式：靠亮度区分层级（深蓝灰背景 #0F172A，非纯黑）
- 深色模式卡片加 1px 淡边框，去阴影
- 静态地图使用 styleid 参数切换深色样式
- 图标颜色使用 CSS 变量，不写死

**语义化配色映射**：
| Token | 🌞 Light | 🌙 Dark |
|-------|----------|---------|
| --bg-page | #F5F7FA | #0F172A |
| --bg-card | #FFFFFF | #1E293B |
| --text-main | #1F2937 | #F1F5F9 |
| --text-sub | #6B7280 | #94A3B8 |
| --border-card | transparent | rgba(255,255,255,0.1) |
| --shadow-card | 0 8rpx 24rpx rgba(...) | none |
| --bg-gradient-top | #E6EFFF | #1E1B4B |

#### 5. 静态地图的额度与兜底
- `<image>` 组件加上 `binderror` 事件
- 加载失败时显示默认插画背景
- 避免裂图影响用户体验

### 与蚂蚁阿福的对齐

| 功能 | 蚂蚁阿福 | 聚场 v3.2 |
|------|---------|----------|
| 背景 | 空气感渐变 | 空气感渐变 (顶部淡蓝 → 浅灰白) |
| 卡片 | 实心白卡 | 实心白卡 (纯白 + 大圆角 + 柔和阴影) |
| 主色 | 蓝紫色系 | 矢车菊蓝 #5B75FB |
| 图标底色 | 同色系淡色 | 淡蓝/淡紫/薄荷青 (同色系) |
| 剪贴板 | 自动检测 | 手动粘贴按钮 |
| **Generative UI** | App-in-Chat | Widget_Explore + 沉浸式地图 |
| **意图分类** | 多意图识别 | 创建 vs 探索 双轨分类 |
| **复杂交互** | 内嵌式应用 | Static Preview + Immersive Expansion |
| **复合型卡片** | AI拍皮肤 (Header+Body+Footer) | Widget_Launcher (组局发射台) |

---

## Design System Upgrade: Composite Widgets (v3.3)

### 设计理念

参考蚂蚁阿福的"AI拍皮肤"卡片，我们引入 **Composite Widget (复合型卡片)** 设计结构。

**核心理念**：对话流不仅可以传输信息，还可以投送"功能控制台"。

**三层结构**：
```
┌─────────────────────────────────────────────────────────┐
│  [Header] 场景定义                                       │
│  图标 + 标题 + 标签                                      │
├─────────────────────────────────────────────────────────┤
│  [Body] 核心功能区 (Flex Row)                            │
│  ┌─────────────────┐  ┌─────────────────┐               │
│  │  📝 极速建局     │  │  🗺️ 探索附近     │               │
│  │  粘贴群接龙文本  │  │  在地图上找灵感  │               │
│  │  [📋 粘贴文本]  │  │  [📍 打开地图]  │               │
│  └─────────────────┘  └─────────────────┘               │
├─────────────────────────────────────────────────────────┤
│  [Footer] 辅助工具区 (Grid)                              │
│  [🎲 掷骰子]  [💰 AA计算]  [🗳️ 发起投票]                 │
└─────────────────────────────────────────────────────────┘
```

### 新增组件：widget-launcher (组局发射台)

**触发场景**：
- 用户意图模糊："我要组个局"、"今晚去哪玩？"
- 首次进入 App 时作为 Widget_Dashboard 的升级版

**设计目标**：
- 功能外露：用户可能不知道有"粘贴解析"或"AA收款"功能，平铺曝光
- 操作手感：点点点就能完成，无需打字思考
- 高级感：复杂卡片一弹出来，用户觉得"这个 AI 很强"

### 组件实现

```typescript
// components/widget-launcher/index.ts
Component({
  properties: {
    // 是否显示辅助工具区
    showTools: { type: Boolean, value: true },
    // 自定义标题
    title: { type: String, value: '发起活动' },
    // 标签
    badge: { type: String, value: 'AI 辅助中' }
  },
  data: {
    tools: [
      { key: 'dice', icon: 'dice-5', label: '掷骰子' },
      { key: 'aa', icon: 'calculator', label: 'AA计算' },
      { key: 'vote', icon: 'vote', label: '发起投票' }
    ]
  },
  methods: {
    // 极速建局 - 粘贴文本
    onPasteTap() {
      wx.getClipboardData({
        success: (res) => {
          if (res.data && res.data.trim()) {
            this.triggerEvent('paste', { text: res.data });
          } else {
            wx.showToast({ title: '剪贴板为空', icon: 'none' });
          }
        },
        fail: () => {
          wx.showToast({ title: '读取剪贴板失败', icon: 'none' });
        }
      });
    },
    
    // 探索附近 - 打开地图
    onExploreTap() {
      this.triggerEvent('explore');
    },
    
    // 辅助工具点击
    onToolTap(e: WechatMiniprogram.TouchEvent) {
      const { key } = e.currentTarget.dataset;
      this.triggerEvent('tool', { key });
    }
  }
});
```

### WXML 结构

```xml
<!-- components/widget-launcher/index.wxml -->
<view class="widget-launcher halo-card">
  <!-- Header: 场景定义 -->
  <view class="launcher-header">
    <view class="header-left">
      <view class="icon-circle icon-circle--blue">
        <text class="icon icon-party-popper"></text>
      </view>
      <text class="header-title">{{title}}</text>
    </view>
    <view class="header-badge" wx:if="{{badge}}">
      <text class="badge-dot"></text>
      <text class="badge-text">{{badge}}</text>
    </view>
  </view>
  
  <!-- Body: 核心功能区 (双栏布局) -->
  <view class="launcher-body">
    <!-- 左侧：极速建局 -->
    <view class="action-card" bindtap="onPasteTap">
      <view class="action-icon">
        <text class="icon icon-zap"></text>
      </view>
      <view class="action-content">
        <text class="action-title">极速建局</text>
        <text class="action-desc">粘贴群接龙文本，AI 一键提取</text>
      </view>
      <button class="action-btn btn-secondary">
        <text class="icon icon-clipboard"></text>
        <text>粘贴文本</text>
      </button>
    </view>
    
    <!-- 右侧：探索附近 -->
    <view class="action-card" bindtap="onExploreTap">
      <view class="action-icon">
        <text class="icon icon-map"></text>
      </view>
      <view class="action-content">
        <text class="action-title">探索附近</text>
        <text class="action-desc">不知道去哪？在地图上找找灵感</text>
      </view>
      <button class="action-btn btn-secondary">
        <text class="icon icon-map-pin"></text>
        <text>打开地图</text>
      </button>
    </view>
  </view>
  
  <!-- Footer: 辅助工具区 (网格布局) -->
  <view class="launcher-footer" wx:if="{{showTools}}">
    <view 
      wx:for="{{tools}}" 
      wx:key="key"
      class="tool-item"
      data-key="{{item.key}}"
      bindtap="onToolTap"
    >
      <view class="tool-icon icon-circle icon-circle--mint">
        <text class="icon icon-{{item.icon}}"></text>
      </view>
      <text class="tool-label">{{item.label}}</text>
    </view>
  </view>
</view>
```

### LESS 样式

```less
// components/widget-launcher/index.less
.widget-launcher {
  padding: 32rpx;
  
  // Header
  .launcher-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32rpx;
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 16rpx;
      
      .header-title {
        font-size: 36rpx;
        font-weight: 600;
        color: var(--text-main);
      }
    }
    
    .header-badge {
      display: flex;
      align-items: center;
      gap: 8rpx;
      padding: 8rpx 16rpx;
      background: rgba(91, 117, 251, 0.1);
      border-radius: var(--radius-sm);
      
      .badge-dot {
        width: 12rpx;
        height: 12rpx;
        background: var(--color-primary);
        border-radius: 50%;
        animation: pulse 2s infinite;
      }
      
      .badge-text {
        font-size: 24rpx;
        color: var(--color-primary);
      }
    }
  }
  
  // Body: 双栏布局
  .launcher-body {
    display: flex;
    gap: 24rpx;
    margin-bottom: 32rpx;
    
    .action-card {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 24rpx;
      background: var(--bg-page);
      border-radius: var(--radius-md);
      border: 1rpx solid var(--border-card);
      
      .action-icon {
        margin-bottom: 16rpx;
        
        .icon {
          font-size: 48rpx;
          color: var(--color-primary);
        }
      }
      
      .action-content {
        flex: 1;
        margin-bottom: 16rpx;
        
        .action-title {
          display: block;
          font-size: 28rpx;
          font-weight: 500;
          color: var(--text-main);
          margin-bottom: 8rpx;
        }
        
        .action-desc {
          display: block;
          font-size: 24rpx;
          color: var(--text-sub);
          line-height: 1.4;
        }
      }
      
      .action-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8rpx;
        padding: 16rpx 24rpx;
        font-size: 26rpx;
      }
    }
  }
  
  // Footer: 网格布局
  .launcher-footer {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24rpx;
    padding-top: 24rpx;
    border-top: 1rpx solid var(--border-card);
    
    .tool-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12rpx;
      padding: 16rpx;
      border-radius: var(--radius-md);
      transition: background 0.2s;
      
      &:active {
        background: rgba(0, 0, 0, 0.05);
      }
      
      .tool-icon {
        width: 72rpx;
        height: 72rpx;
      }
      
      .tool-label {
        font-size: 24rpx;
        color: var(--text-sub);
      }
    }
  }
}

// 脉冲动画
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

### Halo Card 样式 (渐变边框效果)

```less
// app.less - 全局 Halo Card mixin
.halo-card {
  position: relative;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  
  // 渐变边框效果 (使用 background-origin/clip)
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    padding: 2rpx;
    border-radius: var(--radius-lg);
    background: linear-gradient(
      135deg, 
      rgba(91, 117, 251, 0.3) 0%, 
      rgba(147, 197, 253, 0.2) 50%,
      rgba(196, 181, 253, 0.3) 100%
    );
    -webkit-mask: 
      linear-gradient(#fff 0 0) content-box, 
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }
}

// 深色模式下的 Halo Card
@media (prefers-color-scheme: dark) {
  .halo-card::before {
    background: linear-gradient(
      135deg, 
      rgba(99, 128, 255, 0.4) 0%, 
      rgba(147, 197, 253, 0.3) 50%,
      rgba(196, 181, 253, 0.4) 100%
    );
  }
}
```

### 消息类型枚举更新

```typescript
// 消息类型枚举 (v3.3 新增 widget_launcher)
export const homeMessageTypeEnum = pgEnum('home_message_type', [
  'text',              // 普通文本
  'widget_dashboard',  // 进场欢迎卡片 (简化版)
  'widget_launcher',   // **新增：组局发射台 (复合型卡片)**
  'widget_draft',      // 意图解析卡片 (带地图选点)
  'widget_share',      // 创建成功卡片
  'widget_explore',    // 探索卡片 (Generative UI)
  'widget_error'       // 错误提示卡片
]);
```

### 意图分类更新

| 意图类型 | 触发条件 | 返回 Widget |
|---------|---------|-------------|
| 明确创建 | 包含时间 + 地点 + 活动类型 | Widget_Draft |
| 模糊探索 | "附近有什么"、"推荐"、"有什么好玩的" | Widget_Explore |
| **模糊创建** | "我要组个局"、"今晚去哪玩" | **Widget_Launcher** |
| 无法识别 | 无法解析意图 | 文本消息（引导重新描述） |

### 使用场景

**场景 1：首次进入 App**
```
用户打开 App
    ↓
显示 Widget_Launcher (组局发射台)
    ↓
用户点击 [📋 粘贴文本]
    ↓
读取剪贴板，调用 AI 解析
    ↓
显示 Widget_Draft
```

**场景 2：模糊意图**
```
用户输入 "我要组个局"
    ↓
AI 识别为模糊创建意图
    ↓
显示 Widget_Launcher (组局发射台)
    ↓
用户选择 [📍 打开地图] 或 [📋 粘贴文本]
```

**场景 3：辅助工具**
```
用户点击 [🎲 掷骰子]
    ↓
弹出掷骰子动画
    ↓
显示结果 "🎲 点数：5，今晚你请客！"
```

### 为什么这对聚场很重要

1. **功能外露**：用户可能不知道有"AA收款"或"粘贴解析"功能，平铺曝光率提升 100%
2. **操作手感**：用户不需要打字，不需要思考，直接点点点就能完成操作
3. **高级感**：复杂的卡片一弹出来，用户会觉得"哇，这个 AI 很强"，而不是"这只是个聊天机器人"

---

## Simple Widget: widget_action (快捷操作按钮)

### 设计理念

不是所有场景都需要复杂的 Composite Widget。有时候 AI 只需要给用户一个简单的跳转按钮，但依然要保持 Halo Card 的高级感。

**使用场景**：
- "帮我看看我发布的活动" → 跳转到"我发布的"列表
- "打开消息中心" → 跳转到消息页面
- "查看活动详情" → 跳转到指定活动

### 消息类型枚举更新

```typescript
// 消息类型枚举 (v3.3 完整版)
export const homeMessageTypeEnum = pgEnum("home_message_type", [
  "text",              // 普通文本
  "widget_dashboard",  // 进场欢迎卡片 (简化版)
  "widget_launcher",   // 组局发射台 (复合型卡片)
  "widget_action",     // **新增：快捷操作按钮 (简单跳转)**
  "widget_draft",      // 意图解析卡片 (带地图选点)
  "widget_share",      // 创建成功卡片
  "widget_explore",    // 探索卡片 (Generative UI)
  "widget_error"       // 错误提示卡片
]);
```

### 组件实现

```typescript
// components/widget-action/index.ts
Component({
  properties: {
    // 按钮文案
    label: { type: String, value: '查看详情' },
    // 图标 (Lucide icon name)
    icon: { type: String, value: 'arrow-right' },
    // 跳转路径
    url: { type: String, value: '' },
    // 按钮样式：primary | secondary | ghost
    variant: { type: String, value: 'primary' }
  },
  methods: {
    onTap() {
      const { url } = this.properties;
      if (url) {
        if (url.startsWith('/subpackages/')) {
          wx.navigateTo({ url });
        } else if (url.startsWith('/pages/')) {
          wx.navigateTo({ url });
        } else {
          // 外部链接或其他操作
          this.triggerEvent('tap', { url });
        }
      } else {
        this.triggerEvent('tap');
      }
    }
  }
});
```

### WXML 结构

```xml
<!-- components/widget-action/index.wxml -->
<view class="widget-action halo-card halo-card--mini" bindtap="onTap">
  <view class="action-content">
    <text class="action-label">{{label}}</text>
    <view class="action-icon">
      <text class="icon icon-{{icon}}"></text>
    </view>
  </view>
</view>
```

### LESS 样式

```less
// components/widget-action/index.less
.widget-action {
  display: inline-flex;
  padding: 20rpx 32rpx;
  
  .action-content {
    display: flex;
    align-items: center;
    gap: 12rpx;
    
    .action-label {
      font-size: 28rpx;
      font-weight: 500;
      color: var(--color-primary);
    }
    
    .action-icon {
      .icon {
        font-size: 32rpx;
        color: var(--color-primary);
      }
    }
  }
}

// Mini 版 Halo Card (更紧凑)
.halo-card--mini {
  border-radius: var(--radius-md);
  
  &::before {
    border-radius: var(--radius-md);
  }
}
```

### Content 结构

```typescript
// widget_action 的 content 结构
interface WidgetActionContent {
  label: string;           // 按钮文案
  icon?: string;           // 图标名称 (Lucide)
  url?: string;            // 跳转路径
  variant?: 'primary' | 'secondary' | 'ghost';
}

// 示例
{
  type: 'widget_action',
  content: {
    label: '查看我发布的活动',
    icon: 'list',
    url: '/subpackages/activity/list/index?type=created'
  }
}
```

---

## Admin Inspector 组件库完整设计

### Inspector 组件矩阵

Admin 需要为每种 Widget 类型提供对应的 Inspector 组件，用于调试和数据透视：

| Widget 类型 | Inspector 组件 | 核心功能 |
|------------|---------------|---------|
| `text` | `TextInspector` | Markdown 渲染 + 字符统计 |
| `widget_dashboard` | `DashboardInspector` | 问候语 + 活动列表数据 |
| `widget_launcher` | `LauncherInspector` | 三层结构数据展示 |
| `widget_action` | `ActionInspector` | 跳转路径 + 按钮样式 |
| `widget_draft` | `DraftInspector` | 活动草稿数据 + 地图外链 |
| `widget_share` | `ShareInspector` | 分享数据 + 预览 |
| `widget_explore` | `ExploreInspector` | 搜索结果 + 坐标验证 |
| `widget_error` | `ErrorInspector` | 错误信息 + 堆栈 |

### Inspector 组件实现

```tsx
// apps/admin/src/components/inspectors/index.tsx

// 1. TextInspector - 文本消息
export function TextInspector({ data }: { data: { text: string } }) {
  return (
    <Card className="border-l-4 border-l-gray-400 bg-slate-50">
      <div className="p-3 border-b">
        <span className="font-mono text-xs font-bold text-gray-600">TYPE: TEXT</span>
        <Badge variant="outline" className="ml-2">{data.text.length} chars</Badge>
      </div>
      <CardContent className="pt-3">
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown>{data.text}</ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  );
}

// 2. DashboardInspector - 欢迎卡片
export function DashboardInspector({ data }: { data: { greeting: string; activities: any[] } }) {
  return (
    <Card className="border-l-4 border-l-blue-400 bg-slate-50">
      <div className="p-3 border-b">
        <span className="font-mono text-xs font-bold text-blue-600">TYPE: WIDGET_DASHBOARD</span>
      </div>
      <CardContent className="pt-3 space-y-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-gray-500" />
          <span className="font-mono text-sm">{data.greeting}</span>
        </div>
        <div className="text-xs text-gray-500">
          Activities: {data.activities?.length || 0} items
        </div>
        {data.activities?.length > 0 && (
          <JsonView data={data.activities} collapsed={1} />
        )}
      </CardContent>
    </Card>
  );
}

// 3. LauncherInspector - 组局发射台
export function LauncherInspector({ data }: { data: { title: string; badge?: string; showTools?: boolean } }) {
  return (
    <Card className="border-l-4 border-l-purple-500 bg-slate-50">
      <div className="p-3 border-b flex justify-between items-center">
        <span className="font-mono text-xs font-bold text-purple-600">TYPE: WIDGET_LAUNCHER</span>
        <Badge variant="outline">Composite Widget</Badge>
      </div>
      <CardContent className="pt-3 space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Title:</span>
            <span className="ml-2 font-mono">{data.title}</span>
          </div>
          <div>
            <span className="text-gray-500">Badge:</span>
            <span className="ml-2 font-mono">{data.badge || 'N/A'}</span>
          </div>
        </div>
        <div className="p-2 bg-white rounded border">
          <div className="text-xs text-gray-500 mb-1">Structure Preview:</div>
          <div className="flex gap-2 text-xs">
            <span className="px-2 py-1 bg-blue-100 rounded">Header</span>
            <span className="px-2 py-1 bg-green-100 rounded">Body (2 cols)</span>
            <span className="px-2 py-1 bg-yellow-100 rounded">Footer ({data.showTools ? '3 tools' : 'hidden'})</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 4. ActionInspector - 快捷操作按钮
export function ActionInspector({ data }: { data: { label: string; icon?: string; url?: string; variant?: string } }) {
  return (
    <Card className="border-l-4 border-l-cyan-500 bg-slate-50">
      <div className="p-3 border-b">
        <span className="font-mono text-xs font-bold text-cyan-600">TYPE: WIDGET_ACTION</span>
        <Badge variant="outline" className="ml-2">Simple Widget</Badge>
      </div>
      <CardContent className="pt-3 space-y-2">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Label:</span>
            <span className="ml-2 font-mono">{data.label}</span>
          </div>
          <div>
            <span className="text-gray-500">Icon:</span>
            <span className="ml-2 font-mono">{data.icon || 'arrow-right'}</span>
          </div>
        </div>
        {data.url && (
          <div className="flex items-center gap-2 bg-white p-2 rounded border">
            <Link className="w-4 h-4 text-gray-500" />
            <code className="text-xs text-blue-600 break-all">{data.url}</code>
          </div>
        )}
        <div className="text-xs text-gray-500">
          Variant: <span className="font-mono">{data.variant || 'primary'}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// 5. DraftInspector - 活动草稿 (已有，增强版)
export function DraftInspector({ data }: { data: ActivityDraft & { activityId?: string } }) {
  return (
    <Card className="border-l-4 border-l-indigo-500 bg-slate-50">
      <div className="p-3 border-b flex justify-between items-center">
        <span className="font-mono text-xs font-bold text-indigo-600">TYPE: WIDGET_DRAFT</span>
        {data.activityId && (
          <Badge variant="outline">ID: {data.activityId.slice(0, 8)}...</Badge>
        )}
      </div>
      <CardContent className="pt-3 space-y-2">
        <div className="font-medium">{data.title}</div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="font-mono">{data.startAt}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-500" />
            <span>Max: {data.maxParticipants}</span>
          </div>
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-gray-500" />
            <span className="font-mono">{data.type}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white p-2 rounded border">
          <MapPin className="w-4 h-4 text-red-500" />
          <span className="truncate text-sm">{data.locationName}</span>
          <a 
            href={`https://map.qq.com/?type=marker&pointx=${data.lng}&pointy=${data.lat}`}
            target="_blank" 
            className="text-blue-600 underline text-xs ml-auto"
          >
            Verify on Map
          </a>
        </div>
        <div className="text-xs text-gray-500">
          Coordinates: ({data.lat.toFixed(6)}, {data.lng.toFixed(6)})
        </div>
      </CardContent>
    </Card>
  );
}

// 6. ShareInspector - 分享卡片
export function ShareInspector({ data }: { data: { activityId: string; title: string; shareTitle: string } }) {
  return (
    <Card className="border-l-4 border-l-green-500 bg-slate-50">
      <div className="p-3 border-b">
        <span className="font-mono text-xs font-bold text-green-600">TYPE: WIDGET_SHARE</span>
      </div>
      <CardContent className="pt-3 space-y-2">
        <div className="text-sm">
          <span className="text-gray-500">Activity ID:</span>
          <code className="ml-2 text-xs bg-gray-100 px-1 rounded">{data.activityId}</code>
        </div>
        <div className="text-sm">
          <span className="text-gray-500">Title:</span>
          <span className="ml-2">{data.title}</span>
        </div>
        <div className="p-2 bg-white rounded border">
          <div className="text-xs text-gray-500 mb-1">Share Preview:</div>
          <div className="font-medium text-sm">{data.shareTitle}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// 7. ExploreInspector - 探索卡片
export function ExploreInspector({ data }: { data: ExploreContent }) {
  return (
    <Card className="border-l-4 border-l-orange-500 bg-slate-50">
      <div className="p-3 border-b flex justify-between items-center">
        <span className="font-mono text-xs font-bold text-orange-600">TYPE: WIDGET_EXPLORE</span>
        <Badge variant="outline">Generative UI</Badge>
      </div>
      <CardContent className="pt-3 space-y-2">
        <div className="font-medium text-sm">{data.title}</div>
        <div className="flex items-center gap-2 bg-white p-2 rounded border">
          <MapPin className="w-4 h-4 text-red-500" />
          <span className="text-sm">{data.center.name}</span>
          <code className="text-xs text-gray-500 ml-auto">
            ({data.center.lat.toFixed(4)}, {data.center.lng.toFixed(4)})
          </code>
        </div>
        <div className="text-xs text-gray-500">
          Results: {data.results?.length || 0} activities
        </div>
        {data.results?.length > 0 && (
          <div className="max-h-40 overflow-auto">
            <JsonView data={data.results} collapsed={2} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 8. ErrorInspector - 错误卡片
export function ErrorInspector({ data }: { data: { message: string; stack?: string } }) {
  return (
    <Card className="border-l-4 border-l-red-500 bg-red-50">
      <div className="p-3 border-b">
        <span className="font-mono text-xs font-bold text-red-600">TYPE: WIDGET_ERROR</span>
      </div>
      <CardContent className="pt-3 space-y-2">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span className="font-medium">{data.message}</span>
        </div>
        {data.stack && (
          <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-32">
            {data.stack}
          </pre>
        )}
      </CardContent>
    </Card>
  );
}

// 9. RawJsonInspector - 原始 JSON (通用)
export function RawJsonInspector({ data, type }: { data: any; type: string }) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <Card className="border-l-4 border-l-gray-300 bg-gray-50">
      <div className="p-3 border-b flex justify-between items-center">
        <span className="font-mono text-xs font-bold text-gray-600">RAW JSON</span>
        <div className="flex gap-2">
          <Badge variant="outline">{type}</Badge>
          <Button size="sm" variant="ghost" onClick={() => setExpanded(!expanded)}>
            {expanded ? 'Collapse' : 'Expand'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(JSON.stringify(data, null, 2))}>
            Copy
          </Button>
        </div>
      </div>
      <CardContent className="pt-3">
        <JsonView data={data} collapsed={expanded ? false : 1} />
      </CardContent>
    </Card>
  );
}

// Inspector 路由器 - 根据 type 渲染对应 Inspector
export function WidgetInspector({ type, content }: { type: string; content: any }) {
  const inspectorMap: Record<string, React.FC<{ data: any }>> = {
    'text': TextInspector,
    'widget_dashboard': DashboardInspector,
    'widget_launcher': LauncherInspector,
    'widget_action': ActionInspector,
    'widget_draft': DraftInspector,
    'widget_share': ShareInspector,
    'widget_explore': ExploreInspector,
    'widget_error': ErrorInspector,
  };
  
  const Inspector = inspectorMap[type];
  
  return (
    <div className="space-y-2">
      {Inspector ? (
        <Inspector data={content} />
      ) : (
        <RawJsonInspector data={content} type={type} />
      )}
      {/* 始终显示 Raw JSON 作为调试备选 */}
      <details className="text-xs">
        <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
          Show Raw JSON
        </summary>
        <RawJsonInspector data={content} type={type} />
      </details>
    </div>
  );
}
```

### Playground 集成

```tsx
// apps/admin/src/features/playground/components/message-list.tsx
export function MessageList({ messages }: { messages: Message[] }) {
  return (
    <div className="space-y-4">
      {messages.map((msg) => (
        <div 
          key={msg.id}
          className={cn(
            "flex",
            msg.role === 'user' ? 'justify-end' : 'justify-start'
          )}
        >
          {msg.role === 'user' ? (
            // 用户消息 - 简单气泡
            <div className="bg-indigo-500 text-white rounded-lg px-4 py-2 max-w-[70%]">
              {msg.content.text}
            </div>
          ) : (
            // AI 消息 - Inspector 渲染
            <div className="max-w-[85%]">
              <WidgetInspector type={msg.type} content={msg.content} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

### 产品逻辑闭环 (v3.2)

```
明确意图 ("明晚观音桥打麻将") → Widget_Draft (表单模式)
                                    ↓
                              用户确认发布
                                    ↓
                              Widget_Share (卡片模式)

模糊探索 ("观音桥有什么好玩的") → Widget_Explore (地图模式)
                                    ↓
                              沉浸式地图页
                                    ↓
                              发现感兴趣的活动
                                    ↓
                              活动详情页 → 报名
```

**这就是 Generative UI 的核心价值**：根据用户意图，动态生成最合适的界面，而不是简单地返回文本或跳转页面。
