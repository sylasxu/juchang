---
inclusion: fileMatch
fileMatchPattern: "apps/miniprogram/**/*"
---

# 小程序 API 开发指南

## Orval SDK 使用

小程序使用 Orval 从 Elysia API 自动生成类型安全的 API 客户端。

### 生成命令

```bash
# 先启动 API 服务
bun run dev:api

# 生成 SDK
cd apps/miniprogram
bun run gen:api
```

### 文件结构

```
src/api/
├── endpoints/           # 按标签分组的 API 函数
│   ├── auth/
│   ├── users/
│   ├── activities/
│   └── ...
├── model/              # TypeScript 类型定义
└── index.ts           # 统一导出
```

### 使用示例

```typescript
import { postAuthWxLogin, getUsersMe, getActivitiesNearby } from '@/api'

// 微信登录
const response = await postAuthWxLogin({ code: 'wx_code' })
if (response.status === 200) {
  wx.setStorageSync('token', response.data.token)
}

// 获取附近活动
const activities = await getActivitiesNearby({
  lat: 29.5,
  lng: 106.5,
  radius: 5
})
```

## 请求适配器

`src/utils/wx-request.ts` 将 fetch 调用转换为 `wx.request`：
- 自动注入 Authorization Token
- 处理 401 未授权错误
- 完整的 TypeScript 类型支持

## 注意事项

1. **生成前必须启动 API 服务** - Orval 需要访问 `http://localhost:3000/openapi/json`
2. **生成的代码不提交 Git** - `endpoints/` 和 `model/` 已在 `.gitignore`
3. **开发者工具设置** - 勾选「不校验合法域名」才能访问 localhost

## 局域网调试（真机预览）

小程序真机预览时需要通过局域网 IP 访问本地 API：

### 1. API 配置

API 默认监听 `0.0.0.0:3000`，已支持局域网访问。如需修改：

```bash
# .env
API_HOST=0.0.0.0  # 监听所有网卡
API_PORT=3000
```

### 2. 获取局域网 IP

```bash
# macOS
ipconfig getifaddr en0

# 或查看所有网卡
ifconfig | grep "inet " | grep -v 127.0.0.1
```

### 3. 小程序配置

在 `src/utils/wx-request.ts` 或环境配置中设置 API 地址：

```typescript
// 开发环境使用局域网 IP
const BASE_URL = __DEV__ 
  ? 'http://192.168.x.x:3000'  // 替换为你的局域网 IP
  : 'https://api.juchang.com'
```

### 4. 微信开发者工具设置

- 勾选「不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书」
- 位置：详情 → 本地设置

### 5. 真机调试

1. 确保手机和电脑在同一 WiFi 网络
2. 使用「真机调试」或「预览」功能
3. 如遇连接问题，检查防火墙是否放行 3000 端口

## 故障排除

```bash
# 检查 API 是否可访问
curl http://localhost:3000/openapi/json

# 清理并重新生成
rm -rf src/api/endpoints src/api/model
bun run gen:api
```
