# Design Document

## Overview

本设计文档描述聚场(JuChang)小程序的技术架构和实现方案。小程序基于微信原生开发框架，使用TDesign组件库，通过Orval生成的SDK与后端API通信。核心目标是实现PRD V9.2定义的3 Tab导航架构、全屏地图首页（含底部抽屉和浮动按钮）、履约确认等功能。

### 技术栈
- **框架**: 微信小程序原生开发
- **UI组件**: TDesign Miniprogram
- **样式**: LESS
- **API通信**: Orval生成的TypeScript SDK
- **状态管理**: 小程序原生Page/Component data + 全局App.globalData
- **地图**: 微信小程序map组件
- **实时通信**: WebSocket

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    聚场小程序架构                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    Pages Layer                       │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────────┐  │   │
│  │  │   Map   │ │ Message │ │   My    │ │  Detail   │  │   │
│  │  │  (Tab)  │ │  (Tab)  │ │  (Tab)  │ │ (SubPkg)  │  │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └───────────┘  │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────────┐  │   │
│  │  │  Chat   │ │ Create  │ │ Confirm │ │  Profile  │  │   │
│  │  │(SubPkg) │ │(SubPkg) │ │(SubPkg) │ │ (SubPkg)  │  │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └───────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 Components Layer                     │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐             │   │
│  │  │ TabBar   │ │ Bottom   │ │ MapPin   │             │   │
│  │  │(Custom)  │ │ Drawer   │ │(Markers) │             │   │
│  │  └──────────┘ └──────────┘ └──────────┘             │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐             │   │
│  │  │ Activity │ │  Filter  │ │ Floating │             │   │
│  │  │  Card    │ │  Panel   │ │ Buttons  │             │   │
│  │  └──────────┘ └──────────┘ └──────────┘             │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  Services Layer                      │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐             │   │
│  │  │   API    │ │ WebSocket│ │  Auth    │             │   │
│  │  │ (Orval)  │ │ (Chat)   │ │ (Token)  │             │   │
│  │  └──────────┘ └──────────┘ └──────────┘             │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐             │   │
│  │  │ Location │ │ Storage  │ │ Payment  │             │   │
│  │  │ (LBS)    │ │ (Cache)  │ │ (WxPay)  │             │   │
│  │  └──────────┘ └──────────┘ └──────────┘             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 页面结构

```
apps/miniprogram/
├── pages/                    # 主包页面
│   ├── map/                  # Tab1: 地图首页 (重命名自home)
│   ├── message/              # Tab2: 消息中心
│   └── my/                   # Tab3: 个人中心
├── subpackages/              # 分包页面
│   ├── activity/             # 活动相关
│   │   ├── detail/           # 活动详情
│   │   ├── create/           # 创建活动表单
│   │   ├── confirm/          # 履约确认
│   │   └── list/             # 活动列表
│   ├── chat/                 # 群聊页面
│   ├── user/                 # 用户相关
│   │   ├── profile/          # 个人资料编辑
│   │   └── settings/         # 设置
│   └── auth/                 # 认证相关
│       └── login/            # 登录页
├── components/               # 全局组件
│   ├── tab-bar/              # 自定义TabBar
│   ├── bottom-drawer/        # 底部抽屉组件
│   ├── floating-buttons/     # 浮动按钮组件
│   ├── activity-card/        # 活动卡片
│   ├── filter-panel/         # 筛选面板
│   ├── map-pin/              # 地图标记
│   └── feedback-dialog/      # 反馈弹窗
└── src/                      # 源码
    ├── api/                  # Orval生成的API
    ├── stores/               # 状态管理
    ├── utils/                # 工具函数
    └── types/                # 类型定义
```

## Components and Interfaces

### 1. Custom TabBar Component

自定义底部导航栏，包含3个Tab。

```typescript
// components/tab-bar/index.ts
interface TabBarData {
  value: 'map' | 'message' | 'my';
  unreadNum: number;
  tabs: Array<{
    icon: string;
    value: string;
    label: string;
  }>;
}

interface TabBarMethods {
  handleTabChange(e: { detail: { value: string } }): void;
  setUnreadNum(num: number): void;
}
```

### 2. Bottom Drawer Component

底部可滑动抽屉组件，用于地图页面。

```typescript
// components/bottom-drawer/index.ts
interface BottomDrawerData {
  visible: boolean;
  expanded: boolean;
  minHeight: number;    // 收起时的高度
  maxHeight: number;    // 展开时的高度
  currentHeight: number;
}

interface BottomDrawerProps {
  minHeight?: number;   // 默认 200rpx
  maxHeight?: number;   // 默认 70vh
}

interface BottomDrawerMethods {
  expand(): void;
  collapse(): void;
  toggle(): void;
  onTouchStart(e: TouchEvent): void;
  onTouchMove(e: TouchEvent): void;
  onTouchEnd(e: TouchEvent): void;
}
```

### 3. Floating Buttons Component

地图浮动按钮组件。

```typescript
// components/floating-buttons/index.ts
interface FloatingButtonsData {
  buttons: Array<{
    id: string;
    icon: string;
    position: 'left-top' | 'right-top' | 'left-bottom' | 'right-bottom' | 'right-center';
    label?: string;
  }>;
}

interface FloatingButtonsMethods {
  onButtonTap(e: { currentTarget: { dataset: { id: string } } }): void;
}

// 默认按钮配置
const DEFAULT_BUTTONS = [
  { id: 'safety', icon: 'shield', position: 'left-top', label: '安全中心' },
  { id: 'location', icon: 'location', position: 'right-center' },
];
```

### 4. Filter Panel Component

活动筛选面板组件。

```typescript
// components/filter-panel/index.ts
interface FilterOptions {
  time: 'today' | 'tomorrow' | 'week' | 'all';
  type: ActivityType[];
  gender: 'all' | 'female_only' | 'male_only';
  minReliability: number;
  distance: 1 | 3 | 5 | 10;
  status: ActivityStatus[];
  feeType: FeeType[];
}

interface FilterPanelData {
  visible: boolean;
  options: FilterOptions;
  activeCount: number;
}

interface FilterPanelMethods {
  show(): void;
  hide(): void;
  onOptionChange(key: string, value: any): void;
  onReset(): void;
  onApply(): void;
}
```

### 5. Activity Card Component

活动信息卡片组件，用于地图弹窗和列表展示。

```typescript
// components/activity-card/index.ts
interface ActivityCardProps {
  activity: Activity;
  mode: 'popup' | 'list';
  showDistance?: boolean;
}

interface ActivityCardMethods {
  onTap(): void;
  onCreatorTap(): void;
}
```

### 6. Map Pin Markers

地图标记点数据结构。

```typescript
// types/map.ts
interface MapMarker {
  id: number;
  latitude: number;
  longitude: number;
  iconPath: string;
  width: number;
  height: number;
  callout?: {
    content: string;
    display: 'BYCLICK' | 'ALWAYS';
  };
  customCallout?: {
    display: 'BYCLICK' | 'ALWAYS';
    anchorX: number;
    anchorY: number;
  };
  // 扩展属性
  activityId: string;
  isPinPlus: boolean;
  isBoosted: boolean;
  isGhost: boolean;
}

// Pin类型对应的图标
const PIN_ICONS = {
  activity: '/static/pins/activity.png',
  activity_pinplus: '/static/pins/activity_gold.png',
  activity_boosted: '/static/pins/activity_fire.png',
  ghost: '/static/pins/ghost.png',
  user: '/static/pins/user.png',
};
```

### 7. API Service Interfaces

基于Orval生成的API接口。

```typescript
// src/api/types.ts
// 活动相关
interface GetActivitiesNearbyParams {
  latitude: number;
  longitude: number;
  radius?: number; // 默认5km
  filters?: FilterOptions;
}

interface CreateActivityParams {
  title: string;
  description?: string;
  images?: string[];
  location: { latitude: number; longitude: number };
  locationName: string;
  address?: string;
  locationHint: string; // 必填
  startAt: string;
  endAt?: string;
  type: ActivityType;
  maxParticipants: number;
  feeType: FeeType;
  estimatedCost?: number;
  joinMode: JoinMode;
  genderRequirement?: string;
  minReliabilityRate?: number;
  isLocationBlurred?: boolean;
  // 增值服务
  enableBoost?: boolean;
  enablePinPlus?: boolean;
}

// 履约相关
interface ConfirmFulfillmentParams {
  activityId: string;
  participants: Array<{
    userId: string;
    status: 'fulfilled' | 'absent';
  }>;
}

// 申诉相关
interface DisputeParams {
  participantId: string;
  reason?: string;
}
```

## Data Models

### 核心数据模型

数据模型直接从 `@juchang/db` schema 派生，遵循 Single Source of Truth 原则。

```typescript
// 从 @juchang/db 导入的类型
import type { 
  User, 
  Activity, 
  Participant,
  ChatMessage,
  Notification,
  Feedback,
  Transaction 
} from '@juchang/db';

// 小程序端扩展类型
interface ActivityWithDistance extends Activity {
  distance: number; // 计算字段：与用户的距离(米)
  creator: Pick<User, 'id' | 'nickname' | 'avatarUrl' | 'participationCount' | 'fulfillmentCount'>;
}

interface ParticipantWithUser extends Participant {
  user: Pick<User, 'id' | 'nickname' | 'avatarUrl' | 'participationCount' | 'fulfillmentCount'>;
}

// 靠谱度计算
function calculateReliabilityRate(user: User): number {
  if (user.participationCount === 0) return -1; // 新用户
  return Math.round((user.fulfillmentCount / user.participationCount) * 100);
}

function getReliabilityLabel(rate: number): string {
  if (rate === -1) return '🆕 新用户';
  if (rate === 100) return '⭐⭐⭐ 非常靠谱';
  if (rate >= 80) return '⭐⭐ 靠谱';
  if (rate >= 60) return '⭐ 一般';
  return '待提升';
}
```

### 本地存储结构

```typescript
// 本地存储键值
const STORAGE_KEYS = {
  TOKEN: 'token',
  USER_INFO: 'userInfo',
  LAST_LOCATION: 'lastLocation',
  FILTER_OPTIONS: 'filterOptions',
  SEARCH_HISTORY: 'searchHistory',
};

// 缓存策略
interface CacheConfig {
  key: string;
  ttl: number; // 毫秒
}

const CACHE_CONFIG: Record<string, CacheConfig> = {
  nearbyActivities: { key: 'cache_nearby', ttl: 60 * 1000 }, // 1分钟
  userProfile: { key: 'cache_profile', ttl: 5 * 60 * 1000 }, // 5分钟
};
```

## Design Constraints (设计约束)

以下是实现过程中必须遵守的设计约束，通过手动测试验证：

### Constraint 1: Map Marker Generation

活动数据转换为地图标记时，必须根据 `isPinPlus` 和 `isBoosted` 标志设置正确的图标和样式。

**验证: Requirements 2.3, 2.4**

### Constraint 2: Filter Logic

筛选逻辑必须支持多条件AND组合，重置后恢复显示全部活动。

**验证: Requirements 5.2, 5.3**

### Constraint 3: Privacy Address Display

私密局活动对未通过审批的用户只显示模糊地址。

**验证: Requirements 6.2**

### Constraint 4: Reliability Rate Validation

报名时必须校验用户靠谱度是否满足活动门槛。

**验证: Requirements 6.4**

### Constraint 5: Form Validation

活动创建表单必须校验位置备注(locationHint)为必填。

**验证: Requirements 7.2, 7.4**

### Constraint 6: Login State Control

未登录用户可浏览地图和活动详情，但创建/报名/群聊操作必须跳转登录。

**验证: Requirements 12.5, 16.1, 16.2, 16.3, 16.4**

### Constraint 7: Scene Parameter Handling

小程序启动时解析scene参数，支持直接跳转到指定活动详情页。

**验证: Requirements 15.3**

### Constraint 8: Reliability Rate Calculation

靠谱度计算公式: `fulfillmentCount / participationCount * 100`，新用户(participationCount=0)显示"新用户"标签。

**验证: Requirements 12.1**

### Constraint 9: Bottom Drawer Interaction

底部抽屉必须支持滑动手势，向上滑动展开，向下滑动收起。

**验证: Requirements 4.2, 4.3**

## Error Handling

### API Error Handling

```typescript
// src/utils/error-handler.ts
interface APIError {
  code: number;
  msg: string;
  data?: any;
}

function handleAPIError(error: APIError): void {
  switch (error.code) {
    case 401:
      // Token过期，跳转登录
      wx.removeStorageSync('token');
      wx.navigateTo({ url: '/subpackages/auth/login/index' });
      break;
    case 403:
      // 权限不足
      wx.showToast({ title: '权限不足', icon: 'none' });
      break;
    case 404:
      // 资源不存在
      wx.showToast({ title: '内容不存在', icon: 'none' });
      break;
    case 429:
      // 请求过于频繁
      wx.showToast({ title: '操作太频繁，请稍后再试', icon: 'none' });
      break;
    default:
      wx.showToast({ title: error.msg || '网络错误', icon: 'none' });
  }
}
```

### 网络错误处理

```typescript
// 网络状态监听
wx.onNetworkStatusChange((res) => {
  if (!res.isConnected) {
    wx.showToast({ title: '网络已断开', icon: 'none' });
  }
});

// 请求超时处理
const REQUEST_TIMEOUT = 10000; // 10秒
```

### 位置权限处理

```typescript
async function requestLocationPermission(): Promise<boolean> {
  try {
    const setting = await wx.getSetting();
    if (setting.authSetting['scope.userLocation']) {
      return true;
    }
    
    const authResult = await wx.authorize({ scope: 'scope.userLocation' });
    return true;
  } catch (error) {
    // 用户拒绝授权，引导到设置页
    wx.showModal({
      title: '需要位置权限',
      content: '请在设置中开启位置权限以使用地图功能',
      confirmText: '去设置',
      success: (res) => {
        if (res.confirm) {
          wx.openSetting();
        }
      }
    });
    return false;
  }
}
```

## Testing Strategy

### 手动测试为主

由于微信小程序环境的特殊性（无法直接运行Node.js测试框架），采用手动测试为主的策略：

1. **微信开发者工具调试** - 使用真机预览和模拟器进行功能测试
2. **API Mock** - 开发阶段使用mock数据，确保UI逻辑正确
3. **边界条件测试** - 手动测试各种边界情况（空数据、网络错误、权限拒绝等）

### API SDK生成

使用Orval从后端OpenAPI规范生成TypeScript SDK：

```bash
# 生成API SDK
cd apps/miniprogram
bun run gen:api
```

生成的SDK位于 `apps/miniprogram/src/api/`，包含：
- `endpoints/` - 各模块API调用函数
- `model/` - TypeScript类型定义

### 测试检查清单

开发完成后，按以下清单进行手动测试：

**导航测试**
- [ ] 3个Tab切换正常
- [ ] 页面跳转和返回正常

**地图测试**
- [ ] 位置权限请求正常
- [ ] 地图加载和Pin渲染正常
- [ ] Pin点击显示活动卡片
- [ ] 浮动按钮功能正常
- [ ] 底部抽屉滑动正常
- [ ] 筛选功能正常

**活动流程测试**
- [ ] 创建活动流程完整
- [ ] 报名流程正常
- [ ] 履约确认流程正常

**权限测试**
- [ ] 未登录可浏览地图
- [ ] 未登录创建/报名/群聊跳转登录页

**异常测试**
- [ ] 网络断开提示
- [ ] API错误处理
- [ ] 空数据状态显示
