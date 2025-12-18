# Requirements Document

## Introduction

本文档定义聚场(JuChang)小程序的开发需求，基于PRD V9.2版本。聚场是一个基于LBS的P2P社交平台，核心功能是帮助用户发现和组织线下活动。小程序采用3 Tab导航设计（地图、消息、我的），地图首页以全屏地图为底，配合底部可滑动抽屉和浮动功能按钮。

## Glossary

- **Pin**: 地图上的标记点，代表活动、用户或需求锚点
- **Boost (强力召唤)**: 付费增值服务，向周围3km内用户发送推送通知
- **Pin+ (黄金置顶)**: 付费增值服务，地图Pin变大变金色，持续24小时
- **Fast Pass (优先入场券)**: 付费增值服务，申请在审批列表中置顶显示
- **靠谱度**: 用户履约率，计算公式为 履约次数/参与次数×100%
- **履约确认**: 活动结束后发起人确认参与者到场情况的流程
- **申诉**: 被标记"未到场"的用户可一键申诉的机制
- **幽灵锚点**: 运营投放的需求引导Pin，用于冷启动
- **底部抽屉**: 地图页面底部可滑动的面板，包含筛选、创建活动等功能入口
- **浮动按钮**: 地图周围的小圆形功能按钮（安全中心、定位等）

## Requirements

### Requirement 1: 导航架构

**User Story:** As a 用户, I want 使用简洁的3 Tab导航结构, so that 我可以快速访问核心功能。

#### Acceptance Criteria

1. WHEN 用户打开小程序 THEN 小程序 SHALL 显示底部导航栏包含3个Tab（地图、消息、我的）
2. WHEN 用户切换Tab THEN 小程序 SHALL 平滑切换到对应页面并更新Tab选中状态
3. WHILE 有未读消息 THEN 消息Tab SHALL 显示未读消息数量角标

### Requirement 2: 地图首页

**User Story:** As a 用户, I want 在全屏地图上查看附近的活动, so that 我可以直观地发现和参与感兴趣的活动。

#### Acceptance Criteria

1. WHEN 用户进入地图页 THEN 小程序 SHALL 请求位置权限并以用户当前位置为中心渲染全屏地图
2. WHEN 地图加载完成 THEN 小程序 SHALL 从API获取附近活动数据并渲染活动Pin（橙色）
3. WHEN 活动启用Pin+服务 THEN 该活动Pin SHALL 显示为1.5倍大小、金色、带光晕动效
4. WHEN 活动启用Boost服务 THEN 该活动Pin SHALL 显示闪烁动效和"🔥急招"标签
5. WHEN 用户点击活动Pin THEN 小程序 SHALL 显示活动简要信息卡片
6. WHEN 用户点击活动卡片 THEN 小程序 SHALL 跳转到活动详情页

### Requirement 3: 地图浮动按钮

**User Story:** As a 用户, I want 在地图上快速访问常用功能, so that 我可以便捷地操作地图和访问安全功能。

#### Acceptance Criteria

1. WHEN 用户在地图页 THEN 小程序 SHALL 在地图右侧显示定位按钮
2. WHEN 用户点击定位按钮 THEN 小程序 SHALL 将地图中心移动到用户当前位置
3. WHEN 用户在地图页 THEN 小程序 SHALL 在地图左上角显示安全中心按钮
4. WHEN 用户点击安全中心按钮 THEN 小程序 SHALL 跳转到安全中心页面

### Requirement 4: 底部抽屉

**User Story:** As a 用户, I want 通过底部抽屉访问筛选和创建功能, so that 我可以在不离开地图的情况下进行操作。

#### Acceptance Criteria

1. WHEN 用户在地图页 THEN 小程序 SHALL 在底部显示可滑动抽屉（默认收起状态显示部分内容）
2. WHEN 用户向上滑动抽屉 THEN 小程序 SHALL 展开抽屉显示完整内容
3. WHEN 用户向下滑动抽屉 THEN 小程序 SHALL 收起抽屉到默认高度
4. WHEN 抽屉展开 THEN 小程序 SHALL 显示筛选选项、创建活动入口、附近活动列表等内容
5. WHEN 用户点击创建活动按钮 THEN 小程序 SHALL 跳转到活动创建页面

### Requirement 5: 活动筛选

**User Story:** As a 用户, I want 通过多维度筛选活动, so that 我可以快速找到符合我需求的活动。

#### Acceptance Criteria

1. WHEN 用户在底部抽屉中点击筛选 THEN 小程序 SHALL 显示筛选选项（时间、类型、人群、靠谱度、距离、状态、费用）
2. WHEN 用户选择筛选条件 THEN 小程序 SHALL 根据条件过滤活动并重新渲染地图Pin和列表
3. WHEN 用户点击重置按钮 THEN 小程序 SHALL 清除所有筛选条件并显示全部活动
4. WHILE 筛选条件生效 THEN 筛选入口 SHALL 显示已选条件数量的角标

### Requirement 6: 活动详情页

**User Story:** As a 用户, I want 查看活动的完整信息, so that 我可以决定是否参与该活动。

#### Acceptance Criteria

1. WHEN 用户进入活动详情页 THEN 小程序 SHALL 显示活动标题、描述、图片、时间、地点、人数、费用类型等信息
2. WHEN 活动设置为私密局 THEN 小程序 SHALL 显示模糊地址（如"某某小区附近"）直到用户报名通过
3. WHEN 用户点击发起人头像 THEN 小程序 SHALL 显示发起人的靠谱度、组织场次、参与场次等信息
4. WHEN 用户点击报名按钮 THEN 小程序 SHALL 校验用户靠谱度是否满足活动门槛
5. IF 用户靠谱度不满足门槛 THEN 小程序 SHALL 显示"靠谱度不足"提示并阻止报名
6. WHEN 活动为热门活动（申请人数>5） THEN 小程序 SHALL 显示优先申请选项（Fast Pass ¥2）

### Requirement 7: 活动创建

**User Story:** As a 用户, I want 创建活动并发布, so that 我可以组织线下聚会。

#### Acceptance Criteria

1. WHEN 用户进入活动创建页 THEN 小程序 SHALL 显示标题、描述、时间、地点、人数、费用类型、隐私设置等字段
2. WHEN 用户选择地点 THEN 小程序 SHALL 强制要求填写位置备注（如"4楼平台入口"）
3. WHEN 用户勾选"模糊地理位置" THEN 小程序 SHALL 在活动发布后对未通过审批的用户隐藏精确位置
4. WHEN 用户点击发布按钮 THEN 小程序 SHALL 校验必填字段并调用创建活动API
5. WHEN 活动创建成功 THEN 小程序 SHALL 显示分享选项并可分享到微信群
6. WHEN 用户选择推广服务 THEN 小程序 SHALL 显示Boost（¥3）和Pin+（¥5）选项

### Requirement 8: 消息中心

**User Story:** As a 用户, I want 在一个页面查看所有通知和群聊, so that 我可以及时处理活动相关的消息。

#### Acceptance Criteria

1. WHEN 用户进入消息页 THEN 小程序 SHALL 显示系统通知区域和群聊列表区域
2. WHEN 有新的申请通知 THEN 系统通知区域 SHALL 显示"XXX申请加入你的XXX活动"
3. WHEN 用户被标记为"未到场" THEN 系统通知 SHALL 显示通知并包含"我到场了"申诉按钮
4. WHEN 用户点击群聊项 THEN 小程序 SHALL 跳转到对应活动的群聊页面
5. WHILE 有未读消息 THEN 消息Tab SHALL 显示未读消息数量角标

### Requirement 9: 群聊功能

**User Story:** As a 活动参与者, I want 在活动群聊中与其他参与者沟通, so that 我可以协调活动细节。

#### Acceptance Criteria

1. WHEN 用户进入群聊页 THEN 小程序 SHALL 显示活动信息头部和消息列表
2. WHEN 用户发送文本消息 THEN 小程序 SHALL 调用发送消息API并实时显示在消息列表
3. WHEN 其他用户发送消息 THEN 小程序 SHALL 通过WebSocket实时接收并显示新消息
4. WHEN 活动结束 THEN 群聊 SHALL 保留但标记为"已归档"状态

### Requirement 10: 履约确认

**User Story:** As a 活动发起人, I want 在活动结束后确认参与者的到场情况, so that 系统可以更新参与者的靠谱度。

#### Acceptance Criteria

1. WHEN 活动结束时间到达 THEN 小程序 SHALL 向发起人发送履约确认通知
2. WHEN 发起人进入履约确认页 THEN 小程序 SHALL 显示所有参与者列表并默认勾选"已到场"
3. WHEN 发起人标记某用户"未到场" THEN 小程序 SHALL 显示警告"标记他人未到场将扣除你1%靠谱度"
4. WHEN 发起人点击确认完成 THEN 小程序 SHALL 调用履约确认API更新参与者状态
5. IF 发起人24小时内未操作 THEN 系统 SHALL 自动标记全员履约成功

### Requirement 11: 申诉机制

**User Story:** As a 被标记未到场的用户, I want 一键申诉, so that 我可以避免被错误扣分。

#### Acceptance Criteria

1. WHEN 用户被标记为"未到场" THEN 小程序 SHALL 发送推送通知包含"我到场了"按钮
2. WHEN 用户点击"我到场了"按钮 THEN 小程序 SHALL 调用申诉API并将状态改为"争议中"
3. WHILE 状态为"争议中" THEN 系统 SHALL 不扣除该用户的靠谱度
4. IF 用户24小时内未申诉 THEN 系统 SHALL 自动生效扣分

### Requirement 12: 个人中心

**User Story:** As a 用户, I want 查看和管理我的个人信息, so that 我可以维护我的账户和了解我的活动数据。

#### Acceptance Criteria

1. WHEN 用户进入个人中心 THEN 小程序 SHALL 显示用户头像、昵称、靠谱度等级
2. WHEN 用户查看统计数据 THEN 小程序 SHALL 显示组织场次、参与场次、收到差评次数
3. WHEN 用户点击"我发布的" THEN 小程序 SHALL 显示用户创建的活动列表
4. WHEN 用户点击"我参与的" THEN 小程序 SHALL 显示用户参与的活动列表
5. WHEN 用户未登录 THEN 小程序 SHALL 显示登录入口并隐藏需要登录的功能

### Requirement 13: 差评反馈

**User Story:** As a 活动参与者, I want 在活动结束后反馈问题, so that 系统可以记录不良行为并帮助其他用户做决策。

#### Acceptance Criteria

1. WHEN 活动结束 THEN 小程序 SHALL 向参与者弹出体验反馈弹窗
2. WHEN 用户点击"有问题" THEN 小程序 SHALL 显示问题类型选择（迟到、放鸽子、态度不好、与描述不符、其他）
3. WHEN 用户选择问题类型并指定对象 THEN 小程序 SHALL 调用反馈API记录差评
4. WHEN 用户点击"挺好的"或关闭弹窗 THEN 小程序 SHALL 不记录任何反馈

### Requirement 14: 增值服务购买

**User Story:** As a 用户, I want 购买增值服务, so that 我可以获得更多曝光或优先权。

#### Acceptance Criteria

1. WHEN 用户在活动发布页选择Boost服务 THEN 小程序 SHALL 显示服务说明和价格（¥3）
2. WHEN 用户在活动发布页选择Pin+服务 THEN 小程序 SHALL 显示服务说明和价格（¥5）
3. WHEN 用户在报名页选择Fast Pass服务 THEN 小程序 SHALL 显示服务说明和价格（¥2）
4. WHEN 用户确认购买 THEN 小程序 SHALL 调用微信支付API完成支付
5. WHEN 支付成功 THEN 小程序 SHALL 立即下发对应权益并更新活动状态

### Requirement 15: 分享功能

**User Story:** As a 活动发起人, I want 生成精美的分享卡片, so that 我可以在微信群中推广我的活动。

#### Acceptance Criteria

1. WHEN 活动创建成功 THEN 小程序 SHALL 显示分享卡片预览包含活动标题、时间、地点、缺人数、倒计时
2. WHEN 用户点击分享按钮 THEN 小程序 SHALL 生成带小程序码的分享图片
3. WHEN 其他用户扫描分享图片中的小程序码 THEN 小程序 SHALL 直接打开对应活动详情页

### Requirement 16: 懒注册

**User Story:** As a 游客, I want 在不登录的情况下浏览活动, so that 我可以先了解平台再决定是否注册。

#### Acceptance Criteria

1. WHILE 用户未登录 THEN 小程序 SHALL 允许浏览地图和查看活动详情
2. WHEN 未登录用户尝试创建活动 THEN 小程序 SHALL 跳转到登录页面
3. WHEN 未登录用户尝试报名活动 THEN 小程序 SHALL 跳转到登录页面
4. WHEN 未登录用户尝试进入群聊 THEN 小程序 SHALL 跳转到登录页面
