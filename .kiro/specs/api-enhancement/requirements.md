# API Enhancement Requirements

## Introduction

本文档定义聚场(JuChang)后端 API 层的完善需求。基于现有的 Elysia API 架构，确保所有前端功能（小程序和管理后台）都有对应的 API 支持。重点补充通知系统、差评反馈、定时任务、WebSocket 实时通信等缺失的 API 模块。

## Glossary

- **API_System**: 基于 Elysia 框架的后端 API 服务
- **Notification_Module**: 通知系统模块，处理系统通知的创建、查询和状态管理
- **Feedback_Module**: 差评反馈模块，处理活动结束后的用户反馈
- **Schedule_Module**: 定时任务模块，处理履约超时、活动状态更新等定时逻辑
- **WebSocket_Module**: 实时通信模块，支持群聊消息实时推送
- **Action_Log**: 操作日志，记录关键业务操作用于审计

## Requirements

### Requirement 1: 通知系统 API

**User Story:** As a 用户, I want 接收和管理系统通知, so that 我可以及时了解活动申请、履约确认等重要信息。

#### Acceptance Criteria

1. WHEN 用户请求通知列表 THEN API_System SHALL 返回分页的通知列表，包含类型、标题、内容、已读状态
2. WHEN 用户标记通知为已读 THEN API_System SHALL 更新通知的已读状态和已读时间
3. WHEN 用户批量标记通知已读 THEN API_System SHALL 支持一次性标记多条通知为已读
4. WHEN 用户请求未读通知数量 THEN API_System SHALL 返回当前用户的未读通知总数
5. WHEN 系统事件触发通知 THEN API_System SHALL 创建对应类型的通知记录并关联元数据

### Requirement 2: 差评反馈 API

**User Story:** As a 活动参与者, I want 在活动结束后提交反馈, so that 系统可以记录不良行为并帮助其他用户做决策。

#### Acceptance Criteria

1. WHEN 用户提交差评反馈 THEN API_System SHALL 验证用户是活动参与者并记录反馈信息
2. WHEN 用户提交反馈 THEN API_System SHALL 校验反馈原因为有效的枚举值（迟到、放鸽子、态度不好、与描述不符、其他）
3. WHEN 用户查询某用户的差评记录 THEN API_System SHALL 返回该用户收到的差评统计和详情
4. WHEN 管理员查询反馈列表 THEN API_System SHALL 支持按活动、用户、原因类型筛选反馈记录

### Requirement 3: 定时任务系统

**User Story:** As a 系统管理员, I want 系统自动处理超时逻辑, so that 履约确认和活动状态可以自动更新。

#### Acceptance Criteria

1. WHEN 活动结束超过24小时且发起人未确认履约 THEN Schedule_Module SHALL 自动标记全员履约成功
2. WHEN 用户被标记未到场超过24小时且未申诉 THEN Schedule_Module SHALL 自动生效扣分
3. WHEN 活动开始时间到达 THEN Schedule_Module SHALL 更新活动状态为进行中
4. WHEN 活动结束时间到达 THEN Schedule_Module SHALL 更新活动状态为已结束并触发履约确认通知
5. WHEN Pin+服务超过24小时 THEN Schedule_Module SHALL 自动取消黄金置顶效果

### Requirement 4: WebSocket 实时通信

**User Story:** As a 群聊用户, I want 实时接收新消息, so that 我可以与其他参与者即时沟通。

#### Acceptance Criteria

1. WHEN 用户连接 WebSocket THEN API_System SHALL 验证用户身份并建立连接
2. WHEN 群聊有新消息 THEN WebSocket_Module SHALL 向该活动的所有在线参与者推送消息
3. WHEN 用户断开连接 THEN WebSocket_Module SHALL 清理连接资源并更新在线状态
4. WHEN 用户重新连接 THEN WebSocket_Module SHALL 支持断线重连并同步离线期间的消息

### Requirement 5: 操作日志 API

**User Story:** As a 系统管理员, I want 查看用户操作日志, so that 我可以进行审计和问题排查。

#### Acceptance Criteria

1. WHEN 关键业务操作发生 THEN API_System SHALL 记录操作日志包含用户ID、操作类型、元数据、设备信息
2. WHEN 管理员查询操作日志 THEN API_System SHALL 支持按用户、操作类型、时间范围筛选
3. WHEN 记录操作日志 THEN API_System SHALL 包含履约确认、申诉提交、支付成功、AI使用等操作类型

### Requirement 6: 活动状态管理增强

**User Story:** As a 活动发起人, I want 管理活动的完整生命周期, so that 我可以控制活动的各个阶段。

#### Acceptance Criteria

1. WHEN 发起人取消活动 THEN API_System SHALL 更新活动状态并通知所有参与者
2. WHEN 活动满员 THEN API_System SHALL 自动更新活动状态为已满员
3. WHEN 查询活动状态变更历史 THEN API_System SHALL 返回活动状态的变更记录
4. WHEN 发起人延期活动 THEN API_System SHALL 更新活动时间并通知所有参与者

### Requirement 7: 用户统计 API 增强

**User Story:** As a 用户, I want 查看详细的个人统计数据, so that 我可以了解自己的活动参与情况。

#### Acceptance Criteria

1. WHEN 用户请求个人统计 THEN API_System SHALL 返回组织场次、参与场次、履约率、靠谱度徽章、差评次数
2. WHEN 用户请求靠谱度详情 THEN API_System SHALL 返回靠谱度计算明细和徽章（🏅超靠谱/✓靠谱/🆕新人）
3. WHEN 用户请求活动历史 THEN API_System SHALL 支持按状态（已完成、进行中、已取消）筛选

### Requirement 8: 管理后台 API 增强

**User Story:** As a 管理员, I want 通过 API 管理平台数据, so that 我可以进行内容审核和用户管理。

#### Acceptance Criteria

1. WHEN 管理员审核活动 THEN API_System SHALL 支持隐藏、标记、删除活动并记录审核原因
2. WHEN 管理员查询审核队列 THEN API_System SHALL 返回待审核内容列表按风险等级排序
3. WHEN 管理员处理用户举报 THEN API_System SHALL 更新举报状态并记录处理结果
4. WHEN 管理员查询平台统计 THEN API_System SHALL 返回用户增长、活动数量、收入等核心指标

### Requirement 9: 分享功能

**User Story:** As a 用户, I want 通过微信原生分享功能分享活动, so that 我可以快速邀请朋友参与活动。

#### Acceptance Criteria

1. WHEN 用户请求活动分享数据 THEN API_System SHALL 返回适用于微信原生分享的数据（标题、路径、图片）
2. WHEN 用户通过分享链接访问 THEN API_System SHALL 解析路径参数并返回对应活动详情
3. WHEN 生成分享数据 THEN API_System SHALL 返回活动标题、时间、地点、缺人数等信息

### Requirement 10: 增值服务状态查询

**User Story:** As a 用户, I want 查看我购买的增值服务状态, so that 我可以了解服务的有效期和使用情况。

#### Acceptance Criteria

1. WHEN 用户查询活动的增值服务状态 THEN API_System SHALL 返回 Boost 和 Pin+ 的启用状态和剩余时间
2. WHEN 用户查询 AI 额度 THEN API_System SHALL 返回今日剩余次数和重置时间
3. WHEN 用户查询会员状态 THEN API_System SHALL 返回会员类型、到期时间和专属权益
