# API Enhancement Design Document

## Overview

本设计文档描述聚场(JuChang)后端 API 层的完善方案。基于现有的 Elysia + TypeBox 架构，遵循项目的 Single Source of Truth 原则，从 `@juchang/db` 派生类型定义。新增通知系统、差评反馈、定时任务、WebSocket 实时通信等模块。

### 技术栈
- **框架**: ElysiaJS + Bun Runtime
- **类型系统**: TypeBox (与 Elysia 深度集成)
- **数据库**: PostgreSQL + Drizzle ORM
- **实时通信**: Elysia WebSocket
- **定时任务**: Bun Cron / node-cron
- **类型派生**: drizzle-typebox

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    API 模块架构                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 Controllers Layer                    │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │   │
│  │  │ Existing │ │   New    │ │ Enhanced │            │   │
│  │  │ Modules  │ │ Modules  │ │ Modules  │            │   │
│  │  └──────────┘ └──────────┘ └──────────┘            │   │
│  │                                                     │   │
│  │  Existing:                                          │   │
│  │  - auth, users, activities, participants           │   │
│  │  - chat, transactions, ai, dashboard, upload       │   │
│  │                                                     │   │
│  │  New:                                               │   │
│  │  - notifications (通知系统)                         │   │
│  │  - feedbacks (差评反馈)                             │   │
│  │  - action-logs (操作日志)                           │   │
│  │  - websocket (实时通信)                             │   │
│  │                                                     │   │
│  │  Enhanced:                                          │   │
│  │  - activities (状态管理、分享)                      │   │
│  │  - users (统计增强)                                 │   │
│  │  - dashboard (管理后台增强)                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  Services Layer                      │   │
│  │  Pure Functions - No HTTP Dependencies              │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 Schedules Layer                      │   │
│  │  - fulfillmentTimeout (履约超时处理)                │   │
│  │  - activityStatusUpdate (活动状态更新)              │   │
│  │  - pinPlusExpiry (Pin+过期处理)                     │   │
│  │  - disputeTimeout (申诉超时处理)                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   Data Layer                         │   │
│  │  @juchang/db - Drizzle ORM + TypeBox Schemas        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 目录结构

```
apps/api/src/
├── modules/
│   ├── notifications/          # 新增：通知系统
│   │   ├── notification.controller.ts
│   │   ├── notification.model.ts
│   │   └── notification.service.ts
│   ├── feedbacks/              # 新增：差评反馈
│   │   ├── feedback.controller.ts
│   │   ├── feedback.model.ts
│   │   └── feedback.service.ts
│   ├── action-logs/            # 新增：操作日志
│   │   ├── action-log.controller.ts
│   │   ├── action-log.model.ts
│   │   └── action-log.service.ts
│   ├── websocket/              # 新增：WebSocket
│   │   ├── websocket.controller.ts
│   │   └── websocket.service.ts
│   └── ... (existing modules)
├── schedules/                  # 新增：定时任务
│   ├── index.ts
│   ├── fulfillment-timeout.ts
│   ├── activity-status.ts
│   ├── pin-plus-expiry.ts
│   └── dispute-timeout.ts
└── index.ts
```

## Components and Interfaces

### 1. Notification Module

```typescript
// modules/notifications/notification.model.ts
import { Elysia, t, type Static } from 'elysia';
import { selectNotificationSchema } from '@juchang/db';

// 通知列表查询参数
const NotificationListQuery = t.Object({
  page: t.Optional(t.Number({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 20 })),
  isRead: t.Optional(t.Boolean()),
  type: t.Optional(t.String()),
});

// 批量标记已读请求
const MarkReadRequest = t.Object({
  ids: t.Array(t.String({ format: 'uuid' })),
});

// 未读数量响应
const UnreadCountResponse = t.Object({
  count: t.Number(),
});

export const notificationModel = new Elysia({ name: 'notificationModel' })
  .model({
    'notification.listQuery': NotificationListQuery,
    'notification.markRead': MarkReadRequest,
    'notification.unreadCount': UnreadCountResponse,
  });

export type NotificationListQuery = Static<typeof NotificationListQuery>;
export type MarkReadRequest = Static<typeof MarkReadRequest>;
```

### 2. Feedback Module

```typescript
// modules/feedbacks/feedback.model.ts
import { Elysia, t, type Static } from 'elysia';
import { selectFeedbackSchema } from '@juchang/db';

// 提交反馈请求
const CreateFeedbackRequest = t.Object({
  activityId: t.String({ format: 'uuid' }),
  targetId: t.String({ format: 'uuid' }),
  reason: t.Union([
    t.Literal('late'),           // 迟到
    t.Literal('no_show'),        // 放鸽子
    t.Literal('bad_attitude'),   // 态度不好
    t.Literal('mismatch'),       // 与描述不符
    t.Literal('other'),          // 其他
  ]),
  description: t.Optional(t.String({ maxLength: 500 })),
});

// 用户差评统计
const UserFeedbackStats = t.Object({
  totalCount: t.Number(),
  byReason: t.Record(t.String(), t.Number()),
  recentFeedbacks: t.Array(t.Intersect([
    selectFeedbackSchema,
    t.Object({
      activityTitle: t.String(),
      reporterNickname: t.String(),
    }),
  ])),
});

export const feedbackModel = new Elysia({ name: 'feedbackModel' })
  .model({
    'feedback.create': CreateFeedbackRequest,
    'feedback.userStats': UserFeedbackStats,
  });

export type CreateFeedbackRequest = Static<typeof CreateFeedbackRequest>;
export type UserFeedbackStats = Static<typeof UserFeedbackStats>;
```

### 3. Action Log Module

```typescript
// modules/action-logs/action-log.model.ts
import { Elysia, t, type Static } from 'elysia';
import { selectActionLogSchema } from '@juchang/db';

// 操作类型枚举
const ActionType = t.Union([
  t.Literal('fulfillment_confirm'),  // 履约确认
  t.Literal('dispute_submit'),       // 申诉提交
  t.Literal('payment_success'),      // 支付成功
  t.Literal('ai_usage'),             // AI使用
  t.Literal('activity_create'),      // 创建活动
  t.Literal('activity_cancel'),      // 取消活动
  t.Literal('user_block'),           // 封禁用户
  t.Literal('user_unblock'),         // 解封用户
]);

// 查询参数
const ActionLogQuery = t.Object({
  userId: t.Optional(t.String({ format: 'uuid' })),
  actionType: t.Optional(ActionType),
  startDate: t.Optional(t.String({ format: 'date-time' })),
  endDate: t.Optional(t.String({ format: 'date-time' })),
  page: t.Optional(t.Number({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 50 })),
});

export const actionLogModel = new Elysia({ name: 'actionLogModel' })
  .model({
    'actionLog.query': ActionLogQuery,
    'actionLog.type': ActionType,
  });

export type ActionLogQuery = Static<typeof ActionLogQuery>;
export type ActionType = Static<typeof ActionType>;
```

### 4. WebSocket Module

```typescript
// modules/websocket/websocket.service.ts
interface WebSocketConnection {
  userId: string;
  activityIds: string[];
  ws: WebSocket;
  connectedAt: Date;
}

interface ChatMessage {
  type: 'chat_message';
  activityId: string;
  message: {
    id: string;
    senderId: string;
    senderNickname: string;
    senderAvatar: string;
    content: string;
    createdAt: string;
  };
}

interface SystemNotification {
  type: 'notification';
  notification: {
    id: string;
    type: string;
    title: string;
    content: string;
  };
}

type WebSocketMessage = ChatMessage | SystemNotification;
```

### 5. Schedule Tasks

```typescript
// schedules/fulfillment-timeout.ts
/**
 * 履约超时处理
 * 每小时执行一次，检查活动结束超过24小时且未确认的活动
 */
export async function processFulfillmentTimeout(): Promise<void> {
  // 1. 查询超时未确认的活动
  // 2. 自动标记全员履约成功
  // 3. 更新参与者的履约记录
  // 4. 发送通知给发起人
}

// schedules/activity-status.ts
/**
 * 活动状态更新
 * 每分钟执行一次，更新活动状态
 */
export async function updateActivityStatus(): Promise<void> {
  // 1. 将已到开始时间的活动标记为进行中
  // 2. 将已到结束时间的活动标记为已结束
  // 3. 为已结束活动发送履约确认通知
}

// schedules/pin-plus-expiry.ts
/**
 * Pin+过期处理
 * 每小时执行一次，取消过期的黄金置顶
 */
export async function processPinPlusExpiry(): Promise<void> {
  // 1. 查询启用Pin+超过24小时的活动
  // 2. 取消黄金置顶效果
}

// schedules/dispute-timeout.ts
/**
 * 申诉超时处理
 * 每小时执行一次，处理超时未申诉的未到场记录
 */
export async function processDisputeTimeout(): Promise<void> {
  // 1. 查询被标记未到场超过24小时且未申诉的记录
  // 2. 自动生效扣分
  // 3. 更新用户靠谱度
}
```

### 6. Enhanced Activity Endpoints

```typescript
// 活动状态管理增强
// modules/activities/activity.controller.ts 新增端点

// 取消活动
POST /activities/:id/cancel
Body: { reason: string }
Response: { msg: string }

// 延期活动
PUT /activities/:id/postpone
Body: { newStartAt: string, newEndAt?: string }
Response: { msg: string, activity: Activity }

// 获取活动状态历史
GET /activities/:id/status-history
Response: Array<{ status: string, changedAt: string, changedBy: string }>

// 生成分享数据
GET /activities/:id/share
Response: {
  sceneParam: string,
  title: string,
  time: string,
  location: string,
  spotsLeft: number,
  countdown: string,
}

// 获取增值服务状态
GET /activities/:id/premium-status
Response: {
  boost: { enabled: boolean, remainingCount: number, lastUsedAt?: string },
  pinPlus: { enabled: boolean, expiresAt?: string },
}
```

### 7. Enhanced User Endpoints

```typescript
// 用户统计增强
// modules/users/user.controller.ts 新增端点

// 获取详细个人统计
GET /users/me/stats
Response: {
  organizationCount: number,
  participationCount: number,
  fulfillmentCount: number,
  reliabilityRate: number,
  reliabilityLevel: string,
  feedbackCount: number,
  disputeCount: number,
}

// 获取靠谱度详情
GET /users/me/reliability
Response: {
  rate: number,
  level: string,
  participationCount: number,
  fulfillmentCount: number,
  recentHistory: Array<{
    activityId: string,
    activityTitle: string,
    status: 'fulfilled' | 'absent' | 'disputed',
    date: string,
  }>,
}

// 获取会员状态
GET /users/me/membership
Response: {
  type: 'free' | 'pro',
  expiresAt?: string,
  benefits: {
    aiCreateQuota: number,
    aiSearchQuota: number,
    freeBoostPerDay: number,
    pinPlusDiscount: number,
  },
}
```

## Data Models

### 通知类型枚举扩展

```typescript
// packages/db/src/schema/enums.ts 扩展
export const notificationTypeEnum = pgEnum('notification_type', [
  'application',        // 申请通知
  'application_result', // 申请结果
  'fulfillment',        // 履约确认
  'absence_marked',     // 被标记未到场
  'dispute_result',     // 申诉结果
  'activity_reminder',  // 活动提醒
  'activity_cancelled', // 活动取消
  'activity_postponed', // 活动延期
  'system',             // 系统通知
]);
```

### 活动状态历史表（可选）

```typescript
// packages/db/src/schema/activity_status_history.ts
export const activityStatusHistory = pgTable("activity_status_history", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  activityId: uuid("activity_id").notNull().references(() => activities.id),
  previousStatus: activityStatusEnum("previous_status"),
  newStatus: activityStatusEnum("new_status").notNull(),
  changedBy: uuid("changed_by").references(() => users.id),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: 通知列表分页正确性
*For any* 用户和分页参数，返回的通知列表长度应不超过请求的 limit，且包含所有必需字段（类型、标题、内容、已读状态）
**Validates: Requirements 1.1**

### Property 2: 通知已读状态更新
*For any* 通知标记已读操作，操作后查询该通知应返回 isRead=true 且 readAt 不为空
**Validates: Requirements 1.2**

### Property 3: 批量标记已读完整性
*For any* 批量标记已读请求，所有指定的通知 ID 对应的通知都应被标记为已读
**Validates: Requirements 1.3**

### Property 4: 未读数量准确性
*For any* 用户，未读通知数量应等于该用户所有 isRead=false 的通知数量
**Validates: Requirements 1.4**

### Property 5: 差评反馈参与者验证
*For any* 差评反馈提交，只有活动参与者才能成功提交，非参与者应被拒绝
**Validates: Requirements 2.1**

### Property 6: 差评原因枚举验证
*For any* 差评反馈提交，reason 字段必须是有效的枚举值之一
**Validates: Requirements 2.2**

### Property 7: 用户差评统计准确性
*For any* 用户差评查询，返回的统计数据应与该用户实际收到的差评记录一致
**Validates: Requirements 2.3**

### Property 8: 履约超时自动确认
*For any* 活动结束超过24小时且未确认的活动，定时任务执行后所有参与者应被标记为履约成功
**Validates: Requirements 3.1**

### Property 9: 申诉超时自动扣分
*For any* 被标记未到场超过24小时且未申诉的记录，定时任务执行后用户靠谱度应被扣减
**Validates: Requirements 3.2**

### Property 10: 活动状态自动更新
*For any* 活动，当开始时间到达时状态应更新为进行中，当结束时间到达时状态应更新为已结束
**Validates: Requirements 3.3, 3.4**

### Property 11: Pin+过期自动取消
*For any* 启用 Pin+ 超过24小时的活动，定时任务执行后 isPinPlus 应为 false
**Validates: Requirements 3.5**

### Property 12: 操作日志完整性
*For any* 关键业务操作，操作完成后应能查询到对应的操作日志记录
**Validates: Requirements 5.1**

### Property 13: 操作日志筛选正确性
*For any* 操作日志查询，返回的结果应满足所有指定的筛选条件
**Validates: Requirements 5.2**

### Property 14: 活动取消通知
*For any* 活动取消操作，所有参与者应收到取消通知
**Validates: Requirements 6.1**

### Property 15: 活动满员状态自动更新
*For any* 活动，当参与者数量达到 maxParticipants 时，状态应自动更新为已满员
**Validates: Requirements 6.2**

### Property 16: 用户统计数据准确性
*For any* 用户统计查询，返回的组织场次、参与场次、履约率应与实际数据一致
**Validates: Requirements 7.1**

### Property 17: 靠谱度计算正确性
*For any* 用户，靠谱度应等于 fulfillmentCount / participationCount * 100
**Validates: Requirements 7.2**

### Property 18: 分享参数往返一致性
*For any* 活动，生成的分享参数通过解析后应能正确返回该活动详情
**Validates: Requirements 9.1, 9.2**

### Property 19: 分享卡片数据完整性
*For any* 活动分享卡片请求，返回数据应包含标题、时间、地点、缺人数、倒计时
**Validates: Requirements 9.3**

### Property 20: 增值服务状态查询准确性
*For any* 活动增值服务状态查询，返回的 Boost 和 Pin+ 状态应与数据库记录一致
**Validates: Requirements 10.1**

## Error Handling

### 统一错误响应格式

```typescript
interface ErrorResponse {
  code: number;
  msg: string;
  details?: any;
}

// 错误码定义
const ERROR_CODES = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
};
```

### 业务错误处理

```typescript
// 通知模块错误
- 404: 通知不存在
- 403: 无权限访问该通知

// 反馈模块错误
- 400: 无效的反馈原因
- 403: 非活动参与者无法提交反馈
- 409: 已对该用户提交过反馈

// 活动状态错误
- 400: 活动状态不允许该操作
- 403: 非发起人无法执行该操作
```

## Testing Strategy

### 单元测试
- **Service 函数测试**: 测试所有 service 层的纯函数
- **数据验证测试**: 测试 TypeBox schema 的验证逻辑
- **定时任务测试**: 测试定时任务的业务逻辑

### 属性测试 (Property-Based Testing)
- **使用框架**: fast-check
- **测试策略**: 为每个正确性属性编写对应的属性测试
- **最小迭代次数**: 100 次

### 集成测试
- **API 端点测试**: 测试完整的请求-响应流程
- **数据库集成测试**: 测试数据持久化逻辑
- **WebSocket 测试**: 测试实时通信功能

### 测试标注格式
每个属性测试必须包含以下注释：
```typescript
/**
 * **Feature: api-enhancement, Property 1: 通知列表分页正确性**
 * **Validates: Requirements 1.1**
 */
```
