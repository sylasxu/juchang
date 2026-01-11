---
inclusion: always
---
# JuChang 项目规范

## 🎯 核心哲学

1. **Single Source of Truth**: `@juchang/db` 是绝对的数据源
2. **Zero Redundancy**: 禁止手动重复定义 TypeBox Schema，必须从 DB 派生
3. **Spec-First & SDK-Driven**: Eden Treaty (Admin) / Orval SDK (小程序)
4. **Dual-Track Architecture**: API (Elysia + JWT) + Admin (Vite SPA)

---

## 🚨 单向数据流原则

```
正确：需求 → PRD → TAD → DB Schema → API → 前端
错误：前端需要字段 → 反向修改 DB Schema ❌
```

**新增字段流程**：PRD → TAD → DB Schema → `bun run db:generate` → `bun run db:migrate` → API → 前端

---

## 🏗️ Monorepo 结构

### @juchang/db (数据源)
- **Tech**: Drizzle ORM (PostgreSQL + PostGIS) + `drizzle-typebox`
- **10 张核心表**: users, activities, participants, conversations, conversation_messages, activity_messages, notifications, partner_intents, intent_matches, match_messages
- **Schema 规范**:
  ```typescript
  export const users = pgTable("users", { ... });
  export const insertUserSchema = createInsertSchema(users);
  export const selectUserSchema = createSelectSchema(users);
  export type User = typeof users.$inferSelect;
  ```

### apps/api (业务网关)
- **Tech**: ElysiaJS + TypeBox
- **5 个模块**: auth, users, activities, chat, ai
- **文件结构**: `*.controller.ts` / `*.service.ts` (纯函数) / `*.model.ts`
- **禁止**: `export namespace`、class Service、手动定义 DB 表 Schema

### apps/admin (管理后台)
- **Tech**: Vite + React 19 + TanStack Router + Eden Treaty
- **禁止**: Zod、zodResolver

### apps/miniprogram (小程序)
- **Tech**: Native WeChat + TypeScript + Zustand Vanilla + LESS
- **禁止**: `wx.request` (使用 Orval SDK)

---

## 🚫 Schema 派生规则

**数据展示 Schema（selectSchema）：**
```typescript
// ❌ 禁止手动定义
const userSchema = t.Object({ id: t.String(), nickname: t.String() });

// ✅ 必须从 DB 派生
import { selectUserSchema } from '@juchang/db';
const userSchema = t.Pick(selectUserSchema, ['id', 'nickname']);
```

**表单验证 Schema（insertSchema）：**
```typescript
// ❌ 禁止手动定义表单字段
const formSchema = t.Object({
  nickname: t.String({ minLength: 1, maxLength: 50 }),
});

// ✅ 从 DB 派生，Pick 需要的字段
import { insertUserSchema } from '@juchang/db';
const formSchema = t.Pick(insertUserSchema, ['nickname', 'avatarUrl']);
```

**允许手动定义的 Schema：**
- 分页参数、错误响应等通用辅助类型
- 登录表单（phone + code，非 DB 字段）
- Admin 特有类型（无对应 DB 表）

---

## 🤖 AI Tools 规范

**必须使用 TypeBox，禁止 Zod**：

```typescript
import { t } from 'elysia';
import { tool, jsonSchema } from 'ai';
import { toJsonSchema } from '@juchang/utils';

const myToolSchema = t.Object({
  title: t.String({ description: '活动标题' }),
});

type MyToolParams = typeof myToolSchema.static;

export function myTool(userId: string | null) {
  return tool({
    description: '工具描述',
    parameters: jsonSchema<MyToolParams>(toJsonSchema(myToolSchema)),
    execute: async (params) => { ... },
  });
}
```

---

## 🛠️ 开发命令

**使用 Bun，禁止 npm/yarn**：

```bash
bun install          # 安装依赖
bun run dev          # 启动服务
bun run db:migrate   # 执行迁移
bun run gen:api      # 生成 Orval SDK
bunx <package>       # 执行包命令
```

---

## 🗣️ 语气规范

| ❌ 太装逼 | ✅ 接地气 |
|----------|----------|
| "已为您构建全息活动契约" | "帮你把局组好了！" |
| "正在解析您的意图向量..." | "收到，正在帮你整理..." |
| "今日配额已耗尽。" | "今天的 AI 额度用完了，明天再来吧～" |

---

## 📋 数据库 Schema 速查

**枚举**:
- `activityStatusEnum`: draft, active, completed, cancelled
- `conversationRoleEnum`: user, assistant
- `conversationMessageTypeEnum`: text, widget_dashboard, widget_launcher, widget_action, widget_draft, widget_share, widget_explore, widget_error, widget_ask_preference
- `partnerIntentStatusEnum`: active, matched, expired, cancelled (v4.0)
- `intentMatchOutcomeEnum`: pending, confirmed, expired, cancelled (v4.0)

**核心表** (v4.1 - 10 张):
| 表 | 核心字段 |
|---|---------|
| users | id, wxOpenId, phoneNumber, nickname, avatarUrl, aiCreateQuotaToday, workingMemory |
| activities | id, creatorId, title, location, locationHint, startAt, type, status |
| participants | id, activityId, userId, status |
| conversations | id, userId, title, messageCount, lastMessageAt (会话) |
| conversation_messages | id, conversationId, userId, role, messageType, content, activityId (消息) |
| activity_messages | id, activityId, senderId, messageType, content |
| notifications | id, userId, type, title, isRead, activityId |
| partner_intents | id, userId, type, tags, location, expiresAt, status (v4.0) |
| intent_matches | id, intentAId, intentBId, tempOrganizerId, outcome (v4.0) |
| match_messages | id, matchId, senderId, content (v4.0) |

**AI 对话持久化 (v3.9)**:
- 有登录用户的 AI 对话自动保存到 `conversation_messages` 表
- Tool 返回的 `activityId` 自动关联到消息
- 支持按 `activityId` 查询关联的对话历史

---

## ✅ 正确性属性 (CP)

### 数据一致性
- **CP-1**: `currentParticipants` = participants 表中 `status='joined'` 的记录数
- **CP-4**: 每日创建活动次数 ≤ `aiCreateQuotaToday` (默认 3)
- **CP-8**: `locationHint` 不能为空

### 认证规则
- **CP-9**: 未绑定手机号的用户不能发布/报名活动
- **CP-11**: 未登录用户可以浏览对话、查看详情、探索附近

### AI 对话
- **CP-20**: AI 对话自动持久化 - 有 userId 时保存到 conversation_messages
- **CP-21**: Tool 返回的 activityId 自动关联到 AI 响应消息

### 找搭子 (v4.0)
- **CP-23**: 同一用户同一类型只能有一个 active 意向
- **CP-24**: 意向 24h 自动过期
- **CP-25**: 匹配只在无 tag 冲突、同类型、3km 内、score ≥ 80% 时创建
- **CP-26**: Temp_Organizer 是最早创建意向的用户

---

## 🚫 Spec 任务规范

- ❌ 禁止包含测试任务
- ✅ 只包含功能实现任务（数据库、API、前端）
