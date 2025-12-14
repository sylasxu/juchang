# 小程序 API 集成测试指南

## 当前状态

✅ **已完成**：
- TypeScript 环境配置
- Zustand 状态管理集成
- 微信小程序 HTTP 客户端适配器
- Orval API 代码生成
- 用户认证流程（微信登录）
- 用户信息管理（获取、更新）
- 核心页面 TypeScript 转换（登录、个人中心、个人资料编辑）

🔄 **进行中**：
- API 集成测试和验证

## 测试步骤

### 1. 启动后端服务

确保 API 服务器正在运行：

```bash
# 在项目根目录
cd apps/api
bun run dev
```

服务器应该在 `http://localhost:3000` 启动。

### 2. 在微信开发者工具中测试

1. 用微信开发者工具打开 `apps/miniprogram` 目录
2. 在控制台中运行测试脚本：

```javascript
// 加载测试脚本
require('./test-api.js')

// 运行完整测试
runFullTest()

// 或者单独测试各个功能
testApiConnection()  // 测试 API 连接
testWxLogin()       // 测试微信登录
testGetUserInfo()   // 测试用户信息获取
```

### 3. 测试用户流程

1. **登录流程**：
   - 打开小程序
   - 进入登录页面 (`pages/login/login`)
   - 点击微信登录按钮
   - 验证登录成功并跳转到首页

2. **个人中心**：
   - 切换到"我的"标签页
   - 验证用户信息显示正确
   - 点击"个人资料"进入编辑页面

3. **资料编辑**：
   - 修改昵称、性别、个人简介
   - 点击保存
   - 验证信息更新成功

## API 端点

当前已集成的 API 端点：

- `POST /auth/wx-login` - 微信登录
- `GET /users/me` - 获取当前用户信息
- `PUT /users/me` - 更新用户信息
- `POST /upload/avatar` - 上传头像（待实现）

## 技术栈

- **状态管理**: Zustand + Immer
- **HTTP 客户端**: 自定义微信小程序适配器
- **API 生成**: Orval (基于 OpenAPI)
- **类型安全**: TypeScript
- **UI 组件**: TDesign Miniprogram

## 下一步计划

1. ✅ 完成 API 集成测试
2. 🔄 实现头像上传功能
3. 📋 转换剩余页面到 TypeScript
4. 🗺️ 实现地图和活动功能
5. 🤖 集成 AI 对话功能

## 故障排除

### API 连接失败
- 检查后端服务器是否启动
- 确认端口 3000 没有被占用
- 检查网络连接

### 微信登录失败
- 确认小程序 AppID 配置正确
- 检查后端微信配置
- 查看控制台错误信息

### 类型错误
- 运行 `bun run type-check` 检查 TypeScript 错误
- 确认所有依赖已正确安装

## 联系方式

如有问题，请查看控制台日志或联系开发团队。