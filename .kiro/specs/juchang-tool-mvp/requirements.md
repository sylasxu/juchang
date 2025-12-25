# Requirements Document

## Introduction

本文档定义聚场(JuChang)小程序 MVP 的开发需求，基于"纯工具版"PRD v2.2。

**核心定位**：微信群组局神器 —— 把群聊里的"流"，变成地图上的"桩"

**产品形态**：微信原生小程序 (Native + TypeScript + LESS)

**当前阶段**：Lean MVP (只做工具，不做平台)

**核心理念**：
- 我们不试图把用户从微信拉走，而是做一个"外挂"
- 输入端：接住微信群里乱七八糟的文本，用 AI 整理成结构化信息
- 输出端：生成微信原生卡片，利用视觉优势在群消息流中"抢占地盘"

**关键决策**：
- 商业模式：全免费（用爱发电/积累数据）
- 准入门槛：发布/报名时才要手机号（延迟验证）
- 增长引擎：群分享卡片（原生 onShareAppMessage）
- 地图逻辑：只展示"我相关的"活动（无需冷启动运营）
- 搜索功能：砍掉"搜附近活动"，只保留 AI 解析/创建

## Glossary

- **AI_Input_Bar**: 底部 Tabbar 上方悬浮的 AI 入口，整合搜索与创建功能
- **CUI_Panel**: AI 交互面板，展示思考态、搜索态、结果态的流式反馈
- **Activity_Pin**: 地图上的橙色标记点，代表用户发布的活动
- **Location_Hint**: 重庆地形适配的必填字段，如"4楼平台入口"、"地下通道进"
- **Activity_Type**: 活动类型枚举（food/sports/entertainment/boardgame/other）
- **Activity_Status**: 活动状态枚举（active/completed/cancelled）
- **Participant_Status**: 参与者状态枚举（joined/quit）
- **Share_Card**: 微信原生分享卡片，包含活动标题、地图预览、关键信息
- **Lite_Chat**: 活动临时群聊，仅支持文字消息，活动结束后 24h 归档
- **Delayed_Auth**: 延迟验证机制，浏览免登录，发布/报名时才要求绑定手机号
- **Custom_Navbar**: 自定义导航栏组件，用于处理单页进入时的返回逻辑

## Requirements

### Requirement 1: 导航架构

**User Story:** As a 用户, I want 使用简洁的 3 Tab + AI 输入栏导航结构, so that 我可以快速访问核心功能和 AI 助手。

#### Acceptance Criteria

1. WHEN 用户打开小程序 THEN 小程序 SHALL 显示底部导航栏包含 3 个 Tab（首页、消息、我的）
2. WHEN 用户打开小程序 THEN 小程序 SHALL 在 Tabbar 上方显示悬浮的 AI_Input_Bar
3. WHEN 用户切换 Tab THEN 小程序 SHALL 平滑切换到对应页面并更新 Tab 选中状态
4. WHILE 有未读消息 THEN 消息 Tab SHALL 显示未读消息数量角标

### Requirement 2: AI 输入栏

**User Story:** As a 用户, I want 通过 AI_Input_Bar 用自然语言创建活动, so that 我可以像在群里说话一样轻松组局。

#### Acceptance Criteria

1. WHEN 用户在首页 THEN 小程序 SHALL 在 Tabbar 上方显示 AI_Input_Bar（黑色长条，左侧 AI 图标，中间提示文案，右侧语音按钮）
2. WHEN 用户点击 AI_Input_Bar THEN 小程序 SHALL 展开 CUI_Panel 并聚焦输入框
3. WHEN 用户输入文本（如"明晚观音桥打麻将，3缺1"） THEN 小程序 SHALL 调用 AI 解析 API 并显示流式响应
4. WHEN 用户粘贴群消息文本 THEN 小程序 SHALL 自动识别并解析群接龙格式
5. WHEN 用户点击语音按钮 THEN 小程序 SHALL 启动语音识别并将结果填入输入框
6. WHILE 用户停止输入 800ms THEN 小程序 SHALL 触发 AI 解析请求（防抖机制）

### Requirement 3: CUI 副驾面板

**User Story:** As a 用户, I want 看到 AI 的思考过程和解析结果, so that 我感受到有人在回应我而不是冷冰冰的等待。

#### Acceptance Criteria

1. WHEN AI 开始处理请求 THEN CUI_Panel SHALL 在 0.5s 内显示思考态（"收到，正在定位观音桥..."）
2. WHEN AI 定位到地点 THEN 小程序 SHALL 同步将地图飞向目标位置
3. WHEN AI 解析完成 THEN CUI_Panel SHALL 显示创建草稿卡片（标题、时间、地点、类型）
4. WHEN 用户点击创建草稿卡片的"确认发布"按钮 THEN 小程序 SHALL 跳转到活动确认页
5. IF AI 解析失败（用户输入无效） THEN CUI_Panel SHALL 显示"请说人话"提示或引导手动填写

### Requirement 4: 首页地图

**User Story:** As a 用户, I want 在首页查看地图和我相关的活动, so that 我可以直观地看到自己发布和参与的活动位置。

#### Acceptance Criteria

1. WHEN 用户进入首页 THEN 小程序 SHALL 请求位置权限并以用户当前位置为中心渲染全屏地图
2. WHEN 地图加载完成 THEN 小程序 SHALL 从 API 获取"我相关的"活动数据并渲染 Activity_Pin
3. WHEN 用户点击 Activity_Pin THEN 小程序 SHALL 显示活动简要信息卡片
4. WHEN 用户点击活动卡片 THEN 小程序 SHALL 跳转到活动详情页
5. WHEN 用户点击定位按钮 THEN 小程序 SHALL 将地图中心移动到用户当前位置
6. WHEN Activity_Pin 渲染 THEN 小程序 SHALL 根据 Activity_Type 显示对应图标（🍲/⚽️/🎴/🎬/📍）

### Requirement 5: 活动创建确认页

**User Story:** As a 用户, I want 确认并微调 AI 解析的活动信息, so that 我可以确保发布的活动信息准确无误。

#### Acceptance Criteria

1. WHEN 用户进入活动确认页 THEN 小程序 SHALL 显示 AI 预填的标题、描述、时间、地点、类型、人数等字段
2. WHEN 用户拖动地图 Pin THEN 小程序 SHALL 更新活动坐标并反查地址填入地点字段
3. WHEN 用户选择地点 THEN 小程序 SHALL 强制要求填写 Location_Hint（选项：地面入口/地下通道进/XX楼平台/其他自定义）
4. WHEN 用户点击发布按钮且未绑定手机号 THEN 小程序 SHALL 弹出手机号绑定弹窗
5. WHEN 用户绑定手机号成功 THEN 小程序 SHALL 继续执行发布流程
6. WHEN 活动创建成功 THEN 小程序 SHALL 显示分享引导并调用微信原生分享接口
7. WHEN 用户今日发布次数达到 3 次 THEN 小程序 SHALL 显示"今日发布额度已用完"提示并阻止发布
8. WHEN 用户点击"手动创建"按钮 OR AI 解析返回 null THEN 小程序 SHALL 进入空白表单页，允许用户手动输入所有字段

### Requirement 6: 原生分享卡片

**User Story:** As a 活动发起人, I want 分享活动到微信群, so that 我可以在微信群中推广我的活动。

#### Acceptance Criteria

1. WHEN 活动创建成功 THEN 小程序 SHALL 自动弹出分享引导
2. WHEN 用户点击分享按钮 THEN 小程序 SHALL 调用 wx.showShareMenu 触发原生分享
3. WHEN Share_Card 生成 THEN 小程序 SHALL 使用 AI 生成的骚气标题（如"🔥 观音桥老火锅，3缺1，速来！"）
4. WHEN Share_Card 生成 THEN 小程序 SHALL 使用腾讯地图静态图 API 生成地图预览图（以活动坐标为中心，Zoom Level 16，包含红色 Marker，比例 5:4）
5. WHEN 其他用户点击 Share_Card THEN 小程序 SHALL 直接打开对应活动详情页（path=/pages/activity/detail?id=xxx）

### Requirement 7: 活动详情页

**User Story:** As a 用户, I want 查看活动的完整信息, so that 我可以决定是否参与该活动。

#### Acceptance Criteria

1. WHEN 用户进入活动详情页 THEN 小程序 SHALL 显示活动标题、描述、时间、地点、Location_Hint、类型图标、人数、发起人信息
2. WHEN 用户点击报名按钮且未绑定手机号 THEN 小程序 SHALL 弹出手机号绑定弹窗
3. WHEN 用户绑定手机号成功 THEN 小程序 SHALL 继续执行报名流程
4. WHEN 用户报名成功 THEN 小程序 SHALL 更新报名状态并显示"已报名"
5. WHEN 用户点击已报名用户头像列表 THEN 小程序 SHALL 显示参与者昵称
6. WHEN 活动详情页使用自定义导航栏 THEN Custom_Navbar SHALL 处理单页进入时的返回逻辑（跳转首页）
7. WHEN 活动状态为 cancelled THEN 小程序 SHALL 显示"活动已取消"标识并禁用报名按钮

### Requirement 8: 首页回流兜底

**User Story:** As a 通过分享卡片进入的用户, I want 返回时能到达首页, so that 我可以继续探索或创建自己的活动。

#### Acceptance Criteria

1. WHEN 用户通过 Share_Card 单点进入详情页 THEN 页面栈长度 SHALL 为 1
2. WHEN 页面栈长度为 1 且用户点击返回 THEN Custom_Navbar SHALL 调用 wx.switchTab 跳转到首页
3. WHEN 页面栈长度大于 1 且用户点击返回 THEN Custom_Navbar SHALL 调用 wx.navigateBack 正常返回
4. WHEN 用户回到首页 THEN 小程序 SHALL 显示气泡提示"你也来组个局？粘贴文字试试 👇"

### Requirement 9: 临时群聊

**User Story:** As a 活动参与者, I want 在活动群聊中与其他参与者沟通, so that 我可以协调活动细节。

#### Acceptance Criteria

1. WHEN 活动创建成功 THEN Lite_Chat SHALL 立即开启
2. WHEN 用户进入群聊页 THEN 小程序 SHALL 显示活动信息头部和消息列表
3. WHEN 用户发送文本消息 THEN 小程序 SHALL 调用发送消息 API 并实时显示在消息列表
4. WHEN 小程序需要获取新消息 THEN 小程序 SHALL 每 5-10 秒轮询 /chat/messages?since=last_id
5. WHEN 小程序进入后台 (onHide) THEN Lite_Chat SHALL 停止轮询
6. WHEN 小程序回到前台 (onShow) THEN Lite_Chat SHALL 立即发起一次请求并恢复轮询
7. WHEN 活动结束时间 + 24 小时后 THEN Lite_Chat SHALL 变为只读/归档状态
8. WHILE Lite_Chat 为归档状态 THEN 小程序 SHALL 禁用消息发送功能并显示"群聊已归档"提示

### Requirement 10: 履约确认与活动管理

**User Story:** As a 活动发起人, I want 管理活动状态, so that 我可以确认成局、取消或删除活动。

#### Acceptance Criteria

1. WHEN 活动开始时间到达 THEN 小程序 SHALL 在发起人的活动详情页显示 [✅ 确认成局] 和 [❌ 取消活动] 按钮
2. WHEN 发起人点击"确认成局" THEN 小程序 SHALL 调用 API 将 Activity_Status 更新为 completed
3. WHEN 发起人点击"取消活动" THEN 小程序 SHALL 调用 API 将 Activity_Status 更新为 cancelled
4. WHEN Activity_Status 更新成功 THEN 小程序 SHALL 向所有参与者发送通知
5. WHEN 活动处于 active 状态且未开始 THEN 发起人 SHALL 可以点击"删除活动"按钮
6. WHEN 发起人点击"删除活动" THEN 小程序 SHALL 调用 API 删除活动记录
7. WHEN 活动被删除后 THEN 该活动链接 SHALL 显示"活动不存在"页面

### Requirement 11: 消息中心

**User Story:** As a 用户, I want 在一个页面查看所有通知和群聊, so that 我可以及时处理活动相关的消息。

#### Acceptance Criteria

1. WHEN 用户进入消息页 THEN 小程序 SHALL 显示系统通知区域和群聊列表区域
2. WHEN 有新的报名通知 THEN 系统通知区域 SHALL 显示"XXX 报名了你的 XXX 活动"
3. WHEN 活动状态变更 THEN 系统通知区域 SHALL 显示相应通知（成局/取消）
4. WHEN 用户点击群聊项 THEN 小程序 SHALL 跳转到对应活动的群聊页面
5. WHILE 有未读消息 THEN 消息 Tab SHALL 显示未读消息数量角标

### Requirement 12: 个人中心

**User Story:** As a 用户, I want 查看和管理我的个人信息, so that 我可以维护我的账户和了解我的活动数据。

#### Acceptance Criteria

1. WHEN 用户进入个人中心 THEN 小程序 SHALL 显示用户头像、昵称
2. WHEN 用户未完善资料 THEN 小程序 SHALL 显示默认头像和"匿名搭子"昵称
3. WHEN 用户点击头像区域 THEN 小程序 SHALL 弹出资料完善弹窗（使用 chooseAvatar 和 nickname 输入）
4. WHEN 用户点击"我发布的" THEN 小程序 SHALL 显示用户创建的活动列表
5. WHEN 用户点击"我参与的" THEN 小程序 SHALL 显示用户参与的活动列表
6. WHEN 用户未登录 THEN 小程序 SHALL 显示登录入口并隐藏需要登录的功能

### Requirement 13: 延迟验证（手机号绑定）

**User Story:** As a 用户, I want 在需要时才绑定手机号, so that 我可以先体验核心功能再决定是否提供手机号。

#### Acceptance Criteria

1. WHILE 用户未登录 THEN 小程序 SHALL 允许浏览地图、查看活动详情、尝试 AI 解析
2. WHEN 未绑定手机号的用户尝试发布活动 THEN 小程序 SHALL 弹出手机号绑定弹窗
3. WHEN 未绑定手机号的用户尝试报名活动 THEN 小程序 SHALL 弹出手机号绑定弹窗
4. WHEN 用户点击绑定手机号按钮 THEN 小程序 SHALL 使用 <button open-type="getPhoneNumber"> 获取手机号
5. WHEN 手机号绑定成功 THEN 小程序 SHALL 继续执行之前被中断的操作（发布/报名）

### Requirement 14: 用户资料完善

**User Story:** As a 用户, I want 设置我的头像和昵称, so that 其他用户可以识别我。

#### Acceptance Criteria

1. WHEN 用户首次发布或报名活动 THEN 小程序 SHALL 引导用户完善资料（头像、昵称）
2. WHEN 用户点击选择头像 THEN 小程序 SHALL 使用 <button open-type="chooseAvatar"> 获取头像
3. WHEN 用户输入昵称 THEN 小程序 SHALL 使用 <input type="nickname"> 获取昵称
4. IF 用户跳过资料完善 THEN 小程序 SHALL 使用默认值（系统头像 + "匿名搭子"）
5. WHEN 用户资料更新成功 THEN 小程序 SHALL 同步更新所有显示该用户信息的页面
