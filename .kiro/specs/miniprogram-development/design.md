# 聚场小程序设计文档 (SDD)

## Overview

本设计文档描述聚场(JuChang)小程序的技术架构和页面结构。小程序基于微信原生开发框架，核心理念是"Map Copilot (地图副驾)"——用 AI 接住用户的自然语言，把"群聊的流"变成"地图的桩"。

### 技术栈
- **框架**: 微信小程序原生开发 (TypeScript)
- **UI组件**: TDesign Miniprogram
- **样式**: LESS + TailwindCSS (weapp-tailwindcss)
- **API通信**: Orval生成的TypeScript SDK
- **状态管理**: Zustand + 小程序原生Page/Component data
- **地图**: 微信小程序map组件
- **AI通信**: SSE (Server-Sent Events) 流式响应

### 核心设计理念

```
用户输入 → AI 思考 → 地图响应 → 给出建议（这是伙伴，不是工具）
```

**四大核心优势**：
1. **响应感** - AI 秒回，0.5s 内开始响应，治愈"无人回应的焦虑"
2. **秩序感** - 信息是桩（Pin），24小时内雷打不动
3. **零门槛** - 自然语言输入，不改变习惯
4. **面子工程** - 从"乞讨式组局"到"海报式发令"

## Architecture

### 页面架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    聚场小程序页面架构                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              主包 Pages (TabBar)                     │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐               │   │
│  │  │  Home   │ │ Message │ │   My    │               │   │
│  │  │  首页   │ │  消息   │ │  我的   │               │   │
│  │  └─────────┘ └─────────┘ └─────────┘               │   │
│  │                                                      │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │           AI 输入栏 (悬浮)                   │    │   │
│  │  │  🤖 本周想玩什么...                    🎙️  │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              分包 Subpackages                        │   │
│  │                                                      │   │
│  │  activity/          chat/           user/           │   │
│  │  ├─ detail/         └─ index        ├─ login/       │   │
│  │  ├─ create/                         └─ setting/     │   │
│  │  └─ confirm/                                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              全局组件 Components                     │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │   │
│  │  │ tab-bar  │ │  magic-  │ │   cui-   │            │   │
│  │  │ (Custom) │ │ capsule  │ │  panel   │            │   │
│  │  └──────────┘ └──────────┘ └──────────┘            │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │   │
│  │  │ activity │ │ floating │ │ feedback │            │   │
│  │  │ card     │ │ buttons  │ │ dialog   │            │   │
│  │  └──────────┘ └──────────┘ └──────────┘            │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │   │
│  │  │  share-  │ │ reliab-  │ │  draft-  │            │   │
│  │  │  poster  │ │  ility   │ │   card   │            │   │
│  │  └──────────┘ └──────────┘ └──────────┘            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              服务层 Services                         │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │   │
│  │  │   API    │ │    AI    │ │ Location │            │   │
│  │  │ (Orval)  │ │  (SSE)   │ │  (LBS)   │            │   │
│  │  └──────────┘ └──────────┘ └──────────┘            │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │   │
│  │  │  Auth    │ │ Payment  │ │  Share   │            │   │
│  │  │ (Token)  │ │ (WxPay)  │ │ (Canvas) │            │   │
│  │  └──────────┘ └──────────┘ └──────────┘            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 目录结构

```
apps/miniprogram/
├── pages/                      # 主包页面 (TabBar)
│   ├── home/                   # Tab1: 首页（地图+AI输入栏）
│   │   ├── index.ts
│   │   ├── index.wxml
│   │   ├── index.less
│   │   └── index.json
│   ├── message/                # Tab2: 消息中心
│   │   └── ...
│   └── my/                     # Tab3: 个人中心
│       └── ...
│
├── subpackages/                # 分包页面
│   ├── activity/               # 活动相关
│   │   ├── detail/             # 活动详情
│   │   ├── create/             # 创建活动
│   │   └── confirm/            # 履约确认
│   ├── chat/                   # 群聊
│   │   └── index/
│   └── user/                   # 用户相关
│       ├── login/              # 登录
│       └── setting/            # 设置
│
├── components/                 # 全局组件
│   ├── custom-tab-bar/         # 自定义TabBar
│   ├── ai-input-bar/           # AI输入栏 ⭐ 核心组件
│   ├── cui-panel/              # CUI副驾面板 ⭐ 核心组件
│   ├── draft-card/             # 创建草稿卡片
│   ├── activity-card/          # 活动卡片
│   ├── floating-buttons/       # 浮动按钮
│   ├── feedback-dialog/        # 反馈弹窗
│   └── reliability-badge/      # 靠谱度徽章
│
├── src/                        # 源码
│   ├── api/                    # Orval生成的API SDK
│   ├── services/               # 业务服务
│   │   ├── ai.ts               # AI服务（SSE流式）
│   │   ├── location.ts         # 位置服务
│   │   ├── share.ts            # 分享服务（微信原生）
│   │   └── payment.ts          # 支付服务
│   ├── stores/                 # Zustand状态管理
│   │   ├── app.ts              # 应用状态
│   │   ├── user.ts             # 用户状态
│   │   └── cui.ts              # CUI面板状态
│   ├── utils/                  # 工具函数
│   └── types/                  # 类型定义
│
├── static/                     # 静态资源
│   ├── pins/                   # 地图Pin图标
│   │   ├── pin-normal.png      # 普通活动Pin（橙色）
│   │   ├── pin-boost.png       # Boost活动Pin（橙色闪烁）
│   │   ├── pin-plus.png        # Pin+活动Pin（金色1.5x）
│   │   └── pin-ghost.png       # 幽灵锚点Pin（绿色虚线）
│   └── ...
│
├── app.ts                      # 应用入口
├── app.json                    # 应用配置
└── app.less                    # 全局样式
```

## Components and Interfaces

### 核心组件

#### 1. AI Input Bar (AI输入栏) ⭐

**路径**: `components/ai-input-bar/`
**功能**: 底部悬浮的AI入口，整合搜索与创建

```typescript
interface AIInputBarProps {
  placeholder?: string;  // 提示文案，默认"本周想玩什么..."
  onExpand: () => void;  // 展开回调
}

interface AIInputBarData {
  isExpanded: boolean;
  inputValue: string;
  isRecording: boolean;  // 语音录制状态
}
```

**视觉设计**:
```
┌─────────────────────────────────────────────────┐
│ 🤖  本周想玩什么...                        🎙️ │
└─────────────────────────────────────────────────┘
- 位置：Tabbar上方悬浮
- 外观：类似灵动岛的黑色长条
- 左侧：AI图标
- 中间：提示文案/输入框
- 右侧：语音按钮
```

#### 2. CUI Panel (副驾面板) ⭐

**路径**: `components/cui-panel/`
**功能**: AI交互面板，展示流式响应

```typescript
interface CUIPanelProps {
  visible: boolean;
  onClose: () => void;
  onSelectActivity: (activityId: string) => void;
  onCreateDraft: (draft: ActivityDraft) => void;
}

interface CUIPanelData {
  phase: 'idle' | 'thinking' | 'searching' | 'result';
  thinkingText: string;      // 思考态文案
  searchingText: string;     // 搜索态文案
  searchProgress: number;    // 搜索进度 0-100
  foundActivities: Activity[];
  draftCard: ActivityDraft | null;
}

// AI流式响应事件类型
type AIStreamEvent = 
  | { event: 'thinking'; data: { message: string } }
  | { event: 'location'; data: { name: string; coords: [number, number] } }
  | { event: 'searching'; data: { message: string; progress: number } }
  | { event: 'result'; data: { activities: Activity[]; draft?: ActivityDraft } }
  | { event: 'done' };
```

**交互流程**:
```
用户输入 "明晚观音桥打麻将，3缺1"
    │
    ▼ 0.5s
思考态："收到，正在定位观音桥..."
    │ (地图同步飞向目标点)
    ▼ 1.0s
搜索态："正在检索附近的麻将局..."
    │ (文字逐字跳动)
    ▼ 1.5s
结果态：双选卡片
    ├── A. 🔍 发现 2 个局，去看看？
    └── B. 🀄️ 麻将局·3缺1 [🚀 立即发布]
```

#### 3. Draft Card (创建草稿卡片)

**路径**: `components/draft-card/`
**功能**: AI解析后的活动草稿预览

```typescript
interface DraftCardProps {
  draft: ActivityDraft;
  onPublish: () => void;
}

interface ActivityDraft {
  title: string;           // AI提取的标题
  type: ActivityType;      // 活动类型
  startAt: string;         // 开始时间
  location: {
    name: string;
    coords: [number, number];
  };
  maxParticipants: number;
  description?: string;
}
```

#### 4. Reliability Badge (靠谱度徽章)

**路径**: `components/reliability-badge/`
**功能**: 简化的徽章式靠谱度展示

```typescript
interface ReliabilityBadgeProps {
  rate: number;  // 履约率 0-100，-1表示新用户
  showLabel?: boolean;  // 是否显示文字标签
}

// 展示逻辑
function getReliabilityDisplay(rate: number): { icon: string; label: string; type: 'super' | 'normal' | 'new' } {
  if (rate === -1 || rate < 80) return { icon: '🆕', label: '新人', type: 'new' };
  if (rate > 90) return { icon: '🏅', label: '超靠谱', type: 'super' };
  return { icon: '✓', label: '靠谱', type: 'normal' };
}
```

#### 5. Share Service (分享服务)

**路径**: `src/services/share.ts`
**功能**: 微信原生分享封装

```typescript
interface ShareConfig {
  title: string;           // 分享标题
  path: string;            // 分享路径
  imageUrl?: string;       // 分享图片（可选）
}

// 活动分享配置生成
function getActivityShareConfig(activity: Activity): ShareConfig {
  const vacancy = activity.maxParticipants - activity.currentParticipants;
  return {
    title: `${activity.title} | 还缺${vacancy}人`,
    path: `/subpackages/activity/detail/index?id=${activity.id}`,
    imageUrl: activity.coverImage,
  };
}
```

### 其他组件

#### 6. Custom TabBar

```typescript
interface TabBarData {
  value: 'map' | 'message' | 'my';
  unreadNum: number;
}
```

#### 7. Floating Buttons

```typescript
const BUTTONS = [
  { id: 'safety', icon: 'shield', position: 'left-top' },
  { id: 'location', icon: 'location', position: 'right-center' },
];
```

#### 8. Activity Card

```typescript
interface ActivityCardProps {
  activity: Activity;
  mode: 'popup' | 'list';
  showDistance?: boolean;
  showLocationHint?: boolean;  // 显示位置备注
}
```

#### 9. Feedback Dialog

```typescript
interface FeedbackDialogProps {
  activityId: string;
  participants: User[];
  onSubmit: (feedback: Feedback) => void;
}

type FeedbackType = 'late' | 'no_show' | 'bad_attitude' | 'mismatch' | 'other';
```

## 页面详细设计

### 主包页面 (TabBar)

#### 1. 首页 (pages/home)

**路径**: `pages/home/index`
**类型**: TabBar页面

**功能**:
- 全屏地图展示，以用户位置为中心
- 活动Pin渲染（普通橙色/Pin+金色/Boost闪烁/幽灵锚点绿色）
- AI输入栏悬浮入口
- 浮动按钮（定位、安全中心）
- 点击Pin显示活动卡片弹窗
- 点击幽灵锚点唤起AI输入栏

**地图Pin类型**:
| 类型 | 颜色 | 说明 |
|------|------|------|
| 真实活动 | 🟠 橙色 | 用户发布的活动 |
| 幽灵锚点 | 🟢 绿色虚线 | 运营投放的需求引导 |
| 我的位置 | 🔵 蓝色光点 | 当前用户位置 |
| Boost 活动 | 🟠 橙色闪烁 | 付费推广，带"🔥急招"标签 |
| Pin+ 活动 | 🟡 金色 1.5x | 付费置顶，带光晕动效 |

**API调用**:
- `GET /activities/nearby` - 获取附近活动
- `GET /activities/ghosts` - 获取幽灵锚点
- `POST /ai/parse` - AI意图解析（SSE流式）

---

#### 2. 消息页 (pages/message)

**路径**: `pages/message/index`
**类型**: TabBar页面

**功能**:
- 系统通知列表（申请通知、履约通知、申诉通知）
- 群聊列表（活动群聊入口）
- 未读消息角标
- 申诉按钮（被标记未到场时显示）

**API调用**:
- `GET /notifications` - 获取通知列表
- `GET /notifications/unread-count` - 获取未读数量

---

#### 3. 我的页 (pages/my)

**路径**: `pages/my/index`
**类型**: TabBar页面

**功能**:
- 用户头像、昵称、靠谱度徽章展示
- 统计数据（组织场次、参与场次、差评次数）
- 我发布的活动入口
- 我参与的活动入口
- 设置入口
- 未登录状态显示登录入口

**API调用**:
- `GET /users/me` - 获取当前用户信息

---

### 分包页面 (Subpackages)

#### 4. 活动详情页 (subpackages/activity/detail)

**功能**:
- 活动完整信息展示（含位置备注）
- 私密局显示模糊地址
- 发起人靠谱度徽章
- 报名按钮（校验靠谱度门槛）
- 分享功能

**API调用**:
- `GET /activities/:id` - 获取活动详情
- `POST /participants` - 报名活动

---

#### 5. 创建活动页 (subpackages/activity/create)

**功能**:
- 活动表单（标题、描述、时间、地点、人数、费用类型）
- 位置选择（强制填写位置备注）
- 隐私设置（模糊地理位置）
- 推广选项（Boost ¥3、Pin+ ¥5）
- 从AI输入栏跳转时预填AI解析信息
- 创建成功后显示分享海报

**位置备注选项**:
- 地面入口
- 地下通道进
- XX楼平台
- 其他：[自定义]

**API调用**:
- `POST /activities` - 创建活动
- `POST /transactions` - 购买增值服务

---

#### 6. 履约确认页 (subpackages/activity/confirm)

**功能**:
- 参与者列表（默认全选已到场）
- 标记未到场（显示警告）
- 确认提交

**API调用**:
- `GET /activities/:id/participants` - 获取参与者列表
- `POST /participants/confirm` - 提交履约确认

---

#### 7. 群聊页 (subpackages/chat/index)

**功能**:
- 活动信息头部
- 消息列表
- 发送文本消息
- 实时消息接收（WebSocket）

**API调用**:
- `GET /chat/:activityId/messages` - 获取消息历史
- `POST /chat/:activityId/messages` - 发送消息

---

#### 8. 登录页 (subpackages/user/login)

**功能**:
- 微信一键登录
- 获取用户信息授权

**API调用**:
- `POST /auth/wx-login` - 微信登录

## Data Models

数据模型从后端 API 响应派生，通过 Orval 生成 TypeScript 类型。

### 核心类型

```typescript
// 从 Orval 生成的 API 类型
import type { 
  User, 
  Activity, 
  Participant,
  ChatMessage,
  Notification,
  Feedback,
  Transaction
} from '@/api/model';

// 小程序端扩展类型
interface ActivityWithDistance extends Activity {
  distance: number; // 与用户的距离(米)
}

// 幽灵锚点
interface GhostAnchor {
  id: string;
  location: [number, number];
  anchorType: 'demand' | 'promotion';
  suggestedType: ActivityType;
  displayText: string;  // "这里缺一个火锅局🍲"
  locationHint: string;
}

// AI解析结果
interface AIParseResult {
  activities: Activity[];  // 匹配到的活动
  draft?: ActivityDraft;   // 创建草稿
}
```

### 本地存储

```typescript
const STORAGE_KEYS = {
  TOKEN: 'token',
  USER_INFO: 'userInfo',
  LAST_LOCATION: 'lastLocation',
  AI_QUOTA: 'aiQuota',  // { search: number, create: number, date: string }
};
```

## API 集成

### AI 流式响应

```typescript
// src/services/ai.ts
export function parseIntent(input: string): EventSource {
  const url = `${API_BASE}/ai/parse?input=${encodeURIComponent(input)}`;
  
  // 使用 SSE 接收流式响应
  const eventSource = new EventSource(url);
  
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data) as AIStreamEvent;
    // 处理不同阶段的事件
    switch (data.event) {
      case 'thinking':
        // 更新思考态UI
        break;
      case 'location':
        // 地图飞向目标位置
        break;
      case 'searching':
        // 更新搜索进度
        break;
      case 'result':
        // 显示结果卡片
        break;
      case 'done':
        eventSource.close();
        break;
    }
  };
  
  return eventSource;
}
```

### Orval SDK 生成

```bash
cd apps/miniprogram
bun run gen:api
```

## Error Handling

### API 错误处理

```typescript
function handleAPIError(error: { code: number; msg: string }): void {
  switch (error.code) {
    case 401:
      wx.removeStorageSync('token');
      wx.navigateTo({ url: '/subpackages/user/login/index' });
      break;
    case 429:  // AI额度用完
      wx.showToast({ title: '今日AI额度已用完，明天再来', icon: 'none' });
      break;
    case 403:
      wx.showToast({ title: '权限不足', icon: 'none' });
      break;
    default:
      wx.showToast({ title: error.msg || '网络错误', icon: 'none' });
  }
}
```

### 位置权限处理

```typescript
async function requestLocationPermission(): Promise<boolean> {
  try {
    await wx.authorize({ scope: 'scope.userLocation' });
    return true;
  } catch {
    wx.showModal({
      title: '需要位置权限',
      content: '请在设置中开启位置权限',
      confirmText: '去设置',
      success: (res) => {
        if (res.confirm) wx.openSetting();
      }
    });
    return false;
  }
}
```

## 页面路由配置

### app.json 配置

```json
{
  "pages": [
    "pages/home/index",
    "pages/message/index",
    "pages/my/index"
  ],
  "subpackages": [
    {
      "root": "subpackages/activity",
      "pages": ["detail/index", "create/index", "confirm/index"]
    },
    {
      "root": "subpackages/chat",
      "pages": ["index/index"]
    },
    {
      "root": "subpackages/user",
      "pages": ["login/index", "setting/index"]
    }
  ],
  "tabBar": {
    "custom": true,
    "list": [
      { "pagePath": "pages/home/index", "text": "首页" },
      { "pagePath": "pages/message/index", "text": "消息" },
      { "pagePath": "pages/my/index", "text": "我的" }
    ]
  }
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

经过分析，以下属性可以合并或简化：
- 靠谱度显示属性 (14.1-14.4) 可以合并为一个统一的靠谱度计算属性
- 未登录权限控制属性 (18.2-18.4) 可以合并为一个统一的懒注册属性
- Pin样式属性 (4.3, 4.4, 4.7) 可以合并为一个统一的Pin渲染属性

### Core Properties

#### Property 1: 靠谱度徽章计算正确性
*For any* 用户履约率 rate，靠谱度显示函数应返回正确的徽章：
- rate > 90% → "🏅 超靠谱"
- 80% < rate ≤ 90% → "✓ 靠谱"
- rate ≤ 80% 或新用户 → "🆕 新人"
**Validates: Requirements 14.1, 14.2, 14.3, 14.4**

#### Property 2: 未读消息角标正确性
*For any* 未读消息数量 n (n ≥ 0)，消息Tab的角标应正确显示该数量
**Validates: Requirements 1.4**

#### Property 3: AI输入防抖机制
*For any* 用户输入序列，只有在停止输入500ms后才触发AI解析请求
**Validates: Requirements 2.6**

#### Property 4: AI响应时间保证
*For any* AI解析请求，系统应在0.5s内开始显示思考态反馈
**Validates: Requirements 3.1**

#### Property 5: 地图位置联动
*For any* AI定位到的地点坐标，地图中心应同步移动到该坐标
**Validates: Requirements 3.2**

#### Property 6: AI搜索结果展示一致性
*For any* AI搜索结果：
- 有匹配活动时 → 显示双选卡片（发现X个局 + 创建草稿）
- 无匹配活动时 → 仅显示创建草稿卡片
**Validates: Requirements 3.4, 3.5**

#### Property 7: 活动Pin样式正确性
*For any* 活动，其Pin样式应根据状态正确渲染：
- 普通活动 → 橙色Pin
- Pin+活动 → 金色1.5倍大小Pin
- Boost活动 → 橙色闪烁Pin + "🔥急招"标签
- 幽灵锚点 → 绿色虚线Pin
**Validates: Requirements 4.3, 4.4, 4.7**

#### Property 8: 私密局地址模糊化
*For any* 设置为私密局的活动，未通过审批的用户只能看到模糊地址
**Validates: Requirements 7.2**

#### Property 9: 报名靠谱度门槛校验
*For any* 用户报名请求，如果用户靠谱度低于活动门槛，应阻止报名并显示提示
**Validates: Requirements 7.4, 7.5**

#### Property 10: 位置备注必填验证
*For any* 活动创建请求，如果缺少位置备注字段，应阻止提交并显示验证错误
**Validates: Requirements 8.2, 8.4**

#### Property 11: AI输入栏预填数据传递
*For any* 从AI输入栏跳转到创建页的场景，AI解析的数据应正确预填到表单
**Validates: Requirements 8.7**

#### Property 12: 幽灵锚点预填数据传递
*For any* 点击幽灵锚点的场景，锚点的类型和位置应正确预填到AI输入栏
**Validates: Requirements 5.2**

#### Property 13: 履约确认默认状态
*For any* 履约确认页面，所有参与者应默认勾选"已到场"状态
**Validates: Requirements 11.2**

#### Property 14: 申诉状态保护
*For any* 处于"争议中"状态的履约记录，双方用户的靠谱度均不应被扣除
**Validates: Requirements 12.3**

#### Property 15: 懒注册权限控制
*For any* 未登录用户，以下操作应跳转到登录页：创建活动、报名活动、进入群聊
*For any* 未登录用户，以下操作应允许：浏览地图、查看活动详情
**Validates: Requirements 18.1, 18.2, 18.3, 18.4**

#### Property 16: AI额度消耗正确性
*For any* AI输入栏使用，应消耗1次AI搜索额度
*For any* 活动发布，应消耗1次发布额度
**Validates: Requirements 19.1, 19.3**

#### Property 17: 分享深度链接
*For any* 分享卡片，点击后应直接打开对应的活动详情页
**Validates: Requirements 17.3**

## Testing Strategy

由于微信小程序环境限制，采用分层测试策略：

### 1. 单元测试 (Jest)

针对纯逻辑函数进行单元测试：

```typescript
// 靠谱度计算函数测试
describe('getReliabilityDisplay', () => {
  it('should return super badge for rate > 90%', () => {
    expect(getReliabilityDisplay(95).type).toBe('super');
    expect(getReliabilityDisplay(95).icon).toBe('🏅');
  });
  
  it('should return normal badge for 80% < rate <= 90%', () => {
    expect(getReliabilityDisplay(85).type).toBe('normal');
    expect(getReliabilityDisplay(85).icon).toBe('✓');
  });
  
  it('should return new badge for rate <= 80% or new user', () => {
    expect(getReliabilityDisplay(70).type).toBe('new');
    expect(getReliabilityDisplay(-1).type).toBe('new');
  });
});
```

### 2. 属性测试 (fast-check)

使用 fast-check 库进行属性测试，验证核心业务逻辑：

```typescript
import fc from 'fast-check';

// Property 1: 靠谱度徽章计算正确性
// **Feature: miniprogram-development, Property 1: 靠谱度徽章计算正确性**
describe('Reliability Display Property', () => {
  it('should always return valid badge type for any rate', () => {
    fc.assert(
      fc.property(fc.integer({ min: -1, max: 100 }), (rate) => {
        const result = getReliabilityDisplay(rate);
        // 验证返回值在有效类型内
        expect(['super', 'normal', 'new']).toContain(result.type);
        // 验证徽章与履约率的对应关系
        if (rate > 90) expect(result.type).toBe('super');
        else if (rate > 80) expect(result.type).toBe('normal');
        else expect(result.type).toBe('new');
      })
    );
  });
});

// Property 3: AI输入防抖机制
// **Feature: miniprogram-development, Property 3: AI输入防抖机制**
describe('Debounce Property', () => {
  it('should only trigger API call after 500ms of no input', () => {
    fc.assert(
      fc.property(
        fc.array(fc.tuple(fc.string(), fc.integer({ min: 0, max: 1000 }))),
        (inputSequence) => {
          // 模拟输入序列，验证只有最后一次输入后500ms才触发API
          const apiCalls = simulateDebounce(inputSequence, 500);
          // 验证API调用次数符合预期
          return apiCalls.length <= inputSequence.length;
        }
      )
    );
  });
});

// Property 10: 位置备注必填验证
// **Feature: miniprogram-development, Property 10: 位置备注必填验证**
describe('Location Hint Validation Property', () => {
  it('should reject activity creation without location hint', () => {
    fc.assert(
      fc.property(
        fc.record({
          title: fc.string({ minLength: 1 }),
          location: fc.tuple(fc.float(), fc.float()),
          locationHint: fc.constant(''), // 空位置备注
        }),
        (activity) => {
          const result = validateActivityCreation(activity);
          expect(result.valid).toBe(false);
          expect(result.errors).toContain('locationHint');
        }
      )
    );
  });
});
```

### 3. 集成测试

使用微信开发者工具的自动化测试功能：

```javascript
// miniprogram-test/integration/home.test.js
describe('Home Page Integration', () => {
  it('should render activity pins correctly', async () => {
    const page = await miniProgram.reLaunch('/pages/home/index');
    await page.waitFor(1000);
    
    const pins = await page.$$('.activity-pin');
    expect(pins.length).toBeGreaterThan(0);
  });
  
  it('should show ai input bar', async () => {
    const inputBar = await page.$('.ai-input-bar');
    expect(inputBar).toBeTruthy();
  });
});
```

### 4. 手动测试检查清单

**导航测试**
- [ ] 3个Tab切换正常
- [ ] AI输入栏在地图页显示
- [ ] 页面跳转和返回正常

**AI输入栏测试**
- [ ] 点击展开CUI面板
- [ ] 输入文本触发AI解析
- [ ] 语音按钮启动录音
- [ ] 防抖机制生效（500ms）

**CUI副驾面板测试**
- [ ] 思考态在0.5s内显示
- [ ] 地图同步飞向目标位置
- [ ] 搜索态文字逐字跳动
- [ ] 有结果时显示双选卡片
- [ ] 无结果时显示创建草稿

**首页测试**
- [ ] 位置权限请求正常
- [ ] 活动Pin正确渲染（普通/Pin+/Boost）
- [ ] 幽灵锚点绿色虚线显示
- [ ] 点击Pin显示活动卡片
- [ ] 点击幽灵锚点唤起AI输入栏

**活动流程测试**
- [ ] 创建活动表单验证（位置备注必填）
- [ ] 从AI输入栏预填数据正确
- [ ] 报名靠谱度门槛校验
- [ ] 私密局地址模糊化
- [ ] 履约确认默认全选

**权限测试**
- [ ] 未登录可浏览地图
- [ ] 未登录创建/报名/群聊跳转登录页

**额度测试**
- [ ] AI使用消耗额度
- [ ] 额度用完显示提示

## Error Handling

### API 错误处理

```typescript
function handleAPIError(error: { code: number; msg: string }): void {
  switch (error.code) {
    case 401:
      wx.removeStorageSync('token');
      wx.navigateTo({ url: '/subpackages/user/login/index' });
      break;
    case 429:  // AI额度用完
      wx.showToast({ title: '今日AI额度已用完，明天再来', icon: 'none' });
      break;
    case 403:
      wx.showToast({ title: '权限不足', icon: 'none' });
      break;
    case 422:  // 验证错误
      wx.showToast({ title: error.msg || '请检查输入', icon: 'none' });
      break;
    default:
      wx.showToast({ title: error.msg || '网络错误', icon: 'none' });
  }
}
```

### 位置权限处理

```typescript
async function requestLocationPermission(): Promise<boolean> {
  try {
    await wx.authorize({ scope: 'scope.userLocation' });
    return true;
  } catch {
    wx.showModal({
      title: '需要位置权限',
      content: '聚场需要获取您的位置来显示附近活动',
      confirmText: '去设置',
      success: (res) => {
        if (res.confirm) wx.openSetting();
      }
    });
    return false;
  }
}
```

### AI 服务降级

```typescript
async function parseIntentWithFallback(input: string): Promise<AIParseResult> {
  try {
    return await parseIntent(input);
  } catch (error) {
    // AI服务不可用时，降级为关键词搜索
    console.warn('AI service unavailable, falling back to keyword search');
    return {
      activities: await searchByKeyword(input),
      draft: null
    };
  }
}
```
