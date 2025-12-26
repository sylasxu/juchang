# Implementation Plan: Admin API

## Overview

本计划实现 Admin 后台所需的 API 端点，在现有模块中扩展功能，保持领域分离。

## Tasks

### Phase 1: User Module 扩展

- [x] 1. 扩展 User Module 支持 Admin 端点
  - [x] 1.1 更新 `user.model.ts` 添加 Admin Schema
    - 添加 AdminUserSchema (排除 wxOpenId)
    - 添加 UserListQuerySchema (分页、搜索参数)
    - 添加 UserListResponseSchema (列表响应)
    - 添加 UpdateUserRequestSchema (更新请求)
    - _Requirements: 1.1, 1.4, 2.3, 3.3_

  - [x] 1.2 更新 `user.service.ts` 添加 Admin 服务函数
    - 添加 `getUserList(query)` - 分页查询用户列表
    - 添加 `getAdminUserById(id)` - 获取用户详情（排除敏感字段）
    - 添加 `adminUpdateUser(id, data)` - 更新用户信息
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 3.1_

  - [x] 1.3 更新 `user.controller.ts` 添加 Admin 端点
    - 添加 `GET /users` - 用户列表
    - 添加 `GET /users/:id` - 用户详情
    - 添加 `PUT /users/:id` - 更新用户
    - _Requirements: 1.1, 2.1, 3.1_

  - [x] 1.4 编写 User Admin API 属性测试
    - **Property 1: 用户列表分页正确性**
    - **Property 2: 用户搜索过滤正确性**
    - **Property 3: 敏感字段排除**
    - **Validates: Requirements 1.1-1.5, 2.1-2.3**

- [ ] 2. Checkpoint - User Admin API 验证
  - 运行 TypeScript 编译检查
  - 如有问题请询问用户

### Phase 2: Activity Module 扩展

- [ ] 3. 扩展 Activity Module 支持 Admin 端点
  - [ ] 3.1 更新 `activity.model.ts` 添加 Admin Schema
    - 添加 ActivityListQuerySchema (分页、筛选参数)
    - 添加 ActivityListResponseSchema (列表响应，含 creator)
    - _Requirements: 4.1, 4.6_

  - [ ] 3.2 更新 `activity.service.ts` 添加 Admin 服务函数
    - 添加 `getActivityList(query)` - 分页查询活动列表
    - 实现搜索、状态筛选、类型筛选
    - 关联查询 creator 信息
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [ ] 3.3 更新 `activity.controller.ts` 添加 Admin 端点
    - 添加 `GET /activities` - 活动列表
    - _Requirements: 4.1_

  - [ ] 3.4 编写 Activity Admin API 属性测试
    - **Property 5: 活动列表分页正确性**
    - **Property 6: 活动状态过滤正确性**
    - **Property 7: 活动类型过滤正确性**
    - **Property 8: 活动创建者信息完整性**
    - **Validates: Requirements 4.1-4.7**

- [ ] 4. Checkpoint - Activity Admin API 验证
  - 运行 TypeScript 编译检查
  - 如有问题请询问用户

### Phase 3: Dashboard Module 增强

- [ ] 5. 增强 Dashboard 统计数据
  - [ ] 5.1 更新 `dashboard.model.ts` 增强统计 Schema
    - 添加 activeUsers 字段
    - 添加 userGrowthRate 字段
    - 添加 activeUserGrowthRate 字段
    - 添加 activityGrowthRate 字段
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ] 5.2 更新 `dashboard.service.ts` 增强统计逻辑
    - 实现 activeUsers 计算（今日活跃用户）
    - 实现增长率计算逻辑
    - _Requirements: 5.1, 5.2, 5.3_

- [ ] 6. Checkpoint - Dashboard 增强验证
  - 运行 TypeScript 编译检查
  - 如有问题请询问用户

### Phase 4: Admin 端适配

- [ ] 7. 更新 Admin 端 Hooks
  - [ ] 7.1 更新 `use-users.ts` 使用真实 API
    - 修复 `useUsersList` 调用
    - 修复 `useAdminUser` 调用
    - 修复 `useUpdateUser` 调用
    - _Requirements: Admin_

  - [ ] 7.2 创建 `use-activities.ts` 使用真实 API
    - 实现 `useActivitiesList` hook
    - 实现 `useActivityDetail` hook
    - _Requirements: Admin_

  - [ ] 7.3 更新 `activity-list-page.tsx` 使用真实 API
    - 移除 mock fetchActivities 函数
    - 使用 `useActivitiesList` hook
    - _Requirements: Admin_

- [ ] 8. Final Checkpoint
  - 运行全局 TypeScript 编译检查
  - 如有问题请询问用户

---

## Notes

- 任务按 Phase 顺序执行，每个 Phase 完成后进行 Checkpoint 验证
- 标记 `*` 的任务为可选测试任务
- 所有 Schema 必须从 `@juchang/db` 派生，禁止手动定义
- 遵循 juchang-rules.md 中的编码规范

