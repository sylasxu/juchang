# Implementation Plan: Admin Console (AI Ops v3.2)

## Overview

本计划实现 Admin 后台的 AI Ops 功能改造，核心理念：从"复刻小程序 UI"转向"透视 AI 数据"。

## Tasks

### Phase 1: AI Ops 基础设施

- [ ] 1. 安装 AI Ops 依赖
  - [ ] 1.1 安装 Vercel AI SDK
    - 安装 `ai` 包 (Vercel AI SDK)
    - 安装 `react-json-view-lite` 用于 JSON 展示
    - 确保 TanStack Query 已配置
    - _Requirements: AI Ops Tech Stack_

  - [ ] 1.2 配置 AI SDK Provider
    - 创建 AI SDK 配置文件
    - 配置 API 端点指向 `/ai/parse`
    - _Requirements: AI Ops Playground_

- [ ] 2. Checkpoint - AI Ops 依赖验证
  - 运行 TypeScript 编译检查
  - 如有问题请询问用户

### Phase 2: Playground 开发

- [ ] 3. 创建 AI Playground 页面
  - [ ] 3.1 创建 Playground 路由
    - 创建 `/playground` 路由页面
    - 实现基础布局（左侧对话区 + 右侧配置面板）
    - _Requirements: AI Ops Playground_

  - [ ] 3.2 集成 useChat Hook
    - 使用 Vercel AI SDK `useChat` hook
    - 连接后端 `/ai/parse` 端点
    - 实现消息发送和接收
    - _Requirements: AI Ops Playground_

  - [ ] 3.3 实现 System Prompt Override
    - 创建配置面板组件
    - 支持自定义 System Prompt
    - 支持保存/加载预设
    - _Requirements: AI Ops Playground_

- [ ] 4. 开发 Inspector 组件库
  - [ ] 4.1 创建 TextInspector
    - 渲染 Markdown 文本
    - 支持代码高亮
    - _Requirements: AI Ops Inspector Pattern_

  - [ ] 4.2 创建 DraftInspector
    - 结构化展示时间/地点/类型
    - 添加腾讯地图外链验证
    - 显示 Confidence 标签
    - _Requirements: AI Ops Inspector Pattern_

  - [ ] 4.3 创建 ExploreInspector
    - 展示搜索关键词
    - 展示中心点坐标
    - 展示 Mock 结果列表
    - _Requirements: AI Ops Inspector Pattern_

  - [ ] 4.4 创建 RawJsonInspector
    - 使用 react-json-view-lite
    - 支持折叠/展开
    - 支持复制 JSON
    - _Requirements: AI Ops Inspector Pattern_

  - [ ] 4.5 实现 Inspector 映射逻辑
    - 根据 `type` 字段渲染不同 Inspector
    - 处理 `toolInvocations` 数据
    - _Requirements: AI Ops Inspector Pattern_

- [ ] 5. Checkpoint - Playground 验证
  - 确保 useChat 正常连接 API
  - 确保 Inspector 组件正确渲染
  - 如有问题请询问用户

### Phase 3: 对话审计开发

- [ ] 6. 实现对话审计页面
  - [ ] 6.1 创建 Conversations 路由
    - 创建 `/conversations` 路由页面
    - 实现会话列表布局
    - _Requirements: AI Ops Logs_

  - [ ] 6.2 接入对话历史 API
    - 调用 GET `/ai/conversations` API
    - 实现分页加载
    - 实现按用户/时间筛选
    - _Requirements: AI Ops Logs_

  - [ ] 6.3 实现会话列表
    - 显示会话摘要
    - 标注 Widget 生成失败的对话（红色高亮）
    - 标注意图不明的对话
    - _Requirements: AI Ops Logs_

  - [ ] 6.4 实现对话详情页
    - 复用 Playground 渲染组件
    - 设为只读模式
    - 显示完整对话流
    - _Requirements: AI Ops Logs_

  - [ ] 6.5 实现 Fix & Test 功能
    - 添加 [Fix & Test] 按钮
    - 导入对话上下文到 Playground
    - 支持修改 System Prompt 后重试
    - _Requirements: AI Ops Logs_

- [ ] 7. Checkpoint - 对话审计验证
  - 确保会话列表正常加载
  - 确保详情页正确渲染
  - 如有问题请询问用户

### Phase 4: 业务数据管理 (CMS)

- [ ] 8. 更新业务数据管理页面
  - [ ] 8.1 更新 ActivitiesTable
    - 支持按状态筛选（draft/active/completed/cancelled）
    - 添加查看关联 Prompt 功能
    - 实现强制下架功能
    - _Requirements: AI Ops CMS_

  - [ ] 8.2 更新 UsersTable
    - 实现用户列表分页
    - 实现封禁/解封功能
    - _Requirements: AI Ops CMS_

- [ ] 9. Checkpoint - CMS 验证
  - 确保活动管理功能正常
  - 确保用户管理功能正常
  - 如有问题请询问用户

### Phase 5: 评测套件 (Optional)

- [ ] 10. 实现评测套件
  - [ ] 10.1 定义测试用例格式
    - 创建 JSON 格式的 Golden Dataset
    - 定义输入/期望输出结构
    - _Requirements: AI Ops Evaluation_

  - [ ] 10.2 实现批量跑测逻辑
    - 循环调用 AI 解析 API
    - 比对返回的 JSON 字段
    - _Requirements: AI Ops Evaluation_

  - [ ] 10.3 生成测试报告
    - 实现红/绿测试报告
    - 显示通过率统计
    - _Requirements: AI Ops Evaluation_

- [ ] 11. Final Checkpoint - AI Ops 完成
  - 确保 Playground 可以正常调用 AI 解析
  - 确保 Inspector 组件正确渲染各类 Widget 数据
  - 确保对话审计页面可以查看历史对话
  - 如有问题请询问用户

---

## Legacy Tasks (API 端点扩展)

> 以下任务为原有 Admin API 端点扩展，已部分完成

### User Module 扩展

- [x] 12. 扩展 User Module 支持 Admin 端点
  - [x] 12.1 更新 `user.model.ts` 添加 Admin Schema
  - [x] 12.2 更新 `user.service.ts` 添加 Admin 服务函数
  - [x] 12.3 更新 `user.controller.ts` 添加 Admin 端点
  - [x] 12.4 编写 User Admin API 属性测试

### Activity Module 扩展

- [ ] 13. 扩展 Activity Module 支持 Admin 端点
  - [ ] 13.1 更新 `activity.model.ts` 添加 Admin Schema
  - [ ] 13.2 更新 `activity.service.ts` 添加 Admin 服务函数
  - [ ] 13.3 更新 `activity.controller.ts` 添加 Admin 端点
  - [ ] 13.4 编写 Activity Admin API 属性测试

### Dashboard Module 增强

- [ ] 14. 增强 Dashboard 统计数据
  - [ ] 14.1 更新 `dashboard.model.ts` 增强统计 Schema
  - [ ] 14.2 更新 `dashboard.service.ts` 增强统计逻辑

### Admin 端适配

- [ ] 15. 更新 Admin 端 Hooks
  - [ ] 15.1 更新 `use-users.ts` 使用真实 API
  - [ ] 15.2 创建 `use-activities.ts` 使用真实 API
  - [ ] 15.3 更新 `activity-list-page.tsx` 使用真实 API

---

## Notes

- **核心理念**：Admin 擅长展示密集信息，小程序擅长展示精美 UI。Admin 专注于展示 JSON Payload 和逻辑链路
- **开发极速**：使用 Shadcn/ui + Vercel AI SDK，搭建功能完备的 Playground 只需要半天时间
- **调试闭环**：不仅能看（Logs），还能修（Playground），还能测（Evaluation）
- 所有 Schema 必须从 `@juchang/db` 派生，禁止手动定义
- 遵循 juchang-rules.md 中的编码规范

