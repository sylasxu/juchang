# 聚场 (JuChang) 技术架构文档

> **版本**: v4.2 | **更新**: 2026-01

---

## 1. 技术栈

| 模块 | 选型 |
|------|------|
| Monorepo | Turborepo + Bun |
| 小程序 | 微信原生 (TS + LESS) + Zustand |
| Admin | Vite + React + TanStack Router |
| API | Elysia + TypeBox |
| 数据库 | PostgreSQL + PostGIS + Drizzle |
| AI | Vercel AI SDK + DeepSeek |

---

## 2. 目录结构

```
/root
├── apps/
│   ├── miniprogram/      # 微信小程序
│   ├── admin/            # 管理后台
│   └── api/              # Elysia API
│       └── src/modules/  # 功能模块
│           ├── auth/     # 微信登录
│           ├── users/    # 用户管理
│           ├── activities/  # 活动管理
│           ├── chat/     # 活动群聊
│           └── ai/       # AI Agent
├── packages/
│   ├── db/               # Drizzle Schema
│   └── utils/            # 通用工具
└── docker/               # 基础设施
```

---

## 3. AI 模块架构

```
modules/ai/
├── ai.service.ts       # 主服务 (编排层)
├── intent/             # 意图识别
├── memory/             # 记忆系统 (用户画像)
├── tools/              # AI Tools (14 个)
├── workflow/           # HITL 工作流
│   ├── broker.ts       # 找搭子追问
│   ├── draft-flow.ts   # 草稿确认
│   └── match-flow.ts   # 匹配确认
├── processors/         # 上下文处理
├── prompts/            # Prompt + ACTIVITY_GUIDE
├── models/             # 模型路由 (DeepSeek/智谱)
├── guardrails/         # 安全护栏
├── evals/              # 实时评估
├── observability/      # 日志/指标/追踪
├── moderation/         # 内容审核
└── anomaly/            # 异常检测
```

### AI 处理流程

```
用户输入 → Input Guard → Intent Classifier
    ↓
partner 意图? → Broker Mode (结构化追问)
    ↓
其他意图 → processAIContext (注入用户画像)
    ↓
streamText + Tools → SSE Stream → 前端
    ↓
onFinish → 持久化 + 提取偏好 + 质量评估
```

### AI Tools

| Tool | Widget |
|------|--------|
| exploreNearby | Widget_Explore |
| createActivityDraft | Widget_Draft |
| askPreference | Widget_AskPreference |
| createPartnerIntent | Widget_Action |
| getMyActivities | Widget_Dashboard |

---

## 4. 数据库

### 核心表 (10 张)

| 表 | 说明 |
|---|------|
| users | 用户 (含 workingMemory) |
| activities | 活动 |
| participants | 参与者 |
| conversations | AI 会话 |
| conversation_messages | AI 消息 |
| activity_messages | 群聊消息 |
| notifications | 通知 |
| partner_intents | 搭子意向 |
| intent_matches | 意向匹配 |
| match_messages | 匹配消息 |

### 核心枚举

```typescript
activityStatusEnum: 'draft' | 'active' | 'completed' | 'cancelled'
partnerIntentStatusEnum: 'active' | 'matched' | 'expired' | 'cancelled'
intentMatchOutcomeEnum: 'pending' | 'confirmed' | 'expired' | 'cancelled'
```

---

## 5. API 端点

```typescript
// Auth
POST /auth/login          // 微信登录
POST /auth/bindPhone      // 绑定手机号

// Activities
POST /activities          // 创建活动
GET  /activities/:id      // 活动详情
GET  /activities/nearby   // 附近活动

// AI
POST /ai/chat             // AI 对话 (SSE)
GET  /ai/conversations    // 对话历史

// Admin AI Ops
GET  /users/:id/ai-profile    // 用户画像
POST /ai/moderation/analyze   // 内容审核
GET  /ai/anomaly/users        // 异常用户
```

---

## 6. 定时任务

| 任务 | 频率 |
|------|------|
| expireOldIntents | 每小时 |
| handleExpiredMatches | 每 10 分钟 |
| updateActivityStatuses | 每 5 分钟 |
| runAnomalyDetection | 每 30 分钟 |

---

## 7. 正确性属性

| 编号 | 规则 |
|------|------|
| CP-1 | currentParticipants = joined 记录数 |
| CP-9 | 未绑定手机号不能发布/报名 |
| CP-20 | AI 对话自动持久化 |
| CP-23 | 同用户同类型只能有一个 active 意向 |
| CP-24 | 意向 24h 自动过期 |
| CP-25 | 匹配需无 tag 冲突、3km 内、score ≥ 80% |

---

## 8. 开发命令

```bash
bun install              # 安装依赖
bun run dev              # 启动服务
bun run db:push          # 同步 Schema
bun run gen:api          # 生成 SDK
```

---

## 9. Schema 派生规则

```typescript
// ❌ 禁止手动定义
const userSchema = t.Object({ id: t.String() });

// ✅ 从 DB 派生
import { selectUserSchema } from '@juchang/db';
const userSchema = t.Pick(selectUserSchema, ['id', 'nickname']);
```
