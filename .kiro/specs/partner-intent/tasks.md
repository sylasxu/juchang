# Implementation Plan: Partner Intent System (找搭子)

## Overview

基于 v4.0 Smart Broker 方案实现「找搭子」功能。核心是 Prompt 增强 + AI Tools，不创建独立的 REST API。

**v4.0.1 优化**：从 5 表精简为 3 表设计
- `partner_intents` - 搭子意向
- `intent_matches` - 意向匹配 (含 `intentIds[]`, `userIds[]` 数组)
- `match_messages` - 匹配消息 (直接关联 `matchId`)

## Tasks

- [x] 1. 数据库 Schema 扩展 (3表精简版)
  - [x] 1.1 创建枚举类型
    - 新增 `partner_intent_status` 枚举 (active, matched, expired, cancelled)
    - 新增 `intent_match_outcome` 枚举 (pending, confirmed, expired, cancelled)
    - 文件: `packages/db/src/schema/enums.ts`
    - _Requirements: 1.6, 2.1_

  - [x] 1.2 创建 partner_intents 表
    - 包含 userId, activityType, locationHint, location (PostGIS), timePreference
    - 包含 metaData (jsonb): tags, poiPreference, budgetType, rawInput
    - 包含 status, expiresAt, createdAt, updatedAt
    - 创建索引: user_idx, status_idx, type_idx, location_idx (gist)
    - 文件: `packages/db/src/schema/partner-intents.ts`
    - _Requirements: 1.6, 1.7_

  - [x] 1.3 创建 intent_matches 表 (含数组字段)
    - 包含 activityType, matchScore, commonTags, centerLocation
    - 包含 tempOrganizerId, activityId, outcome, confirmDeadline
    - 包含 intentIds (uuid[]), userIds (uuid[]) - 替代中间表
    - 文件: `packages/db/src/schema/intent-matches.ts`
    - _Requirements: 2.1, 2.6, 3.3_

  - [x] 1.4 创建 match_messages 表
    - 直接关联 matchId (Match = Group)
    - 包含 senderId, messageType, content
    - 文件: `packages/db/src/schema/match-messages.ts`
    - _Requirements: 3.2_

  - [x] 1.5 导出 Schema 并生成迁移
    - 更新 `packages/db/src/schema/index.ts` 导出新表
    - 运行 `bun run db:generate` 生成迁移文件
    - 运行 `bun run db:migrate` 执行迁移
    - _Requirements: 1.6_

- [x] 2. Checkpoint - 数据库 Schema 完成
  - 确保迁移成功执行，表结构正确

- [x] 3. AI Tools 实现
  - [x] 3.1 实现 createPartnerIntent Tool
    - 验证登录、手机号绑定 (CP-9)、位置
    - 检查重复意向 (同类型只能有一个 active)
    - 提取 Rich Intent (tags, budgetType, poiPreference)
    - 创建意向记录 (expiresAt = now + 24h)
    - 触发匹配检测
    - 文件: `apps/api/src/modules/ai/tools/create-partner-intent.ts`
    - _Requirements: 1.2, 1.6, 1.7, 1.8_

  - [x] 3.2 实现 getMyIntents Tool
    - 查询用户活跃意向列表
    - 查询用户待确认的匹配 (直接查 userIds 数组)
    - 文件: `apps/api/src/modules/ai/tools/get-my-intents.ts`
    - _Requirements: 1.7_

  - [x] 3.3 实现 cancelIntent Tool
    - 验证意向属于当前用户
    - 验证意向状态为 active
    - 更新状态为 cancelled
    - 文件: `apps/api/src/modules/ai/tools/cancel-intent.ts`
    - _Requirements: 1.7_

  - [x] 3.4 实现 confirmMatch Tool
    - 验证用户是 Temp_Organizer
    - 验证匹配状态为 pending 且未过期
    - 创建 Activity (status='active')
    - 更新所有相关意向状态为 matched
    - 将匹配用户加入 participants (从 userIds 数组获取)
    - 文件: `apps/api/src/modules/ai/tools/confirm-match.ts`
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 3.5 注册 Tools 到 AI Module
    - 在 `apps/api/src/modules/ai/ai.service.ts` 中注册新 Tools
    - _Requirements: 1.1_

- [x] 4. Checkpoint - AI Tools 完成
  - 确保 Tools 可以在 Playground 中调用

- [x] 5. Match Service 实现 (3表精简版)
  - [x] 5.1 实现匹配检测逻辑
    - 查找候选意向 (同类型、3km内、活跃状态)
    - 检查 tag 冲突 (NoAlcohol vs Drinking 等)
    - 计算匹配分数 (common_tags / avg_tags * 100)
    - 检查阈值 (> 80%)
    - 文件: `apps/api/src/modules/ai/tools/helpers/match.ts`
    - _Requirements: 2.2, 2.3, 2.4, 2.5_

  - [x] 5.2 实现匹配创建逻辑
    - 选择 Temp_Organizer (最早意向创建者)
    - 计算中心位置
    - 计算确认截止时间 (6h 或当天 23:59)
    - 创建匹配记录 (含 intentIds[], userIds[] 数组)
    - 发送 Icebreaker 消息 (直接关联 matchId)
    - 文件: `apps/api/src/modules/ai/tools/helpers/match.ts`
    - _Requirements: 2.6, 3.2, 3.3_

  - [x] 5.3 实现匹配确认逻辑
    - 创建 Activity 从匹配数据
    - 更新意向状态为 matched
    - 添加参与者 (从 userIds 数组获取)
    - 文件: `apps/api/src/modules/ai/tools/helpers/match.ts`
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 6. Prompt 升级 (v3.9)
  - [x] 6.1 新增 Broker Mode 指令
    - 添加 `<broker_mode>` 区块
    - 定义触发条件、追问规则、偏好优先级
    - 文件: `apps/api/src/modules/ai/prompts/xiaoju-v39.ts`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 6.2 扩展 intent_map
    - 新增找搭子意图映射
    - 新增查意向、取消意向、确认匹配映射
    - 文件: `apps/api/src/modules/ai/prompts/xiaoju-v39.ts`
    - _Requirements: 1.1_

  - [x] 6.3 新增 broker_examples
    - 添加追问澄清示例
    - 添加偏好优先级示例 (历史记录 vs 当前意图)
    - 文件: `apps/api/src/modules/ai/prompts/xiaoju-v39.ts`
    - _Requirements: 1.1, 1.2_

  - [x] 6.4 切换到 v3.9 Prompt
    - 更新 `apps/api/src/modules/ai/ai.service.ts` 使用新 Prompt
    - 传递 userLocation 给 getToolsByIntent
    - _Requirements: 1.1_

- [x] 7. Checkpoint - Prompt 和 Match Service 完成
  - Prompt v3.9 已创建，包含 Broker Mode
  - ai.service.ts 已切换到 v3.9 Prompt

- [x] 8. Cron Jobs 实现 (3表精简版)
  - [x] 8.1 实现意向过期处理
    - 每小时检查并更新过期意向状态
    - 文件: `apps/api/src/jobs/intent-jobs.ts`
    - _Requirements: 1.7_

  - [x] 8.2 实现匹配过期处理
    - 每 10 分钟检查过期匹配
    - 尝试重新分配 Temp_Organizer (从 intentIds 数组查询)
    - 无法分配则标记为 expired
    - 文件: `apps/api/src/jobs/intent-jobs.ts`
    - _Requirements: 3.4_

  - [x] 8.3 注册 Cron Jobs
    - 在 `apps/api/src/jobs/scheduler.ts` 中注册新任务
    - _Requirements: 1.7, 3.4_

- [x] 9. Dashboard 扩展
  - [x] 9.1 实现意向指标查询
    - 活跃意向数、今日新增、转化率、平均匹配时长
    - 文件: `apps/api/src/modules/dashboard/dashboard.service.ts`
    - _Requirements: 6.1_

  - [x] 9.2 扩展 Dashboard API
    - 新增 `/dashboard/intent-metrics` 端点
    - 文件: `apps/api/src/modules/dashboard/dashboard.controller.ts`
    - _Requirements: 6.1, 6.2_

- [x] 10. Welcome API 扩展
  - [x] 10.1 返回待确认匹配
    - 在 getWelcomeCard 中查询 pendingMatches (直接查 userIds 数组)
    - 置顶高亮显示
    - 文件: `apps/api/src/modules/ai/ai.service.ts`
    - _Requirements: 3.1_

  - [x] 10.2 新增找搭子快捷入口
    - 在 suggestions 中添加 "想吃火锅找搭子" 选项
    - 文件: `apps/api/src/modules/ai/ai.service.ts`
    - _Requirements: 7.3_

- [x] 11. Playground 扩展
  - [x] 11.1 新增 ToolPreview 渲染分支
    - createPartnerIntent: 显示提取的 tags 和创建结果
    - getMyIntents: 显示意向列表
    - cancelIntent: 显示取消结果
    - confirmMatch: 显示活动创建结果
    - 文件: `apps/admin/src/features/ai-ops/components/playground/playground-chat.tsx`
    - _Requirements: 7.2_

  - [x] 11.2 更新 Trace 类型
    - 新增 partner 意图类型
    - 新增 Tool 显示名称映射
    - 文件: `apps/admin/src/features/ai-ops/types/trace.ts`
    - _Requirements: 7.2_

- [x] 12. Final Checkpoint ✅
  - 所有功能已实现完成
  - 3表精简版设计 (partner_intents, intent_matches, match_messages)
  - Prompt v3.9 包含 Broker Mode
  - AI Tools 支持找搭子流程
  - Cron Jobs 处理过期意向和匹配
  - Dashboard 显示意向指标
  - Welcome API 返回待确认匹配
  - Playground 支持新 Tool 预览
  - TypeScript 编译通过 (bunx tsc --noEmit)

## Notes

- 所有用户操作通过 AI Chat，不创建独立的 REST API
- 遵循 juchang-rules.md: 使用 TypeBox，从 DB 派生 Schema，使用 Bun
- 偏好优先级: 当前对话意图 > 历史记录
- v4.0.1 优化: 5表 → 3表 (用 uuid[] 数组替代中间表，Match 本身就是群组)