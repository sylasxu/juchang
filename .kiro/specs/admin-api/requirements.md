# Requirements Document

## Introduction

本文档定义了 JuChang Admin 后台的完整需求。**v3.2 核心理念转变**：从"复刻小程序 UI"转向"透视 AI 数据"。

Admin Console 的核心定位是 **AI 调试与数据中控台 (AI Ops & Data Console)**：
- **对于 AI**：它是 X-Ray（X光机），负责透视 AI 的思考过程、意图分类准确率和结构化数据质量
- **对于业务**：它是 CMS，负责管理用户、活动和内容风控

## Glossary

- **Admin_API**: 专门为 Admin 后台提供的管理接口
- **User_Module**: 用户管理模块
- **Activity_Module**: 活动管理模块
- **Dashboard_Module**: 仪表板统计模块
- **Pagination**: 分页查询参数（page, limit）
- **Eden_Treaty**: Admin 使用的类型安全 API 客户端
- **AI_Ops**: AI 运维调试功能
- **Playground**: AI 调试沙箱
- **Inspector**: 数据探针面板（用于展示 AI 返回的结构化数据）
- **Golden_Dataset**: 金标准测试集（用于 Prompt 回归测试）

## AI Ops Requirements (v3.2 新增)

### Requirement 6: AI Playground

**User Story:** As a developer, I want to test AI parsing in a sandbox environment, so that I can debug and improve AI responses.

#### Acceptance Criteria

1. WHEN a developer opens the Playground, THE Admin_Console SHALL display a chat interface
2. WHEN a developer sends a message, THE Playground SHALL call the `/ai/parse` API via `useChat` hook
3. WHEN AI returns a text response, THE Playground SHALL render it as Markdown
4. WHEN AI returns a widget response, THE Playground SHALL render an Inspector panel (not UI card)
5. THE Playground SHALL support System Prompt Override configuration
6. THE Playground SHALL support saving/loading prompt presets

### Requirement 7: Inspector Pattern

**User Story:** As a developer, I want to see structured data from AI responses, so that I can verify data quality.

#### Acceptance Criteria

1. WHEN AI returns `widget_draft`, THE DraftInspector SHALL display time, location, type in structured format
2. WHEN AI returns `widget_explore`, THE ExploreInspector SHALL display search keywords, center coordinates, result list
3. THE Inspector SHALL include a link to verify location on Tencent Map
4. THE Inspector SHALL display confidence level when available
5. THE RawJsonInspector SHALL support fold/expand and copy JSON

### Requirement 8: Conversation Audit

**User Story:** As a developer, I want to review historical conversations, so that I can identify and fix AI issues.

#### Acceptance Criteria

1. WHEN a developer opens Conversation Inspector, THE Admin_Console SHALL display a list of sessions
2. THE session list SHALL highlight conversations with widget generation failures (red)
3. THE session list SHALL highlight conversations with unclear intent
4. WHEN a developer clicks a session, THE Admin_Console SHALL display the full conversation flow
5. THE conversation detail SHALL reuse Playground rendering components in read-only mode
6. THE Admin_Console SHALL provide a [Fix & Test] button to import conversation context to Playground

### Requirement 9: Evaluation Suite (Optional)

**User Story:** As a developer, I want to run regression tests on AI prompts, so that I can ensure prompt changes don't break existing functionality.

#### Acceptance Criteria

1. THE Admin_Console SHALL support defining test cases in JSON format (Golden Dataset)
2. WHEN a developer clicks "Run All Tests", THE Admin_Console SHALL call AI API for each test case
3. THE Admin_Console SHALL compare AI responses with expected outputs
4. THE Admin_Console SHALL generate a red/green test report with pass rate

---

## Legacy Requirements (API 端点)

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

