# Implementation Plan: JuChang Tool MVP 全面重构

## Overview

本计划覆盖从 DB → API → Admin → MiniProgram 的全栈重构，将现有"平台版"代码精简为"纯工具版" MVP。

**重构原则**：
1. **删减优先** - 移除 MVP 不需要的功能（支付、增值服务、幽灵锚点、复杂履约等）
2. **保留骨架** - 复用现有目录结构和组件框架
3. **渐进式** - 按层级依次重构，确保每层完成后可独立验证

---

## Tasks

### Phase 1: Database Schema 重构

- [x] 1. 精简 Database Schema
  - [x] 1.1 重构 `packages/db/src/schema/enums.ts`
    - 简化 `activityStatusEnum` 为 `active/completed/cancelled`
    - 简化 `participantStatusEnum` 为 `joined/quit`
    - 移除 MVP 不需要的枚举（premiumServiceTypeEnum, disputeStatusEnum 等）
    - _Requirements: 全局_

  - [x] 1.2 重构 `packages/db/src/schema/users.ts`
    - 移除字段：lastLoginIp, lastLoginAt, bio, gender, fulfillmentCount, disputeCount, feedbackReceivedCount, membershipType, membershipExpiresAt, aiSearchQuotaToday, lastLocation, lastActiveAt, interestTags, isRegistered, isRealNameVerified, isBlocked
    - 保留字段：id, wxOpenId, phoneNumber, nickname, avatarUrl, aiCreateQuotaToday, aiQuotaResetAt, activitiesCreatedCount, participationCount, createdAt, updatedAt
    - _Requirements: 12, 13, 14_

  - [x] 1.3 重构 `packages/db/src/schema/activities.ts`
    - 移除字段：images, endAt, feeType, estimatedCost, joinMode, riskScore, riskLevel, tags, genderRequirement, minReliabilityRate, isConfirmed, confirmedAt, isLocationBlurred, isBoosted, boostExpiresAt, boostCount, isPinPlus, pinPlusExpiresAt, isGhost, ghostAnchorType, ghostSuggestedType, chatStatus, chatArchivedAt
    - 保留字段：id, creatorId, title, description, location, locationName, address, locationHint (改为 notNull), startAt, type, maxParticipants, currentParticipants, status, createdAt, updatedAt
    - 更新 status 使用新的简化枚举
    - _Requirements: 4, 5, 6, 7, 10_

  - [x] 1.4 重构 `packages/db/src/schema/participants.ts`
    - 移除字段：applicationMsg, isFastPass, confirmedAt, isDisputed, disputedAt, disputeExpiresAt
    - 保留字段：id, activityId, userId, status, joinedAt, updatedAt
    - 更新 status 使用新的简化枚举
    - _Requirements: 7_

  - [x] 1.5 重构 `packages/db/src/schema/chat_messages.ts`
    - 移除字段：metadata, isRevoked
    - 保留字段：id, activityId, senderId (nullable), type, content, createdAt
    - 简化 messageTypeEnum 为 text/system
    - _Requirements: 9_

  - [x] 1.6 重构 `packages/db/src/schema/notifications.ts`
    - 简化为 MVP 需要的通知类型：join, quit, activity_start, completed, cancelled
    - _Requirements: 11_

  - [x] 1.7 移除 MVP 不需要的表文件
    - 删除或注释 `transactions.ts`（支付功能砍掉）
    - 删除或注释 `feedbacks.ts`（复杂反馈系统砍掉）
    - 删除或注释 `action_logs.ts`（审计日志 MVP 不需要）
    - 更新 `index.ts` 导出
    - _Requirements: 全局_

  - [x] 1.8 更新 `packages/db/src/schema/relations.ts`
    - 移除已删除表的关系定义
    - _Requirements: 全局_

- [x] 2. Checkpoint - 数据库 Schema 验证
  - 运行 TypeScript 编译检查，确保 `packages/db` 无 TS 错误
  - 运行 `bun run db:generate` 生成迁移文件
  - 如有问题请询问用户

---

### Phase 2: API 模块重构

- [x] 3. 精简 API 模块结构
  - [x] 3.1 移除 MVP 不需要的模块
    - 删除 `apps/api/src/modules/transactions/`（支付功能）
    - 删除 `apps/api/src/modules/feedbacks/`（反馈系统）
    - 删除 `apps/api/src/modules/upload/`（图片上传 MVP 不做）
    - 更新 `apps/api/src/index.ts` 移除相关路由注册
    - _Requirements: 全局_

  - [x] 3.2 重构 `auth` 模块
    - 简化 `auth.model.ts`：只保留 login 和 bindPhone 的 schema
    - 简化 `auth.service.ts`：移除复杂的会员逻辑
    - 更新 `auth.controller.ts`：只保留 `/auth/login` 和 `/auth/bindPhone`
    - _Requirements: 13_

  - [x] 3.3 重构 `users` 模块
    - 简化 `user.model.ts`：从 DB schema 派生，移除不需要的字段
    - 简化 `user.service.ts`：只保留 getMe, updateProfile, getQuota
    - 更新 `user.controller.ts`：只保留 `/users/me`, `PATCH /users/me`, `/users/me/quota`
    - _Requirements: 12, 14_

  - [x] 3.4 重构 `activities` 模块
    - 简化 `activity.model.ts`：从 DB schema 派生，添加 isArchived 计算字段
    - 重写 `activity.service.ts`：
      - `getMyActivities()` - 获取我相关的活动（发布的 + 参与的）
      - `getActivityById()` - 获取详情，包含 isArchived 计算
      - `createActivity()` - 创建活动，检查额度
      - `updateActivityStatus()` - 更新状态（completed/cancelled）
      - `deleteActivity()` - 删除活动（仅 active 且未开始）
      - `joinActivity()` - 报名
      - `quitActivity()` - 退出
    - 更新 `activity.controller.ts`：实现上述接口
    - _Requirements: 4, 5, 7, 10_

  - [x] 3.5 重构 `participants` 模块
    - 简化为辅助模块，主要逻辑移到 activities 模块
    - 或合并到 activities 模块
    - _Requirements: 7_

  - [x] 3.6 重构 `chat` 模块
    - 简化 `chat.model.ts`：只保留 getMessages 和 sendMessage 的 schema
    - 重写 `chat.service.ts`：
      - `getMessages(activityId, since)` - 获取消息列表（轮询）
      - `sendMessage(activityId, content)` - 发送消息
      - 添加 isArchived 检查逻辑
    - 更新 `chat.controller.ts`：只保留 `GET /chat/:activityId/messages` 和 `POST /chat/:activityId/messages`
    - _Requirements: 9_

  - [x] 3.7 重构 `ai` 模块
    - 简化 `ai.model.ts`：只保留 parse 的 schema
    - 重写 `ai.service.ts`：
      - `parseText(text, location)` - AI 解析自然语言
      - 实现 SSE 流式响应
      - 添加额度检查和扣减逻辑
    - 更新 `ai.controller.ts`：只保留 `POST /ai/parse`（SSE）
    - _Requirements: 2, 3_

  - [x] 3.8 重构 `notifications` 模块
    - 简化 `notification.model.ts`：只保留 MVP 通知类型
    - 简化 `notification.service.ts`：
      - `getNotifications(userId)` - 获取通知列表
      - `markAsRead(notificationId)` - 标记已读
      - `createNotification()` - 创建通知（内部调用）
    - 更新 `notification.controller.ts`
    - _Requirements: 11_

  - [x] 3.9 简化 `dashboard` 模块
    - 只保留 Admin 需要的基础统计接口
    - 移除复杂的数据分析功能
    - _Requirements: Admin_

- [x] 4. Checkpoint - API 验证
  - 运行 TypeScript 编译检查，确保 `apps/api` 无 TS 错误
  - 如有问题请询问用户

---

### Phase 3: Admin 后台重构

- [x] 5. 精简 Admin 功能
  - [x] 5.1 移除 MVP 不需要的 features
    - 移除或简化 transactions 相关页面
    - 移除或简化 feedbacks 相关页面
    - 保留：users, activities, notifications, dashboard
    - _Requirements: Admin_

  - [x] 5.2 更新 Admin 类型定义
    - 更新 `apps/admin/src/types/` 与新 DB schema 对齐
    - 移除不需要的类型
    - _Requirements: Admin_

  - [x] 5.3 更新 Admin API 调用
    - 更新 Eden Treaty 调用与新 API 接口对齐
    - 移除不存在的接口调用
    - _Requirements: Admin_

  - [x] 5.4 简化 Dashboard
    - 只显示核心指标：用户数、活动数、今日活跃
    - 移除复杂的图表和分析
    - _Requirements: Admin_

- [x] 6. Checkpoint - Admin 验证
  - 运行 TypeScript 编译检查，确保 `apps/admin` 无 TS 错误
  - 如有问题请询问用户

---

### Phase 4: MiniProgram 重构

- [ ] 7. 清理小程序页面结构
  - [ ] 7.1 移除 MVP 不需要的页面
    - 移除 `pages/search/`（搜索功能砍掉）
    - 移除 `pages/login/`（延迟验证，不需要独立登录页）
    - 移除 `pages/setting/`（MVP 简化）
    - 移除 `subpackages/safety/`（安全中心 MVP 不做）
    - 更新 `app.json` 移除相关页面配置
    - _Requirements: 1_

  - [ ] 7.2 重构 `pages/home/`
    - 简化地图逻辑：只显示"我相关的"活动
    - 移除幽灵锚点渲染
    - 移除 Boost/Pin+ 特效
    - 集成 ai-input-bar 和 cui-panel
    - _Requirements: 1, 2, 3, 4_

  - [ ] 7.3 重构 `pages/message/`
    - 简化为：系统通知区域 + 群聊列表
    - 移除复杂的消息分类
    - _Requirements: 11_

  - [ ] 7.4 重构 `pages/my/` 个人中心主页
    - 简化为：头像昵称区域 + 功能入口列表
    - 功能入口：我的活动、设置、关于我们
    - 点击头像区域跳转到 info-edit 页面
    - 移除会员、钱包等入口
    - _Requirements: 12_

  - [ ] 7.5 重构 `pages/chat/`
    - 实现轮询逻辑（5-10秒）
    - 实现 onHide/onShow 生命周期管理
    - 添加归档状态检查和 UI
    - _Requirements: 9_

- [ ] 8. 重构小程序分包页面
  - [ ] 8.1 重构 `subpackages/activity/detail/`
    - 简化详情展示
    - 添加报名/退出逻辑
    - 添加发起人管理按钮（确认成局/取消/删除）
    - 集成 custom-navbar 处理单页进入
    - _Requirements: 7, 8, 10_

  - [ ] 8.2 重构 `subpackages/activity/confirm/`
    - 接收 AI 解析的草稿数据
    - 实现地图 Pin 拖动和地址反查
    - 强制 Location_Hint 填写
    - 集成手机号绑定检查
    - 实现发布和分享引导
    - _Requirements: 5, 6_

  - [ ] 8.3 重构 `subpackages/activity/create/`
    - 改为"手动创建"入口（空白表单）
    - 与 confirm 页面共享表单逻辑
    - _Requirements: 5.8_

  - [ ] 8.4 新增 `subpackages/activity/not-found/`
    - 创建 404 页面
    - 显示"活动不存在或已删除"
    - 提供返回首页按钮
    - _Requirements: 10.7_

  - [ ] 8.5 新增 `pages/my/activities/`
    - 创建我的活动列表页
    - 支持切换"我发布的"/"我参与的"
    - 显示活动卡片列表
    - _Requirements: 12.4, 12.5_

  - [ ] 8.6 重构 `pages/my/info-edit/`
    - 资料编辑页（头像、昵称）
    - 实现头像选择（chooseAvatar）
    - 实现昵称输入（nickname input）
    - 实现保存逻辑
    - _Requirements: 14_

  - [ ] 8.7 新增 `pages/my/settings/`
    - 设置页面
    - 通知开关设置
    - 清除缓存功能
    - 退出登录功能
    - _Requirements: 12_

  - [ ] 8.8 新增 `pages/my/about/`
    - 关于我们页面
    - 显示版本号、开发者信息
    - 法律文档入口（用户协议、隐私政策链接）
    - _Requirements: 12_

  - [ ] 8.9 新增 `subpackages/legal/` 法律文档分包
    - 创建 `user-agreement/index` 用户协议页（⚠️ 审核必须）
    - 创建 `privacy-policy/index` 隐私政策页（⚠️ 审核必须）
    - 使用 rich-text 或 web-view 渲染内容
    - 注意：关于我们已合并到"我的"页面，不需要独立页面
    - _Requirements: 审核合规_

- [ ] 9. 重构小程序组件
  - [ ] 9.1 重构 `components/ai-input-bar/`
    - 实现点击展开 CUI Panel
    - 实现防抖输入（800ms）
    - 实现语音输入
    - _Requirements: 2_

  - [ ] 9.2 重构 `components/cui-panel/`
    - 实现 SSE 流式响应处理
    - 实现思考态/定位态/结果态 UI
    - 实现地图联动（flyTo）
    - 集成 draft-card
    - _Requirements: 3_

  - [ ] 9.3 重构 `components/draft-card/`
    - 显示 AI 解析的草稿信息
    - 实现"确认发布"按钮
    - _Requirements: 3_

  - [ ] 9.4 重构 `components/nav/` → `components/custom-navbar/`
    - 实现动态高度计算（胶囊按钮公式）
    - 实现单页进入返回逻辑
    - _Requirements: 7.6, 8_

  - [ ] 9.5 简化 `components/activity-card/`
    - 移除 Boost/Pin+ 标识
    - 简化为基础信息展示
    - _Requirements: 4_

  - [ ] 9.6 移除 MVP 不需要的组件
    - 移除 `components/filter-panel/`（筛选功能砍掉）
    - 移除 `components/floating-buttons/`（如果是增值服务相关）
    - 移除 `components/reliability-badge/`（复杂靠谱度砍掉）
    - 移除 `components/feedback-dialog/`（反馈系统砍掉）
    - _Requirements: 全局_

  - [ ] 9.7 新增 `components/location-guide-modal/`
    - 位置授权引导弹窗
    - 当用户拒绝位置权限时显示
    - 提供"去设置"按钮跳转系统设置
    - _Requirements: 4.1_

  - [ ] 9.8 更新 `components/phone-auth-modal/`
    - 手机号绑定弹窗
    - 集成协议勾选（用户协议 + 隐私政策链接）
    - 使用 button open-type="getPhoneNumber"
    - _Requirements: 13, 审核合规_

  - [ ] 9.9 新增 `components/network-error/`
    - 网络错误提示组件
    - 显示"网络异常，请检查网络连接"
    - 提供"重试"按钮
    - _Requirements: 全局_

- [ ] 10. 重构小程序 Stores
  - [ ] 10.1 重构 `src/stores/` 目录
    - 创建/更新 `user.ts` - 用户状态
    - 创建/更新 `copilot.ts` - AI 副驾状态
    - 创建/更新 `chat.ts` - 群聊状态
    - 移除不需要的 stores
    - _Requirements: 全局_

- [ ] 11. 重构小程序 Services
  - [ ] 11.1 更新 API SDK
    - 运行 `bun run gen:api` 重新生成 Orval SDK
    - 更新 `src/services/api.ts`
    - _Requirements: 全局_

  - [ ] 11.2 实现分享逻辑
    - 更新 `utils/share.ts`
    - 实现 onShareAppMessage 配置
    - 实现腾讯地图静态图 URL 生成
    - _Requirements: 6_

  - [ ] 11.3 实现认证逻辑
    - 更新 `utils/auth.ts`
    - 实现延迟验证检查
    - 实现手机号绑定流程
    - _Requirements: 13_

- [ ] 12. 更新小程序配置
  - [ ] 12.1 更新 `app.json`
    - 更新 tabBar 配置（3 Tab）
    - 更新 pages 和 subpackages 配置
    - 移除不需要的页面
    - _Requirements: 1_

  - [ ] 12.2 更新 `app.ts`
    - 简化全局状态
    - 实现静默登录逻辑
    - _Requirements: 13_

- [ ] 13. Checkpoint - 小程序验证
  - 运行 TypeScript 编译检查，确保 `apps/miniprogram` 无 TS 错误
  - 如有问题请询问用户

---

### Phase 5: 集成测试与收尾

- [ ] 14. 端到端流程验证
  - [ ] 14.1 验证核心用户流程
    - 流程 A：AI 解析 → 创建活动 → 分享 → 他人报名 → 群聊 → 确认成局
    - 流程 B：通过分享卡片进入 → 查看详情 → 报名 → 返回首页
    - _Requirements: 全部_

  - [ ] 14.2 验证边界条件
    - 未绑定手机号时的拦截
    - 每日发布额度限制
    - 群聊归档状态
    - 活动删除约束
    - _Requirements: CP-4, CP-6, CP-7, CP-9_

- [ ] 15. 清理与文档
  - [ ] 15.1 清理无用代码
    - 删除注释掉的代码
    - 删除未使用的文件
    - 运行 lint 检查
    - _Requirements: 全局_

  - [ ] 15.2 更新 README
    - 更新项目说明
    - 更新开发指南
    - _Requirements: 全局_

- [ ] 16. Final Checkpoint
  - 运行全局 TypeScript 编译检查，确保所有包无 TS 错误
  - 如有问题请询问用户

---

## Notes

- 任务按 Phase 顺序执行，每个 Phase 完成后进行 Checkpoint 验证（TypeScript 编译检查）
- 所有任务都需要完成
- 每个任务完成后更新状态为 `[x]`
- 遇到问题时在 Checkpoint 处暂停并询问用户
- 功能验证由用户亲自完成，开发者只负责确保 TS 无错误
