# Implementation Plan: AI-Native Homepage (Chat-First v3.2 + Generative UI)

## Overview

基于 Chat-First + Generative UI 架构重构聚场小程序首页，实现"蚂蚁阿福"式的对话优先体验。
- **创建场景**：明确意图 → Widget_Draft → 确认发布
- **探索场景**：模糊探索 → Widget_Explore → 沉浸式地图页

采用 Soft Tech 视觉风格，支持深色模式从 Day 1。

## Tasks

- [x] 0. 数据库 Schema 优化 (Database First - 最高优先级)
  - [x] 0.1 重命名 home_messages 为 conversations (行业标准)
    - 重命名 `packages/db/src/schema/home_messages.ts` 为 `conversations.ts`
    - 更新表名：`home_messages` → `conversations`
    - 更新枚举名：`homeMessageRoleEnum` → `conversationRoleEnum`
    - 更新枚举值：`ai` → `assistant` (符合 OpenAI 标准)
    - 更新枚举名：`homeMessageTypeEnum` → `conversationMessageTypeEnum`
    - 更新字段名：`type` → `messageType` (更明确)
    - 更新索引名：`home_messages_*_idx` → `conversations_*_idx`
    - 更新导出名称和类型
    - _Requirements: 0.1, 0.3, 0.4_
  - [x] 0.2 重命名 group_messages 为 activity_messages (语义化)
    - 重命名 `packages/db/src/schema/group_messages.ts` 为 `activity_messages.ts`
    - 更新表名：`group_messages` → `activity_messages`
    - 更新枚举：从 enums.ts 的 `messageTypeEnum` 改为本地定义的 `activityMessageTypeEnum`
    - 更新字段名：`type` → `messageType` (更明确)
    - 更新索引名：`group_messages_*_idx` → `activity_messages_*_idx`
    - 更新导出名称和类型
    - 移除向后兼容别名（chatMessages 等）
    - _Requirements: 0.2, 0.5_
  - [x] 0.3 修改 activities.status 默认值
    - 在 `packages/db/src/schema/activities.ts` 中修改 status 默认值
    - 从 `.default("active")` 改为 `.default("draft")`
    - _Requirements: 0.6_
  - [x] 0.4 清理 enums.ts
    - 移除 `messageTypeEnum`（已迁移到 activity_messages.ts）
    - 保留其他枚举不变
    - _Requirements: 0.5_
  - [x] 0.5 更新 relations.ts
    - 更新 `homeMessages` → `conversations`
    - 更新 `groupMessages` → `activityMessages`
    - 更新所有关系引用
    - _Requirements: 0.1, 0.2_
  - [x] 0.6 更新 schema/index.ts 导出
    - 导出 `conversations` (原 home_messages)
    - 导出 `activity_messages` (原 group_messages)
    - 移除旧的导出
    - _Requirements: 0.1, 0.2_
  - [x] 0.7 生成并执行数据库迁移
    - 运行 `bun run db:generate` 生成迁移文件
    - 运行 `bun run db:migrate` 执行迁移
    - _Requirements: 0.9, 0.10_
  - [x] 0.8 更新 API 模块引用
    - 更新 `apps/api/src/modules/ai/` 引用 conversations 表
    - 更新 `apps/api/src/modules/chat/` 引用 activity_messages 表
    - _Requirements: 0.12_
  - [x] 0.9 同步更新文档
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

- [x] 4. Admin Console AI Ops 改造
  - [x] 4.1 安装 Vercel AI SDK 依赖
    - 安装 `ai` 包 (Vercel AI SDK)
    - 安装 `react-json-view-lite` 用于 JSON 展示
    - 确保 TanStack Query 已配置
    - _Requirements: Admin AI Ops_
  - [x] 4.2 创建 AI Playground 页面
    - 创建 `/playground` 路由
    - 集成 Vercel AI SDK `useChat` hook 连接 `/ai/parse`
    - 实现 System Prompt Override 配置面板
    - 实现消息列表渲染（用户消息右侧，AI 消息左侧）
    - _Requirements: Admin AI Ops - Playground_
  - [x] 4.3 开发 Inspector 组件库
    - 创建 `TextInspector`: 渲染 Markdown 文本
    - 创建 `DraftInspector`: 结构化展示时间/地点/类型（带腾讯地图外链）
    - 创建 `ExploreInspector`: 展示搜索关键词、中心点坐标、结果列表
    - 创建 `RawJsonInspector`: 折叠/展开显示原始 JSON
    - 实现 `toolInvocations` 映射逻辑（根据 type 渲染不同 Inspector）
    - _Requirements: Admin AI Ops - Inspector Pattern_
  - [x] 4.4 实现对话审计页面 (Conversation Inspector)
    - 创建 `/conversations` 路由
    - 接入 GET `/ai/conversations` API（需新增 Admin 专用分页接口）
    - 实现会话列表（标注 Widget 生成失败或意图不明的对话）
    - 实现对话详情页（复用 Playground 渲染组件，只读模式）
    - 实现 [Fix & Test] 按钮：导入对话到 Playground 重试
    - _Requirements: Admin AI Ops - Logs_
  - [x] 4.5 更新业务数据管理页面
    - 更新 `ActivitiesTable`: 支持按状态筛选（draft/active/completed/cancelled）
    - 添加查看关联 Prompt 功能
    - 更新 `UsersTable`: 基础管理功能
    - _Requirements: Admin AI Ops - CMS_
  - [ ] 4.6 (Optional) 评测套件 (Evaluation Suite)
    - 定义 JSON 格式的测试用例（Golden Dataset）
    - 实现批量跑测逻辑
    - 生成红/绿测试报告
    - _Requirements: Admin AI Ops - Evaluation_
  - [x] 4.7 **重构 Playground 使用 useChat + /ai/chat (ai@6 + @ai-sdk/react@3)** ✅
    - 集成 `@ai-sdk/react` v3 的 `useChat` hook + `DefaultChatTransport` 连接 `/ai/chat`
    - 配置 `body: { source: 'admin' }` 跳过额度消耗
    - 使用 SDK 辅助函数 `isToolUIPart()` 和 `getToolName()` 处理 Tool Parts
    - 保留现有 UI 组件（MessageItem, ToolCallCard, ToolPreview, TypeBadge）
    - Tool states: `input-streaming` | `input-available` | `output-available` | `output-error`
    - _Requirements: 25.1, 25.5, 25.6, 25.7_

- [x] 5. Checkpoint - Admin AI Ops 完成
  - 确保 Playground 可以正常调用 AI 解析
  - 确保 Inspector 组件正确渲染各类 Widget 数据
  - 确保对话审计页面可以查看历史对话
  - 如有问题请询问用户

- [x] 6. 小程序全局配置
  - [x] 6.0 **实现 Data Stream 解析器 (v3.4 新增)**
    - 创建 `apps/miniprogram/src/utils/data-stream-parser.ts`
    - 实现 `parseDataStream(chunk: string)` 函数
    - 处理文本块 `0:"..."` → 累积文本
    - 处理 Tool Call `9:{...}` → 提取工具名和参数
    - 处理 Tool Result `a:{...}` → 提取结果数据
    - 处理完成信号 `d:{...}` → 提取 usage 统计
    - 实现 buffer 机制处理不完整的 JSON
    - 导出 `DataStreamParser` class 或 `createDataStreamParser()` 工厂函数
    - _Requirements: 26.1, 26.2, 26.3, 26.4, 26.5, 26.6, 26.7_
  - [x] 6.1 更新 app.json
    - 启用深色模式支持 `"darkmode": true`
    - 配置 theme-location 指向主题配置文件
    - 更新 window 配置
    - 移除 tabBar 配置（去 Tabbar 化）
    - 更新页面路由（新增 profile, message 页面，**新增 explore 分包页面**）
    - _Requirements: 1.2, 15.1, 18.1_
  - [x] 6.2 创建全局样式变量（Crypto-Clean 风格 + 深色模式）
    - 在 `apps/miniprogram/app.less` 中定义 Crypto-Clean 语义化 CSS Variables
    - 定义浅色模式配色（--bg-page: #FAFBFC 极简白）
    - 定义深色模式配色（@media prefers-color-scheme: dark，Slate/Navy 色板）
    - 深色模式使用 Slate/Navy 色板（#0F172A 背景），非纯黑
    - 深色模式卡片用边框代替阴影
    - 实现 .halo-card mixin（使用 background-origin/clip 实现渐变边框效果）
    - 定义超大圆角变量（--radius-lg: 40rpx, --radius-xl: 48rpx）
    - 定义彩色弥散阴影（rgba(91, 117, 251, 0.08)）
    - 定义动效曲线变量（--ease-out-expo, --ease-out-back）
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.16, 15.17, 15.18_
  - [x] 6.3 生成 API SDK
    - 运行 `bun run gen:api` 更新 Orval 生成的 SDK
    - 确保 ai 模块对话端点和 activities/nearby 的 API 类型正确
    - _Requirements: API 类型安全_

- [x] 7. Zustand Store 开发
  - [x] 7.1 创建 homeStore
    - 创建 `apps/miniprogram/src/stores/home.ts`
    - 实现 loadMessages, loadMoreMessages, addUserMessage, addAIMessage, clearMessages
    - 使用 immer + persist 中间件
    - 本地缓存最近 50 条消息
    - 数据来源：conversations 表
    - _Requirements: 3.2, 3.6, 2.8_

- [x] 8. 核心组件开发
  - [x] 8.1 创建 custom-navbar 组件
    - 创建 `apps/miniprogram/components/custom-navbar/`
    - 实现左侧 Menu 图标（跳转个人中心）
    - 实现中间品牌词"聚场"
    - 实现右侧 More 图标（显示下拉菜单）
    - 实现返回按钮逻辑（页面栈判断）
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 14.2, 14.3_
  - [x] 8.2 创建 dropmenu 组件
    - 创建 `apps/miniprogram/components/dropmenu/`
    - 实现 [消息中心] 和 [新对话] 两个入口
    - 点击外部自动关闭
    - _Requirements: 2.5, 2.6, 2.7, 2.8_
  - [x] 8.3 创建 ai-dock 组件 (Floating Capsule)
    - 创建 `apps/miniprogram/components/ai-dock/`
    - 实现悬浮胶囊样式（距离底部/左右 32rpx，圆角 48rpx）
    - 实现 Halo Card 渐变边框效果
    - 实现输入框（placeholder: "粘贴文字，或直接告诉我..."）
    - 实现 [📋 粘贴] 和 [🎤 语音] 快捷按钮
    - 实现键盘弹起处理（adjust-position=false + 手动计算高度）
    - 实现 800ms 防抖机制
    - 实现按钮 Scale Down 回弹效果 + wx.vibrateShort 触感反馈
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 15.1, 15.17_
  - [x] 8.4 创建 chat-stream 组件
    - 创建 `apps/miniprogram/components/chat-stream/`
    - 实现无限滚动容器
    - 实现用户消息（右侧对齐）和 AI 消息（左侧对齐）
    - 新消息自动滚动到底部
    - 实现新消息"上浮 + 淡入"组合动画
    - _Requirements: 1.4, 3.1, 15.16_
  - [x] 8.5 创建 message-bubble 组件
    - 创建 `apps/miniprogram/components/message-bubble/`
    - 实现用户气泡样式（矢车菊蓝渐变 + 白色文字）
    - 实现 AI 气泡样式（透明背景 + 深灰文字）
    - 实现消息入场动画
    - _Requirements: 15.6, 15.7_

- [x] 9. Widget 组件开发
  - [x] 9.1 创建 widget-dashboard 组件
    - 创建 `apps/miniprogram/components/widget-dashboard/`
    - 实现动态问候语（根据时间变化）
    - 实现待参加活动列表（最多 3 个）
    - 实现空状态引导文案和热门 Prompt
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_
  - [x] 9.2 创建 widget-draft 组件
    - 创建 `apps/miniprogram/components/widget-draft/`
    - 显示 AI 预填的标题、时间、地点、类型
    - 显示静态地图预览（带 binderror 兜底）
    - 静态地图根据系统主题切换样式（styleid 参数）
    - 实现 [📍 调整位置] 按钮
    - 实现 [✅ 确认发布] 按钮
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9_
  - [x] 9.3 创建 widget-share 组件
    - 创建 `apps/miniprogram/components/widget-share/`
    - 显示原生分享卡片预览
    - 实现 [📤 分享到群] 按钮
    - 实现 [👀 查看详情] 按钮
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  - [x] 9.4 创建 activity-mini-card 组件
    - 创建 `apps/miniprogram/components/activity-mini-card/`
    - 显示活动标题、类型图标、开始时间、地点
    - 使用同色系淡色图标底色
    - _Requirements: 4.7, 4.8, 15.6_
  - [x] 9.5 **创建 widget-explore 组件 (Generative UI)**
    - 创建 `apps/miniprogram/components/widget-explore/`
    - 显示标题（"为你找到观音桥附近的 5 个热门活动"）
    - **显示静态地图预览（带多个 Markers）**
    - 显示活动列表（最多 3 个）
    - 实现 [🗺️ 展开地图查看更多] 按钮
    - 静态地图根据系统主题切换样式（styleid 参数）
    - 静态地图加载失败时显示兜底插画
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6_
  - [x] 9.6 创建 activity-list-item 组件
    - 创建 `apps/miniprogram/components/activity-list-item/`
    - 显示活动标题、类型图标、距离、时间、地点
    - 用于 Widget_Explore 和沉浸式地图页
    - _Requirements: 17.5, 18.6_
  - [x] 9.7 创建 filter-bar 组件
    - 创建 `apps/miniprogram/components/filter-bar/`
    - 实现横向滚动筛选栏
    - 筛选项：全部、美食、运动、桌游、娱乐
    - _Requirements: 18.3_
  - [x] 9.8 **创建 widget-launcher 组件 (Composite Widget)**
    - 创建 `apps/miniprogram/components/widget-launcher/`
    - 实现三层结构：Header (场景定义) + Body (双栏功能区) + Footer (辅助工具)
    - Header: 图标 + 标题"发起活动" + Badge"AI 辅助中"
    - Body 左侧: 极速建局 - 粘贴群接龙文本，AI 一键提取
    - Body 右侧: 探索附近 - 在地图上找灵感
    - Footer: 辅助工具网格 (掷骰子、AA计算、发起投票)
    - 实现 Halo Card 渐变边框效果
    - 支持深色模式
    - _Requirements: Composite Widget Design, 功能外露_
  - [x] 9.9 **创建 widget-action 组件 (Simple Widget)**
    - 创建 `apps/miniprogram/components/widget-action/`
    - 实现简单跳转按钮：label + icon + url
    - 使用 Halo Card Mini 样式（紧凑版渐变边框）
    - 支持三种样式变体：primary / secondary / ghost
    - 支持深色模式
    - _Requirements: Simple Widget Design, 快捷操作_

- [x] 10. 中间态组件开发 (Intermediates - 填补体验缝隙)
  - [x] 10.1 创建 auth-sheet 组件 (半屏登录授权)
    - 创建 `apps/miniprogram/components/auth-sheet/`
    - 使用 `<page-container>` 组件实现半屏弹出（position="bottom", round=true）
    - 通过 globalStore.isAuthSheetVisible 控制显示/隐藏
    - **视觉结构**：
      - Header: 品牌 Logo (64rpx) + 标题"加入聚场，认识新朋友"
      - Body: 说明文案"绑定手机号后可以发布和报名活动，我们会在活动有变动时通知你"
      - Footer: `<button open-type="getPhoneNumber">` 主色按钮 + 隐私协议勾选框（链接到 legal 页）
    - **交互逻辑**：
      - 点击绑定按钮 → `bindgetphonenumber` 获取 code → 调用 `POST /auth/bindPhone`
      - 成功后关闭 sheet，继续原操作（发布/报名）
      - 失败显示 Toast，保持 sheet 打开
    - _Requirements: 12.2, 12.3, CP-9_
  - [x] 10.2 创建 share-guide 组件 (分享引导蒙层)
    - 创建 `apps/miniprogram/components/share-guide/`
    - 通过 globalStore.isShareGuideVisible 控制显示/隐藏
    - **视觉结构**：
      - 全屏半透明黑色蒙层 (rgba(0,0,0,0.6))
      - 中间：分享卡片预览图（活动标题 + 地图缩略图）
      - 右上角：手绘风格箭头 SVG 指向微信胶囊按钮位置
      - 文案："活动已创建！点右上角 ··· 发到群里摇人"
    - **交互逻辑**：
      - 点击蒙层任意位置 → 关闭蒙层，回到 Chat 流
      - 3 秒后自动淡出（可选）
    - _Requirements: 7.1, 分享引导_
  - [x] 10.3 创建 thinking-bubble 组件 (AI 思考态)
    - 创建 `apps/miniprogram/components/thinking-bubble/`
    - **视觉效果**：
      - 三个圆点 (8rpx) 横向排列，间距 12rpx
      - 颜色：主色 #5B75FB，透明度 0.6
      - 动画：依次上下跳动 (translateY)，使用 CSS animation
      - 外层容器：淡蓝背景 rgba(91,117,251,0.08)，圆角 24rpx
    - **使用场景**：
      - AI 解析时插入到 Chat Stream 底部
      - 收到 AI 响应后移除
    - _Requirements: 响应感_
  - [x] 10.4 创建 widget-skeleton 组件 (卡片骨架屏)
    - 创建 `apps/miniprogram/components/widget-skeleton/`
    - **视觉效果**：
      - 灰色占位块 (#E5E7EB 浅色 / #374151 深色)
      - 流光扫过动画 (linear-gradient + translateX animation)
      - 圆角与真实 Widget 一致 (40rpx)
    - **Props**：type = 'draft' | 'explore' | 'share'（不同骨架形态）
    - **使用场景**：
      - SSE 检测到 Widget 类型后，先渲染骨架
      - 数据填充完成后替换为真实 Widget
    - _Requirements: 响应感, 预期管理_
  - [x] 10.5 创建 activity-preview-sheet 组件 (地图浮层预览)
    - 创建 `apps/miniprogram/components/activity-preview-sheet/`
    - 使用 `<page-container>` 或绝对定位实现底部浮层
    - **视觉结构**：
      - 拖拽指示条 (40rpx 宽灰色横条)
      - 活动标题 + 类型图标
      - 时间 + 地点 + "还差 N 人"
      - 两个按钮：[查看详情] (次要) + [直接报名] (主要)
    - **交互逻辑**：
      - 地图页点击 Pin → 显示此浮层
      - 点击地图空白处 → 浮层下沉隐藏
      - 点击 [查看详情] → navigateTo 活动详情页
      - 点击 [直接报名] → 检查手机号 → 报名
    - _Requirements: 18.4, 轻量预览_
    - _Requirements: 18.4, 轻量预览_

- [x] 11. Checkpoint - 组件完成
  - 确保所有组件样式符合 Crypto-Clean 规范（超大圆角、彩色弥散阴影、渐变边框）
  - 确保 AI_Dock 使用悬浮胶囊样式
  - 确保按钮有 Scale Down 回弹效果 + 触感反馈
  - 确保键盘弹起处理正常
  - 确保 Widget_Explore 使用静态地图图片
  - 确保中间态组件（auth-sheet, share-guide, thinking-bubble, widget-skeleton）正常工作
  - 如有问题请询问用户

- [x] 12. 首页重构
  - [x] 12.1 重构 pages/home/index
    - 实现三层结构：Custom_Navbar + Chat_Stream + AI_Dock
    - 集成 homeStore（subscribe 模式）
    - 实现空气感渐变背景
    - 首次进入显示 Widget_Dashboard
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.2_
  - [x] 12.2 实现 AI 解析流程 (创建场景)
    - 用户发送消息 → 显示用户气泡
    - 显示 thinking-bubble（AI 思考态）
    - 调用 AI 解析 API（SSE）
    - 处理流式响应（粘包处理）
    - 显示 widget-skeleton → 填充为 Widget_Draft
    - _Requirements: 3.6, 3.7, 5.7_
  - [x] 12.3 **实现 AI 解析流程 (探索场景 - Generative UI)**
    - 用户发送探索性问题 → 显示用户气泡
    - 显示 thinking-bubble（AI 思考态）
    - 调用 AI 解析 API（SSE）
    - 处理 `searching` 事件 → 显示"正在搜索..."
    - 处理 `explore` 事件 → 显示 widget-skeleton → 填充为 Widget_Explore
    - _Requirements: 17.1, 17.2, 19.1, 19.2, 19.4_
  - [x] 12.4 实现手机号绑定拦截
    - 点击确认发布时检查手机号
    - 未绑定则弹出 auth-sheet（替代原生弹窗）
    - 绑定成功后继续执行
    - _Requirements: 6.7, 12.2, 12.3, 12.4, 12.5_
  - [x] 12.5 实现分享引导流程
    - 活动发布成功后显示 Widget_Share
    - 同时显示 share-guide 蒙层引导用户分享
    - 点击蒙层关闭，回到 Chat 流
    - _Requirements: 7.1, 分享引导_

- [x] 13. **前置页面开发 (地图选点 + 法务) + 零成本地图重构**
  - [x] 13.0 **零成本地图重构 (移除腾讯地图 API Key 依赖)**
    - **目标**：完全移除付费 API 依赖，使用微信原生 API
    - **改动清单**：
      - `config/index.ts`: 移除 `TENCENT_MAP_KEY` 和 `generateStaticMapUrl()`
      - `widget-draft`: 移除静态地图，改为位置文字卡片（图标 + 地名 + 地址）
      - `widget-explore`: 移除静态地图，改为位置文字卡片
      - `widget-share`: 移除静态地图，改为位置文字卡片
      - `share-guide`: 移除地图缩略图，改为纯文字
      - `home/index.ts`: 移除 `generateShareMapUrl()` 函数
      - `map-picker`: 改用 `wx.chooseLocation()` 替代自定义地图+逆地址解析
    - _Requirements: 零成本运营, 简化架构_
  - [x] 13.1 **重构 map-picker 页面 (使用 wx.chooseLocation)** ✅ (已在 13.0 中完成)
    - 简化为调用 `wx.chooseLocation()` 一步到位
    - 返回数据包含：name, address, latitude, longitude
    - 无需自定义地图 UI 和逆地址解析 API
    - Widget_Draft 点击 [📍 调整位置] 时调用
    - _Requirements: 6.5, 地图选点_
  - [x] 13.2 **创建 legal 页面 (法务) - web-view 方案**
    - **Admin 端**：创建 `/legal/:type` 公开路由（无需认证）
      - 支持 user-agreement / privacy-policy / about 三种类型
      - 使用简单 Markdown 解析器渲染内容
      - 支持深色模式
    - **小程序端**：使用 `<web-view>` 加载 Admin 页面
      - 热更新：法务文案改了不用发版
      - 统一管理：同一套内容给 H5 和小程序用
      - 加载失败时显示降级提示
    - **必须有，否则小程序审核 100% 被拒**
    - _Requirements: 法务合规_

- [x] 14. **沉浸式地图页开发 (使用原生 `<map>` 组件，免费)**
  - [x] 14.1 创建 explore 页面
    - 创建 `apps/miniprogram/subpackages/activity/explore/`
    - 使用原生 `<map>` 组件实现全屏可交互地图（免费，无需 Key）
    - 实现 Custom_Navbar（标题"探索附近"，返回按钮）
    - 实现 filter-bar 筛选栏
    - _Requirements: 18.1, 18.2, 18.3_
  - [x] 14.2 实现地图交互
    - 显示活动 Markers（限制 ≤ 20 个）
    - 点击 Marker 显示 activity-preview-sheet（轻量预览）
    - 地图拖拽后自动加载新区域活动（防抖）
    - _Requirements: 18.4, 18.5_
  - [x] 14.3 实现 Bottom Sheet 活动列表
    - 显示当前区域活动列表
    - 点击活动项跳转详情页
    - _Requirements: 18.6, 18.7_
  - [x] 14.4 实现沉浸式展开/收缩动画
    - 从 Widget_Explore 点击展开时使用放大动画
    - 返回时使用收缩动画（非标准页面返回）
    - _Requirements: 18.8_

- [x] 15. 二级页面开发
  - [x] 15.1 创建 pages/profile/index（个人中心）
    - 实现 Inset Grouped List 风格
    - Header: 头像、昵称、Slogan
    - Group 1: [我发布的]、[我参与的]、[历史归档]
    - Group 2: [手机绑定]、[隐私设置]
    - Group 3: [关于聚场]、[意见反馈]
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10_
  - [x] 15.2 创建 pages/message/index（消息中心）
    - 显示所有参与的活动群聊列表
    - 显示活动标题、最后一条消息、未读数量
    - 点击跳转到 Lite_Chat 页面
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  - [x] 15.3 更新活动详情页
    - 使用 custom-navbar（处理单页进入返回逻辑）
    - 显示活动完整信息
    - 实现报名/取消报名（触发 auth-sheet 如未绑定手机号）
    - 实现活动管理按钮（发起人可见）
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_
  - [x] 15.4 更新活动确认页
    - 创建 draft-edit 页面允许修改时间和标题
    - 校验时间不能是过去 (CP-19)
    - _Requirements: 6.8, 草稿时效性_
  - [x] 15.5 创建活动列表页
    - 更新 `apps/miniprogram/subpackages/activity/list/index`
    - 支持 type 参数（created/joined/archived）
    - 集成 getActivitiesMine API
    - 使用 custom-navbar
    - _Requirements: 8.5, 8.6, 8.7_
  - [x] 15.6 实现 Widget_Draft 过期状态
    - 根据 `startAt` 动态计算是否过期
    - 过期状态：灰色卡片 + 禁用按钮 + 显示"已过期"标签
    - 过期的 Widget_Draft 不可点击"确认发布"
    - _Requirements: 6.8, CP-19_

- [ ] 16. 活动群聊更新
  - [ ] 16.1 更新 pages/chat/index（Lite_Chat）
    - 显示活动信息头部
    - 实现消息发送和显示
    - 实现轮询机制（5-10 秒）
    - 实现 onHide 停止轮询、onShow 恢复轮询
    - 实现归档状态（只读 + 提示）
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8_

- [ ] 17. 分享功能
  - [ ] 17.1 实现原生分享
    - 在活动详情页和 Widget_Share 实现 onShareAppMessage
    - 使用 AI 生成的骚气标题
    - **零成本方案**：分享卡片不使用地图预览图，使用默认封面或纯文字
    - _Requirements: 13.1, 13.2, 13.3, 13.4_
  - [ ] 17.2 实现首页回流兜底
    - 分享卡片进入时页面栈长度为 1
    - 返回时调用 wx.reLaunch 跳转首页
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

- [ ] 18. 全链路中间态完善
  - [ ] 18.1 实现全局 Loading 策略
    - AI 解析时：Chat Stream 底部显示 thinking-bubble
    - Widget 渲染时：先显示 widget-skeleton，再填充内容
    - 图片加载时：显示灰色骨架屏
    - _Requirements: 响应感, 预期管理_
  - [ ] 18.2 完善错误处理链路
    - 网络断开：顶部显示红色通知条 (TDesign Message)
    - AI 解析失败：返回 Widget_Error (带重试按钮)
    - 手机号绑定失败：Toast 提示 + 保持 auth-sheet 打开
    - _Requirements: 错误处理, 用户引导_
  - [ ] 18.3 实现 UI 状态管理
    - 在 globalStore 中增加 UI 状态控制
    - isAuthSheetVisible: boolean
    - isShareGuideVisible: boolean
    - aiThinkingState: 'idle' | 'thinking' | 'rendering_widget'
    - _Requirements: 状态管理, 中间态控制_
  - [ ] 18.4 开发环境 API Mock (仅 API 层)
    - `/auth/bindPhone`: 开发环境跳过微信解密，直接返回测试手机号
    - `/auth/login`: 开发环境跳过微信验证，直接返回测试用户
    - 小程序端无需改动，正常调用微信 API（模拟器报错也没关系）
    - _Requirements: 开发效率_

- [ ] 19. Final Checkpoint - 功能完成
  - 确保所有功能正常工作
  - 确保 Crypto-Clean 视觉风格正确实现（超大圆角、彩色弥散阴影、渐变边框）
  - 确保深色模式正常显示（Slate/Navy 色板）
  - ~~确保静态地图在深色模式下使用深色样式~~ (已移除静态地图，改用位置文字卡片)
  - 确保 Widget 位置卡片正确显示地名和地址
  - 确保 Widget_Explore 和沉浸式地图页正常工作
  - 确保意图分类逻辑正确（创建 vs 探索）
  - 确保按钮有 Scale Down 回弹效果 + 触感反馈
  - **确保中间态体验丝滑**：
    - auth-sheet 替代原生弹窗
    - share-guide 引导用户分享
    - thinking-bubble + widget-skeleton 消除等待焦虑
    - activity-preview-sheet 保持地图上下文
  - **确保缺失页面已补全**：
    - map-picker 地图选点页
    - legal 法务页（用户协议 + 隐私政策）
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

### v3.4 AI Ops 架构 (Data Stream Protocol)

> **核心变更**：统一 API 接口，小程序和 Admin 使用相同的 `/ai/chat` 端点

**架构图**：
```
┌─────────────────┐     ┌─────────────────┐
│   小程序        │     │   Admin         │
│   (Native)      │     │   (@ai-sdk/react)│
└────────┬────────┘     └────────┬────────┘
         │                       │
         │  POST /ai/chat        │  useChat({ api: '/ai/chat' })
         │  source: miniprogram  │  source: admin
         │                       │  mockUserId, mockLocation
         ▼                       ▼
┌─────────────────────────────────────────┐
│           Elysia API Server             │
│  ┌─────────────────────────────────┐    │
│  │  streamChat() → toDataStreamResponse │
│  │  - Tools: createActivityDraft   │    │
│  │  - Tools: exploreNearby         │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
                    │
                    ▼ Data Stream Format
         0:"text"      文本增量
         9:{...}       Tool Call
         a:{...}       Tool Result
         d:{...}       Done + Usage
```

**小程序解析流程**：
```typescript
// apps/miniprogram/src/utils/data-stream-parser.ts
const parser = createDataStreamParser({
  onText: (text) => { /* 累积显示 */ },
  onToolCall: (toolCall) => { /* 渲染 Widget 骨架 */ },
  onToolResult: (result) => { /* 填充 Widget 数据 */ },
  onDone: (usage) => { /* 完成处理 */ },
});

// 在 SSE 回调中
parser.feed(chunk);
```

**Admin useChat 集成 (ai@6 + @ai-sdk/react@3)**：
```typescript
// apps/admin/src/features/ai-playground/components/playground-chat.tsx
import { useChat, type UIMessage } from '@ai-sdk/react'
import { DefaultChatTransport, isToolUIPart, getToolName } from 'ai'

// 创建 transport
const transport = useMemo(() => new DefaultChatTransport({
  api: `${API_BASE_URL}/ai/chat`,
  body: { source: 'admin' },
}), [])

// 使用 useChat hook
const { messages, sendMessage, setMessages, status, error, stop, regenerate } = useChat({
  transport,
})

// status: 'submitted' | 'streaming' | 'ready' | 'error'
const isLoading = status === 'submitted' || status === 'streaming'

// 发送消息
sendMessage({ text: inputValue.trim() })

// v6 API: 使用 SDK 辅助函数处理 tool parts
const toolParts = message.parts?.filter(part => isToolUIPart(part))
const toolName = getToolName(toolPart) // 从 type='tool-xxx' 提取 'xxx'
// Tool states: 'input-streaming' | 'input-available' | 'output-available' | 'output-error'
```

**Phase 2 预留 (Icebox)**：
- `ai_logs` 表：记录每次 AI 调用的详细日志（输入、输出、tokens、延迟）
- `ai_configs` 表：System Prompt 热更新（MVP 阶段用代码常量）
- 评测套件：Golden Dataset + 自动化回归测试

### 中间态设计原则 (Intermediates Design)

> **好的体验都在缝隙里** —— Chat-First 应用的核心是"丝滑的流动"，任何生硬的跳转都会打断对话的幻觉。

**四大中间态场景**：

| 场景 | 问题 | 解决方案 | 组件 |
|------|------|----------|------|
| 意图确认 → 分享 | 发布后用户懵：然后呢？ | 分享引导蒙层 | `share-guide` |
| 游客 → 用户 | 原生弹窗丑陋，无信任铺垫 | 半屏登录页 | `auth-sheet` |
| AI 思考中 | 屏幕静止 2 秒，用户焦虑 | 呼吸气泡 + 骨架屏 | `thinking-bubble` + `widget-skeleton` |
| 地图 → 详情 | 跳转页面导致地图重置 | 轻量预览浮层 | `activity-preview-sheet` |

**设计原则**：
- **页面 (Page) 越少越好** —— 保持沉浸
- **模态 (Modal/Sheet) 适度使用** —— 解决中断
- **流 (Stream) 是核心** —— 对话不能断

**UI 状态管理**：
```typescript
// globalStore
{
  isAuthSheetVisible: boolean;      // 半屏登录页
  isShareGuideVisible: boolean;     // 分享引导蒙层
  aiThinkingState: 'idle' | 'thinking' | 'rendering_widget';
}
```

### Crypto-Clean 视觉风格关键实现

**四大设计维度**：
| 维度 | 传统 App | Crypto-Clean |
|------|---------|--------------|
| 容器形态 | Rounded (10-16rpx) | Squircle (40rpx+) / Capsule |
| 质感 | Shadow (黑色阴影) | Surface (彩色弥散阴影 + 极细描边) |
| 字体排版 | Readable | Editorial (杂志感，数字等宽) |
| 动效 | Ease | Fluid (流体物理，按压回弹) |

**关键 CSS 变量**：
- `--radius-lg: 40rpx` (卡片超大圆角)
- `--radius-xl: 48rpx` (AI Dock 胶囊)
- `--shadow-card: 0 8rpx 32rpx rgba(91, 117, 251, 0.08)` (彩色弥散阴影)
- `--border-card: 1rpx solid rgba(0, 0, 0, 0.04)` (极细描边)
- `--ease-out-back: cubic-bezier(0.34, 1.56, 0.64, 1)` (回弹曲线)

**Halo Card 渐变边框实现**：
```less
.halo-card::before {
  background: linear-gradient(135deg, 
    rgba(91, 117, 251, 0.15) 0%, 
    rgba(196, 181, 253, 0.15) 100%
  );
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
}
```

**按钮回弹效果**：
```less
.btn-pressable {
  transition: transform 0.15s var(--ease-out-back);
  &:active { transform: scale(0.95); }
}
```

**触感反馈**：
```typescript
wx.vibrateShort({ type: 'light' }); // 按钮点击
```

### 深色模式支持

- **从 Day 1 支持**：使用语义化 CSS 变量，一套代码适配两种模式
- 浅色模式：极简白 #FAFBFC，靠彩色弥散阴影区分层级
- 深色模式：深邃蓝黑 #0F172A (Slate-900)，靠亮度区分层级
- 深色模式卡片加 1px 淡边框，去阴影
- 图标颜色使用 CSS 变量，不写死

**语义化配色映射**：
| Token | 🌞 Light | 🌙 Dark |
|-------|----------|---------|
| --bg-page | #FAFBFC | #0F172A |
| --bg-card | #FFFFFF | #1E293B |
| --text-main | #1F2937 | #F1F5F9 |
| --shadow-card | 彩色弥散阴影 | none |
| --border-card | 极细描边 | rgba(255,255,255,0.1) |

### 其他实现要点

- 键盘弹起处理是关键，需要手动计算高度
- SSE 流式响应需要处理粘包问题
- **沉浸式地图页使用原生 `<map>` 组件**，免费无需 Key
- **意图分类是 Generative UI 的核心**，需要在 AI 服务端实现

### 零成本地图方案 (v3.5)

> **核心原则**：只使用微信原生免费 API，不依赖任何付费服务

**免费 API/组件**：
| API/组件 | 用途 | 费用 |
|----------|------|------|
| `<map>` 组件 | 沉浸式地图页 | ✅ 免费 |
| `wx.chooseLocation()` | 地图选点 | ✅ 免费 |
| `wx.getLocation()` | 获取当前位置 | ✅ 免费 |
| `wx.openLocation()` | 打开地图导航 | ✅ 免费 |

**已移除的付费依赖**：
| API | 原用途 | 替代方案 |
|-----|--------|----------|
| 腾讯静态图 API | Widget 地图预览 | 位置文字卡片 |
| 腾讯逆地址解析 API | 坐标转地址 | `wx.chooseLocation()` 自带 |

**Widget 位置展示方案**：
- `widget-draft/explore/share`：使用位置文字卡片（📍图标 + 地名 + 地址）
- `share-guide`：纯文字卡片
- `explore` 页面：使用原生 `<map>` 组件（独立页面，无手势冲突）

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
