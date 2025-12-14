# 聚场 (Juchang)

AI碎片化社交找搭子平台 - 基于 ElysiaJS + Bun + Next.js 的现代化全栈架构

## 🚀 快速开始（新人必读）

### 前置要求

- **Bun** >= 1.1.0 ([安装 Bun](https://bun.sh))
- **Docker** (用于运行 PostgreSQL)
- **微信开发者工具** (用于小程序开发)

### 一键启动（推荐）

```bash
# 克隆项目
git clone <repository-url>
cd juchang

# 一键设置并启动完整开发环境
bun run setup && bun run dev:full
```

这会自动：
- ✅ 初始化环境变量
- ✅ 安装所有依赖
- ✅ 启动 Docker 数据库
- ✅ 推送数据库 Schema
- ✅ 启动 API 服务器
- ✅ 启动 API 变更监听（自动生成小程序 API）

### 分步设置（如果一键启动失败）

```bash
# 1. 初始化环境变量
bun run env:init

# 2. 安装依赖
bun install

# 3. 启动数据库
bun run docker:up

# 4. 等待数据库启动（约5秒），然后推送 Schema
sleep 5 && bun run db:push

# 5. 启动完整开发环境
bun run dev:full
```

### 验证安装

启动成功后，你应该看到：

- ✅ API 服务器运行在 http://localhost:3000
- ✅ API 文档可访问 http://localhost:3000/openapi/json
- ✅ API 变更监听器正在运行
- ✅ 小程序 API 代码自动生成到 `apps/miniprogram/src/api/`

### 开始开发

1. **后端开发**：修改 `apps/api/src/` 中的代码
2. **小程序开发**：在微信开发者工具中打开 `apps/miniprogram/`
3. **Admin 开发**：运行 `bun run dev:web` 启动管理后台

API 变更会自动重新生成小程序的类型安全 API 代码！

## 📁 项目结构

```
juchang/
├── apps/
│   ├── api/          # ElysiaJS API 服务器
│   ├── web/          # Next.js Admin 后台
│   └── miniprogram/  # 微信小程序（待实现）
├── packages/
│   ├── db/           # Drizzle ORM + TypeBox Schema
│   ├── services/     # 业务逻辑层（函数式）
│   └── utils/        # 通用工具包
└── docker/           # Docker Compose 配置
```

## 🔄 开发工作流程

### 完整开发环境

```bash
bun run dev:full     # 🌟 推荐：启动 API + 自动 API 生成
bun run dev          # 启动所有服务（不含自动生成）
bun run dev:api      # 仅启动 API 服务器
bun run dev:web      # 仅启动 Admin 后台
```

### API 开发流程

1. **修改 API 代码**（`apps/api/src/`）
2. **自动重新生成**（如果使用 `dev:full`）
3. **小程序获得类型安全的 API**

```typescript
// 小程序中使用生成的 API
import { postAuthWxLogin, getUsersMe } from '@/api'

const response = await postAuthWxLogin({ code: 'wx_code' })
// 完全类型安全！
```

### API 生成命令

```bash
bun run gen:api        # 生成所有 API
bun run gen:api:mp     # 只生成小程序 API
bun run gen:api:watch  # 监听 API 变更并自动生成
```

### 数据库管理

```bash
bun run db:push        # 推送 Schema 到数据库
bun run db:generate    # 生成迁移文件
bun run db:studio      # 打开 Drizzle Studio
bun run db:reset       # 重置数据库
bun run db:seed        # 填充测试数据
```

### Docker 管理

```bash
bun run docker:up      # 启动数据库容器
bun run docker:down    # 停止容器
bun run docker:logs    # 查看数据库日志
bun run docker:restart # 重启数据库
```

### 构建和检查

```bash
bun run build         # 构建所有应用
bun run type-check    # TypeScript 类型检查
bun run lint          # 代码检查
bun run format        # 代码格式化
bun run clean         # 清理构建文件
```

## 🔗 服务地址

启动成功后可访问：

- **API 服务器**: http://localhost:3000
- **API 文档**: http://localhost:3000/openapi/json
- **健康检查**: http://localhost:3000/health
- **Admin 后台**: http://localhost:5173 (运行 `bun run dev:web`)
- **数据库管理**: 运行 `bun run db:studio`

## 📱 小程序开发

### 1. 打开小程序

在微信开发者工具中打开 `apps/miniprogram/` 目录

### 2. 使用生成的 API

```typescript
// 导入类型安全的 API
import { postAuthWxLogin, getUsersMe, putUsersMe } from '@/api'

// 微信登录
const loginResponse = await postAuthWxLogin({ code: 'wx_code' })
if (loginResponse.status === 200) {
  const { user, token } = loginResponse.data
  // 完全类型安全！
}

// 获取用户信息
const userResponse = await getUsersMe()
if (userResponse.status === 200) {
  const user = userResponse.data
  // 自动类型推断
}
```

### 3. API 自动同步

当你修改后端 API 时：
- ✅ 小程序 API 代码自动重新生成
- ✅ TypeScript 类型自动更新
- ✅ 编译时发现 API 变更

## 🚨 常见问题

### API 生成失败

```bash
# 检查 API 服务器状态
curl http://localhost:3000/health

# 手动重新生成
bun run gen:api:mp
```

### 数据库连接问题

```bash
# 重启数据库
bun run docker:restart

# 检查数据库日志
bun run docker:logs
```

### 端口冲突

如果端口被占用，可以修改：
- API 端口：`apps/api/src/index.ts` 中的 `port`
- 数据库端口：`docker/docker-compose.yml` 中的端口映射

### 类型错误

```bash
# 重新生成所有类型
bun run db:generate
bun run gen:api
bun run type-check
```

## 📚 技术栈

### 后端
- **运行时**: Bun
- **框架**: ElysiaJS + OpenAPI
- **数据库**: PostgreSQL + PostGIS + pgvector
- **ORM**: Drizzle ORM
- **验证**: TypeBox
- **认证**: JWT

### 前端
- **小程序**: 微信原生 + TDesign + Zustand
- **Admin**: Next.js 16 + App Router
- **类型安全**: Orval (小程序) + Eden Treaty (Web)

### 开发工具
- **Monorepo**: Turborepo + Bun Workspaces
- **API 生成**: Orval + 自定义微信适配器
- **数据库管理**: Drizzle Studio
- **容器化**: Docker Compose

## 📖 详细文档

- [API 生成指南](apps/miniprogram/API_GENERATION.md)
- [架构文档](docs/聚场-架构.md)
- [PRD 文档](docs/PRD.md)

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支：`git checkout -b feature/amazing-feature`
3. 提交变更：`git commit -m 'Add amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 创建 Pull Request

提交前请确保：
```bash
bun run lint        # 代码检查通过
bun run type-check  # 类型检查通过
bun run build       # 构建成功
```

## 📝 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件