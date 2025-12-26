# Requirements Document

## Introduction

本文档定义了 JuChang Admin 后台所需的 API 端点。当前 API 主要服务于小程序端，缺少 Admin 后台管理所需的列表查询、详情查看和管理操作接口。本需求旨在补充这些缺失的 Admin API 端点。

## Glossary

- **Admin_API**: 专门为 Admin 后台提供的管理接口
- **User_Module**: 用户管理模块
- **Activity_Module**: 活动管理模块
- **Dashboard_Module**: 仪表板统计模块
- **Pagination**: 分页查询参数（page, limit）
- **Eden_Treaty**: Admin 使用的类型安全 API 客户端

## 现状分析

### Admin 端调用情况

| 调用位置 | 期望端点 | 当前状态 |
|---------|---------|---------|
| `use-users.ts` | `GET /users` | ❌ 缺失 |
| `use-users.ts` | `GET /users/:id` | ❌ 缺失 |
| `use-users.ts` | `PUT /users/:id` | ❌ 缺失 |
| `use-dashboard.ts` | `GET /dashboard/stats` | ✅ 已有 |
| `use-dashboard.ts` | `GET /dashboard/activities` | ✅ 已有 |
| `activity-list-page.tsx` | `GET /activities` | ❌ 缺失（使用 Mock） |
| `activity-list-page.tsx` | `PATCH /activities/:id/status` | ⚠️ 部分（仅小程序用） |

### API 端现有端点

| 模块 | 端点 | 用途 |
|-----|------|-----|
| users | `GET /users/me` | 小程序获取当前用户 |
| users | `PATCH /users/me` | 小程序更新个人资料 |
| users | `GET /users/me/quota` | 小程序获取额度 |
| activities | `GET /activities/mine` | 小程序获取我的活动 |
| activities | `GET /activities/:id` | 获取活动详情 |
| activities | `POST /activities` | 创建活动 |
| activities | `PATCH /activities/:id/status` | 更新活动状态 |
| activities | `DELETE /activities/:id` | 删除活动 |
| activities | `POST /activities/:id/join` | 报名活动 |
| activities | `POST /activities/:id/quit` | 退出活动 |
| dashboard | `GET /dashboard/stats` | 统计数据 |
| dashboard | `GET /dashboard/activities` | 最近活动 |

## Requirements

### Requirement 1: 用户列表查询

**User Story:** As an admin, I want to view a paginated list of users, so that I can manage platform users.

#### Acceptance Criteria

1. WHEN an admin requests the user list, THE User_Module SHALL return a paginated list of users
2. WHEN pagination parameters are provided, THE User_Module SHALL return the specified page with the specified limit
3. WHEN a search parameter is provided, THE User_Module SHALL filter users by nickname or phone number
4. THE User_Module SHALL exclude sensitive fields (wxOpenId) from the response
5. THE User_Module SHALL return total count for pagination

### Requirement 2: 用户详情查询

**User Story:** As an admin, I want to view user details, so that I can understand user information.

#### Acceptance Criteria

1. WHEN an admin requests user details by ID, THE User_Module SHALL return the user's full information
2. IF the user does not exist, THEN THE User_Module SHALL return a 404 error
3. THE User_Module SHALL exclude sensitive fields (wxOpenId) from the response

### Requirement 3: 用户信息更新

**User Story:** As an admin, I want to update user information, so that I can manage user data.

#### Acceptance Criteria

1. WHEN an admin updates user information, THE User_Module SHALL update the specified fields
2. IF the user does not exist, THEN THE User_Module SHALL return a 404 error
3. THE User_Module SHALL only allow updating non-sensitive fields (nickname, avatarUrl)

### Requirement 4: 活动列表查询

**User Story:** As an admin, I want to view a paginated list of activities, so that I can manage platform activities.

#### Acceptance Criteria

1. WHEN an admin requests the activity list, THE Activity_Module SHALL return a paginated list of activities
2. WHEN pagination parameters are provided, THE Activity_Module SHALL return the specified page with the specified limit
3. WHEN a search parameter is provided, THE Activity_Module SHALL filter activities by title or location
4. WHEN a status filter is provided, THE Activity_Module SHALL filter activities by status
5. WHEN a type filter is provided, THE Activity_Module SHALL filter activities by type
6. THE Activity_Module SHALL include creator information in the response
7. THE Activity_Module SHALL return total count for pagination

### Requirement 5: 仪表板统计增强

**User Story:** As an admin, I want to see enhanced dashboard statistics, so that I can monitor platform health.

#### Acceptance Criteria

1. THE Dashboard_Module SHALL return activeUsers count (today's active users)
2. THE Dashboard_Module SHALL return growth rate calculations
3. THE Dashboard_Module SHALL return todayNewUsers count

