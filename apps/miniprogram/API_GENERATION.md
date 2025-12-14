# 小程序 API 生成技术指南

本文档详细说明如何使用 [Orval](https://orval.dev/) 从 Elysia API 自动生成类型安全的微信小程序 API 客户端。

> 💡 **新人提示**：日常开发只需运行 `bun run dev:full`，API 会自动生成。本文档主要用于了解技术细节。

## 📁 生成的文件结构

```
src/api/
├── endpoints/           # 按 OpenAPI 标签分组的 API 函数
│   ├── auth/           # 认证相关 API
│   ├── users/          # 用户相关 API
│   ├── activities/     # 活动相关 API
│   ├── ai/             # AI 相关 API
│   ├── participants/   # 参与者相关 API
│   └── dashboard/      # 仪表板相关 API
├── model/              # TypeScript 类型定义
└── index.ts           # 统一导出文件
```

## 🔧 配置文件

### `orval.config.ts`

```typescript
import { defineConfig } from 'orval'

export default defineConfig({
  juchang: {
    input: {
      target: 'http://localhost:3000/openapi/json',
    },
    output: {
      mode: 'tags-split',        // 按标签分组
      target: 'src/api/endpoints',
      schemas: 'src/api/model',
      client: 'fetch',           // 使用 fetch 客户端
      mock: false,
      clean: true,               // 清理旧文件
      prettier: true,            // 格式化代码
      override: {
        mutator: {
          path: './src/utils/wx-request.ts',
          name: 'wxRequest',      // 使用微信请求适配器
        },
      },
    },
  },
})
```

### `src/utils/wx-request.ts`

微信小程序请求适配器，将 Orval 生成的 fetch 调用转换为 `wx.request`：

- ✅ 自动注入 Authorization Token
- ✅ 处理 401 未授权错误
- ✅ 完整的 TypeScript 类型支持
- ✅ 错误处理和重试机制

## 📝 使用示例

### 导入 API

```typescript
import { 
  postAuthWxLogin, 
  getUsersMe, 
  putUsersMe,
  getActivities 
} from '@/api'
```

### 微信登录

```typescript
try {
  const response = await postAuthWxLogin({ code: 'wx_code' })
  
  if (response.status === 200) {
    const { user, token } = response.data
    // 保存登录信息
    wx.setStorageSync('token', token)
    wx.setStorageSync('userInfo', user)
  }
} catch (error) {
  console.error('登录失败:', error)
}
```

### 获取用户信息

```typescript
try {
  const response = await getUsersMe()
  
  if (response.status === 200) {
    const user = response.data
    console.log('用户信息:', user)
  }
} catch (error) {
  console.error('获取用户信息失败:', error)
}
```

### 更新用户信息

```typescript
try {
  const response = await putUsersMe({
    nickname: '新昵称',
    bio: '个人简介'
  })
  
  if (response.status === 200) {
    const updatedUser = response.data
    console.log('更新成功:', updatedUser)
  }
} catch (error) {
  console.error('更新失败:', error)
}
```

## 🔧 技术实现

### 核心组件

1. **Orval 配置** (`orval.config.ts`)
2. **微信请求适配器** (`src/utils/wx-request.ts`)
3. **Turborepo 集成** (自动化流程)

### 手动生成命令

```bash
# 在项目根目录
bun run gen:api:mp        # 生成小程序 API
bun run gen:api:watch     # 监听变更并自动生成

# 在小程序目录
cd apps/miniprogram
bun run gen:api          # 直接生成
```

### 2. 类型安全保证

- 如果后端 API 有破坏性变更，TypeScript 会在编译时报错
- 所有 API 调用都有完整的类型推断
- 请求参数和响应数据都有类型检查

### 3. Git 版本控制

生成的 API 代码已添加到 `.gitignore`：

```gitignore
# Orval 生成的 API 文件 (可以重新生成，不需要提交)
apps/miniprogram/src/api/endpoints/
apps/miniprogram/src/api/model/
```

**原因：**
- 生成的代码可以随时重新生成
- 避免 merge 冲突
- 保持仓库干净
- 确保使用最新的 API 定义

## ⚡ Turborepo 集成

本项目使用 Turborepo 管理构建流程，API 生成已集成到构建管道中：

### 依赖关系

```
API 构建 → 小程序 API 生成 → 小程序构建/开发
```

### 自动触发

以下操作会自动触发 API 生成：

- `bun run build` - 构建时自动生成
- `bun run dev` - 开发时自动生成
- `bun run type-check` - 类型检查前自动生成
- `bun run lint` - 代码检查前自动生成

### 缓存策略

- API 生成不使用缓存（`cache: false`）
- 监听 API 源码变更（`inputs` 配置）
- 输出到指定目录（`outputs` 配置）

## 🚨 注意事项

### 1. 服务器必须运行

生成 API 代码前，确保 Elysia API 服务器正在运行：

```bash
# 检查 API 是否可访问
curl http://localhost:3000/openapi/json
```

### 2. 自动化优势

使用 `bun run dev:full` 的优势：

- ✅ 无需手动重新生成 API
- ✅ 实时类型安全检查
- ✅ 减少开发中断
- ✅ 避免忘记更新 API

### 3. 类型兼容性

如果遇到类型错误，可能需要：

- 检查后端 API 的 TypeBox 定义
- 更新 `src/types/global.d.ts` 中的类型定义
- 重新生成 API 代码

## 🛠️ 故障排除

### 问题：Orval 生成失败

```bash
# 检查 API 服务器状态
curl http://localhost:3000/health

# 检查 OpenAPI 规范
curl http://localhost:3000/openapi/json
```

### 问题：TypeScript 类型错误

```bash
# 清理并重新生成
rm -rf src/api/endpoints src/api/model
bun run orval
```

### 问题：微信请求失败

检查 `src/utils/wx-request.ts` 中的 `BASE_URL` 配置。

## 📚 相关文档

- [Orval 官方文档](https://orval.dev/)
- [Elysia OpenAPI 插件](https://elysiajs.com/plugins/swagger)
- [微信小程序网络 API](https://developers.weixin.qq.com/miniprogram/dev/api/network/request/wx.request.html)