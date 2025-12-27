# Implementation Plan: AI-Native Homepage (Chat-First v3.2 + Generative UI)

## Overview

基于 Chat-First + Generative UI 架构重构聚场小程序首页，实现"蚂蚁阿福"式的对话优先体验。
- **创建场景**：明确意图 → Widget_Draft → 确认发布
- **探索场景**：模糊探索 → Widget_Explore → 沉浸式地图页

采用 Soft Tech 视觉风格，支持深色模式从 Day 1。

## Tasks

- [ ] 0. 数据库 Schema 优化 (Database First - 最高优先级)
  - [ ] 0.1 重命名 home_messages 为 conversations (行业标准)
    - 重命名 `packages/db/src/schema/home_messages.ts` 为 `conversations.ts`
    - 更新表名：`home_messages` → `conversations`
    - 更新枚举名：`homeMessageRoleEnum` → `conversationRoleEnum`
    - 更新枚举值：`ai` → `assistant` (符合 OpenAI 标准)
    - 更新枚举名：`homeMessageTypeEnum` → `conversationMessageTypeEnum`
    - 更新字段名：`type` → `messageType` (更明确)
    - 更新索引名：`home_messages_*_idx` → `conversations_*_idx`
    - 更新导出名称和类型
    - _Requirements: 0.1, 0.3, 0.4_
  - [ ] 0.2 重命名 group_messages 为 activity_messages (语义化)
    - 重命名 `packages/db/src/schema/group_messages.ts` 为 `activity_messages.ts`
    - 更新表名：`group_messages` → `activity_messages`
    - 更新枚举：从 enums.ts 的 `messageTypeEnum` 改为本地定义的 `activityMessageTypeEnum`
    - 更新字段名：`type` → `messageType` (更明确)
    - 更新索引名：`group_messages_*_idx` → `activity_messages_*_idx`
    - 更新导出名称和类型
    - 移除向后兼容别名（chatMessages 等）
    - _Requirements: 0.2, 0.5_
  - [ ] 0.3 修改 activities.status 默认值
    - 在 `packages/db/src/schema/activities.ts` 中修改 status 默认值
    - 从 `.default("active")` 改为 `.default("draft")`
    - _Requirements: 0.6_
  - [ ] 0.4 清理 enums.ts
    - 移除 `messageTypeEnum`（已迁移到 activity_messages.ts）
    - 保留其他枚举不变
    - _Requirements: 0.5_
  - [ ] 0.5 更新 relations.ts
    - 更新 `homeMessages` → `conversations`
    - 更新 `groupMessages` → `activityMessages`
    - 更新所有关系引用
    - _Requirements: 0.1, 0.2_
  - [ ] 0.6 更新 schema/index.ts 导出
    - 导出 `conversations` (原 home_messages)
    - 导出 `activity_messages` (原 group_messages)
    - 移除旧的导出
    - _Requirements: 0.1, 0.2_
  - [ ] 0.7 生成并执行数据库迁移
    - 运行 `bun run db:generate` 生成迁移文件
    - 运行 `bun run db:migrate` 执行迁移
    - _Requirements: 0.9, 0.10_
  - [ ] 0.8 更新 API 模块引用
    - 更新 `apps/api/src/modules/ai/` 引用 conversations 表
    - 更新 `apps/api/src/modules/chat/` 引用 activity_messages 表
    - _Requirements: 0.12_
  - [ ] 0.9 同步更新文档
    - 更新 `docs/TAD.md` 中的表名、枚举名和默认值说明
    - 更新 `.kiro/steering/juchang-rules.md` 中的表结构概览
    - _Requirements: 0.11_

- [x] 1. 数据库 Schema 变更 (已完成基础结构，待 Task 0 重构)
  - [x] 1.1 新增 home_messages 表 → **待重命名为 conversations (Task 0.1)**
    - 创建 `packages/db/src/schema/home_messages.ts`
    - 定义 homeMessageRoleEnum 和 homeMessageTypeEnum
    - homeMessageTypeEnum 包含: text, widget_dashboard, widget_draft, widget_share, **widget_explore**, widget_error
    - 定义 homeMessages 表结构（id, userId, role, type, content, activityId, createdAt）
    - 导出 TypeBox Schemas 和 TypeScript 类型
    - _Requirements: 3.1, 3.2, 3.6, 3.7, 17.1_
  - [x] 1.2 修改活动状态枚举
    - 在 `packages/db/src/schema/enums.ts` 中新增 `draft` 状态
    - 更新 activityStatusEnum: ['draft', 'active', 'completed', 'cancelled']
    - 移除 activities 表中的 chatStatus 字段（改为动态计算 isArchived）
    - _Requirements: 6.1, 6.8, 11.7_
  - [x] 1.3 重命名 chat_messages 为 group_messages → **待重命名为 activity_messages (Task 0.2)**
    - 重命名 `packages/db/src/schema/chat_messages.ts` 为 `group_messages.ts`
    - 更新表名和导出名称
    - 更新 relations.ts 中的引用
    - _Requirements: 11.2, 11.3_
  - [x] 1.4 生成并执行数据库迁移 → **需要在 Task 0 完成后重新执行**
    - 运行 `bun run db:generate` 生成迁移文件
    - 运行 `bun run db:migrate` 执行迁移
    - _Requirements: 数据库一致性_

- [x] 2. API 模块开发
  - [x] 2.1 扩展 AI 模块 - 对话历史管理
    - 更新 `apps/api/src/modules/ai/ai.model.ts` 添加对话相关 Schema
    - 更新 `apps/api/src/modules/ai/ai.service.ts` 添加对话管理函数
    - 更新 `apps/api/src/modules/ai/ai.controller.ts` 添加对话端点
    - 实现 GET /ai/conversations（分页查询 conversations 表）
    - 实现 POST /ai/conversations（添加用户消息到 conversations）
    - 实现 DELETE /ai/conversations（清空对话历史）
    - **注意**：对话历史属于 AI 功能领域，不创建独立的 home 模块
    - _Requirements: 3.2, 3.6, 2.8_
  - [x] 2.2 修改 AI 解析模块 - 意图分类
    - 更新 `apps/api/src/modules/ai/ai.service.ts`
    - **实现意图分类逻辑**：
      - 明确创建意图（时间+地点+活动类型）→ Widget_Draft
      - 模糊探索意图（"附近有什么"、"推荐"）→ Widget_Explore
      - 无法识别 → 文本消息引导
    - AI 解析成功时自动创建 draft 状态的 activity
    - 同时创建对应类型的对话记录 (conversations)
    - _Requirements: 6.1, 6.2, 6.3, 19.1, 19.2, 19.3_
  - [x] 2.3 新增 SSE 事件类型
    - 新增 `searching` 事件：探索场景搜索中
    - 新增 `explore` 事件：返回探索结果
    - _Requirements: 17.2, 19.4_
  - [x] 2.4 扩展活动模块 - 附近活动搜索
    - 在 `apps/api/src/modules/activities/activity.controller.ts` 新增端点
    - 实现 GET /activities/nearby
    - 参数：lat, lng, type (可选), radius (默认 5km)
    - 返回：活动列表 + 距离信息
    - _Requirements: 18.1, 18.5_
  - [x] 2.5 更新活动模块 - Draft 发布
    - 修改 POST /activities 支持从 draft 变 active
    - 添加时间校验（不允许发布过去时间的活动）
    - _Requirements: 6.7, 6.8_
  - [x] 2.6 更新 chat 模块
    - 将 chat 模块的表引用改为 activity_messages
    - 保持 API 路径不变 /chat/:activityId/messages
    - _Requirements: 11.3, 11.4_

- [x] 3. Checkpoint - 后端完成
  - 确保所有 API 测试通过
  - 确保数据库迁移成功
  - 确保意图分类逻辑正确
  - 如有问题请询问用户

- [ ] 4. Admin Console AI Ops 改造
  - [ ] 4.1 安装 Vercel AI SDK 依赖
    - 安装 `ai` 包 (Vercel AI SDK)
    - 安装 `react-json-view-lite` 用于 JSON 展示
    - 确保 TanStack Query 已配置
    - _Requirements: Admin AI Ops_
  - [ ] 4.2 创建 AI Playground 页面
    - 创建 `/playground` 路由
    - 集成 Vercel AI SDK `useChat` hook 连接 `/ai/parse`
    - 实现 System Prompt Override 配置面板
    - 实现消息列表渲染（用户消息右侧，AI 消息左侧）
    - _Requirements: Admin AI Ops - Playground_
  - [ ] 4.3 开发 Inspector 组件库
    - 创建 `TextInspector`: 渲染 Markdown 文本
    - 创建 `DraftInspector`: 结构化展示时间/地点/类型（带腾讯地图外链）
    - 创建 `ExploreInspector`: 展示搜索关键词、中心点坐标、结果列表
    - 创建 `RawJsonInspector`: 折叠/展开显示原始 JSON
    - 实现 `toolInvocations` 映射逻辑（根据 type 渲染不同 Inspector）
    - _Requirements: Admin AI Ops - Inspector Pattern_
  - [ ] 4.4 实现对话审计页面 (Conversation Inspector)
    - 创建 `/conversations` 路由
    - 接入 GET `/ai/conversations` API（需新增 Admin 专用分页接口）
    - 实现会话列表（标注 Widget 生成失败或意图不明的对话）
    - 实现对话详情页（复用 Playground 渲染组件，只读模式）
    - 实现 [Fix & Test] 按钮：导入对话到 Playground 重试
    - _Requirements: Admin AI Ops - Logs_
  - [ ] 4.5 更新业务数据管理页面
    - 更新 `ActivitiesTable`: 支持按状态筛选（draft/active/completed/cancelled）
    - 添加查看关联 Prompt 功能
    - 更新 `UsersTable`: 基础管理功能
    - _Requirements: Admin AI Ops - CMS_
  - [ ] 4.6 (Optional) 评测套件 (Evaluation Suite)
    - 定义 JSON 格式的测试用例（Golden Dataset）
    - 实现批量跑测逻辑
    - 生成红/绿测试报告
    - _Requirements: Admin AI Ops - Evaluation_

- [ ] 5. Checkpoint - Admin AI Ops 完成
  - 确保 Playground 可以正常调用 AI 解析
  - 确保 Inspector 组件正确渲染各类 Widget 数据
  - 确保对话审计页面可以查看历史对话
  - 如有问题请询问用户

### Phase 5.5: Admin API 端点扩展 (Consolidated from admin-api spec)

- [ ] 5.5.1 扩展 User Module 支持 Admin 端点
  - 更新 `apps/api/src/modules/users/user.model.ts` 添加 Admin Schema
  - 更新 `apps/api/src/modules/users/user.service.ts` 添加 Admin 服务函数
  - 更新 `apps/api/src/modules/users/user.controller.ts` 添加 Admin 端点
  - 实现 GET /users (分页列表)
  - 实现 GET /users/:id (用户详情)
  - 实现 PUT /users/:id (更新用户)
  - _Requirements: 25, 26, 27_

- [ ] 5.5.2 扩展 Activity Module 支持 Admin 端点
  - 更新 `apps/api/src/modules/activities/activity.model.ts` 添加 Admin Schema
  - 更新 `apps/api/src/modules/activities/activity.service.ts` 添加 Admin 服务函数
  - 更新 `apps/api/src/modules/activities/activity.controller.ts` 添加 Admin 端点
  - 实现 GET /activities (分页列表，支持状态/类型筛选)
  - _Requirements: 28_

- [ ] 5.5.3 增强 Dashboard 统计数据
  - 更新 `apps/api/src/modules/dashboard/dashboard.model.ts` 增强统计 Schema
  - 更新 `apps/api/src/modules/dashboard/dashboard.service.ts` 增强统计逻辑
  - 新增 activeUsers, userGrowthRate, activityGrowthRate 字段
  - _Requirements: 29_

- [ ] 5.5.4 更新 Admin 端 Hooks
  - 更新 `apps/admin/src/hooks/use-users.ts` 使用真实 API
  - 创建 `apps/admin/src/hooks/use-activities.ts` 使用真实 API
  - 更新活动列表页使用真实 API
  - _Requirements: Admin 端适配_

- [ ] 5.5.5 Checkpoint - Admin API 完成
  - 确保用户列表分页正常
  - 确保活动列表筛选正常
  - 确保 Dashboard 统计数据正确
  - 如有问题请询问用户

- [ ] 6. 小程序全局配置
  - [ ] 6.1 更新 app.json
    - 启用深色模式支持 `"darkmode": true`
    - 配置 theme-location 指向主题配置文件
    - 更新 window 配置
    - 移除 tabBar 配置（去 Tabbar 化）
    - 更新页面路由（新增 profile, message 页面，**新增 explore 分包页面**）
    - _Requirements: 1.2, 15.1, 18.1_
  - [ ] 6.2 创建全局样式变量（支持深色模式）
    - 在 `apps/miniprogram/app.less` 中定义语义化 CSS Variables
    - 定义浅色模式配色（--bg-page: #F5F7FA 等）
    - 定义深色模式配色（@media prefers-color-scheme: dark）
    - 深色模式使用 Slate/Navy 色板（#0F172A 背景），非纯黑
    - 深色模式卡片用边框代替阴影
    - 实现 .halo-card mixin（使用 background-origin/clip 实现渐变边框效果）
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.8_
  - [ ] 6.3 生成 API SDK
    - 运行 `bun run gen:api` 更新 Orval 生成的 SDK
    - 确保 ai 模块对话端点和 activities/nearby 的 API 类型正确
    - _Requirements: API 类型安全_

- [ ] 7. Zustand Store 开发
  - [ ] 7.1 创建 homeStore
    - 创建 `apps/miniprogram/src/stores/home.ts`
    - 实现 loadMessages, loadMoreMessages, addUserMessage, addAIMessage, clearMessages
    - 使用 immer + persist 中间件
    - 本地缓存最近 50 条消息
    - 数据来源：conversations 表
    - _Requirements: 3.2, 3.6, 2.8_

- [ ] 8. 核心组件开发
  - [ ] 8.1 创建 custom-navbar 组件
    - 创建 `apps/miniprogram/components/custom-navbar/`
    - 实现左侧 Menu 图标（跳转个人中心）
    - 实现中间品牌词"聚场"
    - 实现右侧 More 图标（显示下拉菜单）
    - 实现返回按钮逻辑（页面栈判断）
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 14.2, 14.3_
  - [ ] 8.2 创建 dropmenu 组件
    - 创建 `apps/miniprogram/components/dropmenu/`
    - 实现 [消息中心] 和 [新对话] 两个入口
    - 点击外部自动关闭
    - _Requirements: 2.5, 2.6, 2.7, 2.8_
  - [ ] 8.3 创建 ai-dock 组件
    - 创建 `apps/miniprogram/components/ai-dock/`
    - 实现输入框（placeholder: "粘贴文字，或直接告诉我..."）
    - 实现 [📋 粘贴] 和 [🎤 语音] 快捷按钮
    - 实现键盘弹起处理（adjust-position=false + 手动计算高度）
    - 实现 800ms 防抖机制
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_
  - [ ] 8.4 创建 chat-stream 组件
    - 创建 `apps/miniprogram/components/chat-stream/`
    - 实现无限滚动容器
    - 实现用户消息（右侧对齐）和 AI 消息（左侧对齐）
    - 新消息自动滚动到底部
    - _Requirements: 1.4, 3.1_
  - [ ] 8.5 创建 message-bubble 组件
    - 创建 `apps/miniprogram/components/message-bubble/`
    - 实现用户气泡样式（矢车菊蓝渐变 + 白色文字）
    - 实现 AI 气泡样式（透明背景 + 深灰文字）
    - _Requirements: 15.3, 15.4_

- [ ] 9. Widget 组件开发
  - [ ] 9.1 创建 widget-dashboard 组件
    - 创建 `apps/miniprogram/components/widget-dashboard/`
    - 实现动态问候语（根据时间变化）
    - 实现待参加活动列表（最多 3 个）
    - 实现空状态引导文案和热门 Prompt
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_
  - [ ] 9.2 创建 widget-draft 组件
    - 创建 `apps/miniprogram/components/widget-draft/`
    - 显示 AI 预填的标题、时间、地点、类型
    - 显示静态地图预览（带 binderror 兜底）
    - 静态地图根据系统主题切换样式（styleid 参数）
    - 实现 [📍 调整位置] 按钮
    - 实现 [✅ 确认发布] 按钮
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9_
  - [ ] 9.3 创建 widget-share 组件
    - 创建 `apps/miniprogram/components/widget-share/`
    - 显示原生分享卡片预览
    - 实现 [📤 分享到群] 按钮
    - 实现 [👀 查看详情] 按钮
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  - [ ] 9.4 创建 activity-mini-card 组件
    - 创建 `apps/miniprogram/components/activity-mini-card/`
    - 显示活动标题、类型图标、开始时间、地点
    - 使用同色系淡色图标底色
    - _Requirements: 4.7, 4.8, 15.6_
  - [ ] 9.5 **创建 widget-explore 组件 (Generative UI)**
    - 创建 `apps/miniprogram/components/widget-explore/`
    - 显示标题（"为你找到观音桥附近的 5 个热门活动"）
    - **显示静态地图预览（带多个 Markers）**
    - 显示活动列表（最多 3 个）
    - 实现 [🗺️ 展开地图查看更多] 按钮
    - 静态地图根据系统主题切换样式（styleid 参数）
    - 静态地图加载失败时显示兜底插画
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6_
  - [ ] 9.6 创建 activity-list-item 组件
    - 创建 `apps/miniprogram/components/activity-list-item/`
    - 显示活动标题、类型图标、距离、时间、地点
    - 用于 Widget_Explore 和沉浸式地图页
    - _Requirements: 17.5, 18.6_
  - [ ] 9.7 创建 filter-bar 组件
    - 创建 `apps/miniprogram/components/filter-bar/`
    - 实现横向滚动筛选栏
    - 筛选项：全部、美食、运动、桌游、娱乐
    - _Requirements: 18.3_
  - [ ] 9.8 **创建 widget-launcher 组件 (Composite Widget)**
    - 创建 `apps/miniprogram/components/widget-launcher/`
    - 实现三层结构：Header (场景定义) + Body (双栏功能区) + Footer (辅助工具)
    - Header: 图标 + 标题"发起活动" + Badge"AI 辅助中"
    - Body 左侧: 极速建局 - 粘贴群接龙文本，AI 一键提取
    - Body 右侧: 探索附近 - 在地图上找灵感
    - Footer: 辅助工具网格 (掷骰子、AA计算、发起投票)
    - 实现 Halo Card 渐变边框效果
    - 支持深色模式
    - _Requirements: Composite Widget Design, 功能外露_
  - [ ] 9.9 **创建 widget-action 组件 (Simple Widget)**
    - 创建 `apps/miniprogram/components/widget-action/`
    - 实现简单跳转按钮：label + icon + url
    - 使用 Halo Card Mini 样式（紧凑版渐变边框）
    - 支持三种样式变体：primary / secondary / ghost
    - 支持深色模式
    - _Requirements: Simple Widget Design, 快捷操作_

- [ ] 10. Checkpoint - 组件完成
  - 确保所有组件样式符合 Soft Tech 规范
  - 确保键盘弹起处理正常
  - 确保 Widget_Explore 使用静态地图图片
  - 如有问题请询问用户

- [ ] 11. 首页重构
  - [ ] 11.1 重构 pages/home/index
    - 实现三层结构：Custom_Navbar + Chat_Stream + AI_Dock
    - 集成 homeStore（subscribe 模式）
    - 实现空气感渐变背景
    - 首次进入显示 Widget_Dashboard
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.2_
  - [ ] 11.2 实现 AI 解析流程 (创建场景)
    - 用户发送消息 → 显示用户气泡
    - 调用 AI 解析 API（SSE）
    - 处理流式响应（粘包处理）
    - 显示 Widget_Draft
    - _Requirements: 3.6, 3.7, 5.7_
  - [ ] 11.3 **实现 AI 解析流程 (探索场景 - Generative UI)**
    - 用户发送探索性问题 → 显示用户气泡
    - 调用 AI 解析 API（SSE）
    - 处理 `searching` 事件 → 显示"正在搜索..."
    - 处理 `explore` 事件 → 逐步渲染 Widget_Explore
    - _Requirements: 17.1, 17.2, 19.1, 19.2, 19.4_
  - [ ] 11.4 实现手机号绑定拦截
    - 点击确认发布时检查手机号
    - 未绑定则弹出 phone-auth-modal
    - 绑定成功后继续执行
    - _Requirements: 6.7, 12.2, 12.3, 12.4, 12.5_

- [ ] 12. **沉浸式地图页开发 (Generative UI)**
  - [ ] 12.1 创建 explore 页面
    - 创建 `apps/miniprogram/subpackages/activity/explore/`
    - 实现全屏可交互地图
    - 实现 Custom_Navbar（标题"探索附近"，返回按钮）
    - 实现 filter-bar 筛选栏
    - _Requirements: 18.1, 18.2, 18.3_
  - [ ] 12.2 实现地图交互
    - 显示活动 Markers（限制 ≤ 20 个）
    - 点击 Marker 显示活动简要信息
    - 地图拖拽后自动加载新区域活动（防抖）
    - _Requirements: 18.4, 18.5_
  - [ ] 12.3 实现 Bottom Sheet 活动列表
    - 显示当前区域活动列表
    - 点击活动项跳转详情页
    - _Requirements: 18.6, 18.7_
  - [ ] 12.4 实现沉浸式展开/收缩动画
    - 从 Widget_Explore 点击展开时使用放大动画
    - 返回时使用收缩动画（非标准页面返回）
    - _Requirements: 18.8_

- [ ] 13. 二级页面开发
  - [ ] 13.1 创建 pages/profile/index（个人中心）
    - 实现 Inset Grouped List 风格
    - Header: 头像、昵称、Slogan
    - Group 1: [我发布的]、[我参与的]、[历史归档]
    - Group 2: [手机绑定]、[隐私设置]
    - Group 3: [关于聚场]、[意见反馈]
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10_
  - [ ] 13.2 创建 pages/message/index（消息中心）
    - 显示所有参与的活动群聊列表
    - 显示活动标题、最后一条消息、未读数量
    - 点击跳转到 Lite_Chat 页面
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  - [ ] 13.3 更新活动详情页
    - 使用 custom-navbar（处理单页进入返回逻辑）
    - 显示活动完整信息
    - 实现报名/取消报名
    - 实现活动管理按钮（发起人可见）
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_
  - [ ] 13.4 更新活动确认页
    - 允许修改时间和标题（不仅仅是地图选点）
    - 校验时间不能是过去
    - _Requirements: 6.8, 草稿时效性_
  - [ ] 13.5 创建活动列表页
    - 创建 `apps/miniprogram/subpackages/activity/list/index`
    - 支持 type 参数（created/joined/archived）
    - 复用 activity-mini-card 组件
    - _Requirements: 8.5, 8.6, 8.7_
  - [ ] 13.6 实现 Widget_Draft 过期状态
    - 根据 `startAt` 动态计算是否过期
    - 过期状态：灰色卡片 + 禁用按钮 + 显示"已过期"标签
    - 过期的 Widget_Draft 不可点击"确认发布"
    - _Requirements: 6.8, CP-19_

- [ ] 14. 活动群聊更新
  - [ ] 14.1 更新 pages/chat/index（Lite_Chat）
    - 显示活动信息头部
    - 实现消息发送和显示
    - 实现轮询机制（5-10 秒）
    - 实现 onHide 停止轮询、onShow 恢复轮询
    - 实现归档状态（只读 + 提示）
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8_

- [ ] 15. 分享功能
  - [ ] 15.1 实现原生分享
    - 在活动详情页和 Widget_Share 实现 onShareAppMessage
    - 使用 AI 生成的骚气标题
    - 使用腾讯地图静态图 API 生成预览图
    - _Requirements: 13.1, 13.2, 13.3, 13.4_
  - [ ] 15.2 实现首页回流兜底
    - 分享卡片进入时页面栈长度为 1
    - 返回时调用 wx.reLaunch 跳转首页
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

- [ ] 16. Final Checkpoint - 功能完成
  - 确保所有功能正常工作
  - 确保深色模式正常显示（Slate/Navy 色板）
  - 确保静态地图在深色模式下使用深色样式
  - 确保 Widget_Explore 和沉浸式地图页正常工作
  - 确保意图分类逻辑正确（创建 vs 探索）
  - 如有问题请询问用户

## Notes

- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- **Task 0 (Schema 优化) 是最高优先级**，必须先完成再继续其他任务
- **行业标准命名**：
  - `conversations` (用户与 AI 对话，符合行业标准)
  - `activity_messages` (活动群聊消息，语义化)
  - `conversation_role` 使用 `user` | `assistant` (符合 OpenAI 标准)
- **activities.status 默认值为 draft**：符合 AI 解析 → 用户确认的工作流
- **深色模式从 Day 1 支持**：使用语义化 CSS 变量，一套代码适配两种模式
- 深色模式使用 Slate/Navy 色板（#0F172A），非纯黑
- 深色模式卡片用边框代替阴影
- 静态地图使用 styleid 参数切换深色样式
- 键盘弹起处理是关键，需要手动计算高度
- SSE 流式响应需要处理粘包问题
- 静态地图需要 binderror 兜底
- **Widget_Explore 必须使用静态地图图片**，避免 map 组件与 scroll-view 手势冲突
- **沉浸式地图页使用 page-container 或自定义动画**，实现"卡片放大"效果
- **意图分类是 Generative UI 的核心**，需要在 AI 服务端实现

## v3.2 新增任务总结

| 任务 | 说明 |
|------|------|
| 2.1 | AI 模块扩展 - 对话历史管理 (GET/POST/DELETE /ai/conversations) |
| 2.2 | AI 意图分类逻辑 |
| 2.3 | SSE 新事件类型 (searching, explore) |
| 2.4 | 活动模块扩展 - GET /activities/nearby |
| 7.5 | Widget_Explore 组件 |
| 7.6 | activity-list-item 组件 |
| 7.7 | filter-bar 组件 |
| 9.3 | 探索场景 AI 解析流程 |
| 10.x | 沉浸式地图页 (explore) |

---

## Future Features (Icebox) 🧊

> **Phase 2: 视觉增长引擎** - 当需要破圈传播时上线

### AI 海报生成 API (High Priority for Growth)

**核心逻辑**：Frontend Canvas is dead. Long live Backend Puppeteer.

**API 端点**：`POST /share/poster`
- **调用方**：小程序、Admin 后台
- **功能**：根据活动信息生成设计级朋友圈海报

**为什么不用小程序 Canvas？**
- Canvas 绘图代码像裹脚布，效果像 2010 年的 PPT
- 无法使用 `backdrop-filter`、`mask-image` 等高级 CSS
- 字体受限，无法加载艺术字体

**架构设计**：
```
客户端点击"生成海报" 
  → POST /share/poster { activityId }
  → Elysia API 组装数据 
  → (可选) AI 生成背景图 
  → Puppeteer 渲染 HTML 模板 
  → 截图上传 CDN 
  → 返回 { posterUrl }
  → 小程序: wx.previewImage 保存/发圈
  → Admin: 直接展示/下载
```

**技术栈**：
| 层级 | 技术 | 说明 |
|------|------|------|
| API 层 | Elysia `/share/poster` | 统一入口，供小程序和 Admin 调用 |
| 渲染层 | Puppeteer + HTML | CSS 就是画笔，Halo Card 样式 100% 复用 |
| 内容层 | Flux/SDXL API | AI 生成独一无二的活动背景图 |
| 组装层 | Puppeteer Composition | 二维码 + AI 图 + 文字信息拼接 |
| 存储层 | CDN (OSS/S3) | 海报图片持久化存储 |

**API 设计**：
```typescript
// POST /share/poster
// Request
{ activityId: string; style?: 'default' | 'cyberpunk' | 'minimal' }

// Response
{ 
  posterUrl: string;      // CDN 链接
  cached: boolean;        // 是否命中缓存
  generatedAt: string;    // 生成时间
}
```

**子任务**：
- [ ] 创建 share 模块 (`apps/api/src/modules/share/`)
- [ ] 实现 `POST /share/poster` 接口
- [ ] 搭建 Puppeteer 服务 (或接入 Browserless.io)
- [ ] 设计 HTML 海报模板 (复用 Halo Card 视觉风格)
- [ ] 接入 Flux/SDXL API 实现"根据活动内容生成背景图"
- [ ] 实现海报合成：AI 背景 + 活动信息 + 小程序码
- [ ] 实现缓存机制：同一活动只生成一次，后续直接返回 CDN 链接
- [ ] 小程序端：异步轮询 + "AI 正在绘制您的专属海报..." 提示
- [ ] Admin 端：海报预览和下载功能

**用户爽点**：
- "每次生成的卡片都不一样！" → 刺激用户反复创建活动
- 朋友圈海报设计感拉满 → 提高分享意愿和转化率

**策略**：
- **Phase 1 (MVP)**：用 Native Share Card 解决"快"和"群聊"的问题
- **Phase 2 (Growth)**：用 AI 海报 API 解决"美"和"朋友圈"的问题

---

### 其他 Icebox 功能

- [ ] 靠谱度系统 (用户信誉积分)
- [ ] 付费推广 (活动置顶)
- [ ] 图片上传 (活动封面)
- [ ] 幽灵锚点 (运营填充的虚拟活动)
