# API Enhancement Implementation Plan

## 实施策略

基于 PRD V9.2 和现有 API 实现情况，精简任务列表，专注于真正缺失的核心功能。

## 已完成的核心模块

- ✅ 用户认证 (auth) - 微信登录、JWT
- ✅ 用户管理 (users) - 靠谱度、统计
- ✅ 活动管理 (activities) - CRUD、地图查询、报名、确认
- ✅ 参与者管理 (participants) - 报名、审批、履约确认、申诉
- ✅ 群聊 (chat) - 消息发送、历史记录
- ✅ AI 功能 (ai) - 意图解析、额度管理
- ✅ 交易 (transactions) - 支付、订单
- ✅ 通知 (notifications) - 列表、已读、创建
- ✅ 仪表板 (dashboard) - 统计数据

## 待完成任务

- [x] 1. 实现通知系统模块
- [x] 1.1 创建通知模块基础结构
- [x] 1.2 编写通知模块属性测试
- [x] 1.3 实现通知创建服务

- [x] 2. 实现差评反馈模块


- [x] 2.1 创建反馈模块基础结构


  - 创建 `apps/api/src/modules/feedbacks/` 目录
  - 创建 feedback.model.ts，定义 TypeBox schemas
  - 创建 feedback.service.ts，实现业务逻辑
  - 创建 feedback.controller.ts，定义 API 端点
  - _Requirements: PRD 5.4 差评反馈_

- [x] 3. 实现分享功能 API



- [x] 3.1 实现分享数据生成端点


  - 添加 GET /activities/:id/share 端点
  - 返回场景参数、标题、时间、地点、缺人数、倒计时
  - _Requirements: PRD 5.0 场景B 分享卡片闭环_

- [x] 3.2 实现场景参数解析

  - 在活动详情端点支持 scene 参数
  - 解析场景参数并返回对应活动
  - _Requirements: PRD 5.0 场景C 扫码落地_

- [x] 4. 定时任务系统



  - [x] 4.1 创建定时任务基础架构


    - 创建 `apps/api/src/jobs/` 目录
    - 实现任务调度器（基于 setInterval 或 cron 表达式）
    - _Requirements: PRD 7.3 超时处理_
  - [x] 4.2 实现履约超时自动确认


    - 活动结束后 48 小时未确认自动标记为已履约
    - _Requirements: PRD 7.3.1_

  - [x] 4.3 实现申诉超时自动处理

    - 申诉提交后 72 小时未处理自动扣分
    - _Requirements: PRD 7.3.2_
  - [x] 4.4 实现活动状态自动更新


    - 活动开始时间到达自动更新为进行中
    - 活动结束时间到达自动更新为已结束
    - _Requirements: PRD 7.3.3_

## 说明

根据 PRD V9.2，所有核心业务流程已实现完成：

1. ✅ **通知系统** - 列表、已读、批量标记、创建
2. ✅ **差评反馈** - PRD 5.4 定义的活动结束后反馈流程
3. ✅ **分享功能** - PRD 5.0 定义的分享卡片和扫码落地
4. ✅ **定时任务** - 履约超时、申诉超时、活动状态自动更新

WebSocket 实时通信、操作日志等功能可以在 MVP 后迭代添加。
