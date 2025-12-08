# 聚场 (Juchang)

AI碎片化社交找搭子平台 - 基于 ElysiaJS + Bun + Next.js 的现代化全栈架构

## 🚀 快速开始

### 前置要求

- **Bun** >= 1.1.0 ([安装 Bun](https://bun.sh))
- **Docker** (用于运行 PostgreSQL + Redis)
- **Node.js** >= 20 (某些工具可能需要)

### 安装依赖

```bash
# 安装所有依赖（Monorepo）
bun install
```

### 启动开发环境

```bash
# 1. 初始化环境变量
bun run env:init

# 2. 启动 Docker 容器（PostgreSQL + Redis）
bun run docker:up

# 3. 等待数据库启动后，推送数据库 Schema
bun run db:push

# 4. 启动所有服务（API + Web）
bun run dev

# 或单独启动某个服务
bun run dev:api  # 仅启动 API 服务器
bun run dev:web  # 仅启动 Admin Web
```

### 一键设置（首次使用）

```bash
bun run setup
```

这会自动执行：环境变量初始化 → 安装依赖 → 启动 Docker → 推送数据库 Schema

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

## 🛠️ 常用命令

### 开发

```bash
bun run dev          # 启动所有服务
bun run dev:api      # 仅启动 API
bun run dev:web      # 仅启动 Web
```

### 数据库

```bash
bun run db:push      # 推送 Schema 到数据库
bun run db:generate  # 生成迁移文件
bun run db:studio    # 打开 Drizzle Studio
bun run db:reset     # 重置数据库（删除并重建）
```

### Docker

```bash
bun run docker:up     # 启动容器
bun run docker:down  # 停止容器
bun run docker:logs  # 查看日志
```

### 构建

```bash
bun run build        # 构建所有应用
bun run lint         # 代码检查
bun run format       # 代码格式化
```

## 🔗 服务地址

- **API 服务器**: http://localhost:3000
- **API 文档 (OpenAPI JSON)**: http://localhost:3000/doc/json
- **Admin Web**: http://localhost:3001 (Next.js 默认端口)
- **Drizzle Studio**: 运行 `bun run db:studio` 后访问

## 📚 技术栈

- **运行时**: Bun
- **后端框架**: ElysiaJS
- **前端框架**: Next.js 16 (App Router)
- **数据库**: PostgreSQL + PostGIS + pgvector
- **ORM**: Drizzle ORM
- **验证**: TypeBox
- **Monorepo**: Turborepo + Bun Workspaces
- **类型安全**: Eden Treaty (Web) + Orval SDK (小程序)

## 📖 文档

- [架构文档](./docs/聚场-架构.md)
- [API 文档](http://localhost:3000/doc/json) (需要启动 API 服务器)

## 📝 许可证

MIT