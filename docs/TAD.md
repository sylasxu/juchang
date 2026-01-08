# 聚场 (JuChang) 技术架构文档

> **版本**: v4.0 | **更新**: 2025-01
> **架构**: 原生小程序 + Zustand + Elysia API + Drizzle ORM

---

## 1. 技术栈

| 模块 | 选型 |
|------|------|
| Monorepo | Turborepo + Bun |
| 小程序 | 微信原生 (TS + LESS) |
| 小程序状态 | Zustand Vanilla |
| Admin 后台 | Vite + React + TanStack |
| API 网关 | Elysia |
| 数据库 | PostgreSQL + PostGIS |
| ORM | Drizzle + drizzle-typebox |

---

## 2. 目录结构

```
/root
├── apps/
│   ├── miniprogram/      # 微信原生小程序
│   ├── admin/            # Vite + React 管理后台
│   └── api/              # Elysia API
│       └── src/modules/  # 功能模块
│           ├── auth/     # 微信登录、手机号绑定
│           ├── users/    # 用户 CRUD
│           ├── activities/   # 活动 CRUD、报名
│           ├── chat/     # 活动群聊
│           ├── ai/       # AI 解析、对话历史
│           └── dashboard/    # 首页数据聚合
├── packages/
│   ├── db/               # Drizzle ORM Schema
│   └── utils/            # 通用工具
└── docker/               # 基础设施
```

---

## 3. 数据库 Schema

### 3.1 核心表 (10 张)

| 表 | 说明 |
|---|------|
| `users` | 用户 |
| `activities` | 活动 |
| `participants` | 参与者 |
| `conversations` | AI 会话 |
| `conversation_messages` | AI 对话消息 |
| `activity_messages` | 活动群聊消息 |
| `notifications` | 通知 |
| `partner_intents` | 搭子意向 (v4.0) |
| `intent_matches` | 意向匹配 (v4.0) |
| `match_messages` | 匹配消息 (v4.0) |

### 3.2 核心枚举

```typescript
activityStatusEnum: 'draft' | 'active' | 'completed' | 'cancelled'
partnerIntentStatusEnum: 'active' | 'matched' | 'expired' | 'cancelled'
intentMatchOutcomeEnum: 'pending' | 'confirmed' | 'expired' | 'cancelled'
```

---

## 4. API 模块

### 4.1 端点概览

```typescript
// Auth
POST /auth/login          // 微信登录
POST /auth/bindPhone      // 绑定手机号

// Activities
POST /activities          // 创建活动
GET  /activities/:id      // 活动详情
GET  /activities/nearby   // 附近活动
POST /activities/:id/join // 报名

// AI
POST /ai/chat             // AI 对话 (SSE)
GET  /ai/conversations    // 对话历史

// Dashboard
GET  /dashboard/metrics       // 业务指标
GET  /dashboard/intent-metrics // 意向指标 (v4.0)
```

### 4.2 AI Tools (v4.0)

| Tool | 说明 |
|------|------|
| `exploreNearby` | 探索附近活动 |
| `createActivityDraft` | 创建活动草稿 |
| `askPreference` | 追问偏好 |
| `createPartnerIntent` | 创建搭子意向 |
| `getMyIntents` | 查询意向 |
| `cancelIntent` | 取消意向 |
| `confirmMatch` | 确认匹配 |

---

## 5. 正确性属性 (CP)

### 数据一致性
- **CP-1**: `currentParticipants` = participants 表中 joined 记录数
- **CP-4**: 每日创建活动次数 ≤ aiCreateQuotaToday

### 认证规则
- **CP-9**: 未绑定手机号不能发布/报名活动
- **CP-11**: 未登录用户可以浏览、查看详情、探索

### 找搭子 (v4.0)
- **CP-23**: 同一用户同一类型只能有一个 active 意向
- **CP-24**: 意向 24h 自动过期
- **CP-25**: 匹配只在无 tag 冲突、同类型、3km 内、score ≥ 80% 时创建
- **CP-26**: Temp_Organizer 是最早创建意向的用户

---

## 6. Cron Jobs

| 任务 | 频率 | 说明 |
|------|------|------|
| `expireOldIntents` | 每小时 | 过期意向处理 |
| `handleExpiredMatches` | 每 10 分钟 | 过期匹配处理 |

---

## 7. 开发命令

```bash
bun install              # 安装依赖
bun run dev              # 启动所有服务
bun run db:push          # 同步 Schema 到数据库
bun run gen:api          # 生成 Orval SDK
```

**注意**: 使用 `db:push` 而非 `db:migrate`

---

## 8. Schema 派生规则

```typescript
// ❌ 禁止手动定义
const userSchema = t.Object({ id: t.String() });

// ✅ 从 DB 派生
import { selectUserSchema } from '@juchang/db';
const userSchema = t.Pick(selectUserSchema, ['id', 'nickname']);
```
