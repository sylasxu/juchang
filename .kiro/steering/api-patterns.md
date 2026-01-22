---
inclusion: fileMatch
fileMatchPattern: "apps/api/**/*.ts"
---

# API 层设计规范

## 🎯 核心原则

### API 是领域模型的表达，不是前端的附庸

```
✅ 正确：按功能领域组织 → auth/, users/, activities/, chat/, ai/
❌ 错误：按页面组织 → home/, profile/
❌ 错误：按客户端组织 → admin/, miniprogram/
```

**检验标准**：换一个前端框架，API 需要改吗？需要改 = 设计有问题

### 显式参数设计

```typescript
// ❌ 隐式行为
GET /notifications  // 无 JWT 返回所有，有 JWT 返回当前用户的

// ✅ 显式参数
GET /notifications?scope=mine    // 查自己的（默认）
GET /notifications?scope=all     // 查所有（需 Admin 权限）
GET /notifications?userId=xxx    // 查指定用户（需 Admin 权限）
```

---

## 📁 模块职责

| 模块 | 职责 | 不包含 |
|------|------|--------|
| auth | 微信登录、手机号绑定、Token | 用户资料管理 |
| users | 用户 CRUD、额度、统计 | - |
| activities | 活动 CRUD、报名、附近搜索 | 群聊消息 |
| chat | 活动群聊消息 | AI 对话历史 |
| ai | AI 解析、对话历史、工具调用、语义检索 | - |
| participants | 报名管理 | - |
| notifications | 通知推送 | - |
| reports | 举报处理 | - |
| content-security | 内容安全检测 | - |
| feedbacks | 用户反馈 | - |
| transactions | 额度交易记录 | - |
| upload | 文件上传 | - |
| wechat | 微信回调 | - |

---

## 📐 Controller 模式

```typescript
// 文件结构
modules/{module}/
├── {module}.controller.ts  # Elysia 路由
├── {module}.service.ts     # 纯函数业务逻辑
└── {module}.model.ts       # TypeBox Schema

// Controller 规范
export const userController = new Elysia({ prefix: '/users' })
  .use(basePlugins)
  .use(userModel)
  .get('/', handler, { detail, query, response })

// 错误处理
if (!user) {
  set.status = 404;
  return { code: 404, msg: '用户不存在' } satisfies ErrorResponse;
}

// Service 规范 - 纯函数
export async function getUserById(id: string) {
  return await db.query.users.findFirst({ where: eq(users.id, id) });
}
```

---

## 📊 Schema 派生

```typescript
import { selectUserSchema, insertUserSchema } from '@juchang/db';

// 选择字段
const UserResponseSchema = t.Pick(selectUserSchema, ['id', 'nickname', 'avatarUrl']);

// 排除敏感字段
const PublicUserSchema = t.Omit(selectUserSchema, ['wxOpenId', 'phoneNumber']);

// 扩展字段
const UserWithStatsSchema = t.Intersect([
  t.Pick(selectUserSchema, ['id', 'nickname']),
  t.Object({ activityCount: t.Number() }),
]);
```

---

## 🔐 认证模式

```typescript
// 公开端点
GET /activities/:id      // 活动详情
GET /activities/nearby   // 附近活动

// 需要认证
POST /activities         // 创建活动
POST /ai/chat            // AI 对话

// 认证检查
const user = await verifyAuth(jwt, headers);
if (!user) {
  set.status = 401;
  return { code: 401, msg: '未授权' } satisfies ErrorResponse;
}
```

---

## 📅 SQL 日期参数

```typescript
import { db, sql, toTimestamp } from '@juchang/db';

// ❌ 错误：直接传递 Date
const result = await db.execute(sql`
  SELECT * FROM table WHERE created_at >= ${startDate}
`);

// ✅ 正确：使用 toTimestamp
const result = await db.execute(sql`
  SELECT * FROM table WHERE created_at >= ${toTimestamp(startDate)}
`);
```

---

## 🛠️ 数据库命令

```bash
# ✅ 正确：使用 db:push 同步 Schema 到数据库
bun run db:push

# ❌ 禁止：不要使用 db:migrate
# bun run db:migrate  ← 不要用这个！
```

**原因**：开发阶段使用 `db:push` 更快捷，直接同步 Schema 变更到数据库。

---

## ✅ Checklist

- [ ] 端点表达领域能力，不是前端需求
- [ ] 使用显式参数控制行为
- [ ] Schema 从 `@juchang/db` 派生
- [ ] Service 是纯函数
- [ ] 错误返回 `ErrorResponse` 格式
- [ ] SQL Date 参数使用 `toTimestamp()`
