# Requirements Document

## Introduction

本文档定义聚场(JuChang)小程序的开发需求，基于 Lean MVP PRD。聚场是一个基于LBS的P2P社交平台，核心理念是"Map Copilot (地图副驾)"——用 AI 接住用户的自然语言，把"群聊的流"变成"地图的桩"。

小程序采用 **3 Tab + AI 输入栏** 设计：
- Tab 1: 首页 (Home) - 地图 + AI 输入栏综合页
- Tab 2: 消息 (Connect) - 社交连接  
- Tab 3: 我 (Me) - 个人中心
- AI 输入栏: 底部常驻悬浮栏 - 全能 CUI 入口

## Glossary

- **Pin**: 地图上的标记点，代表活动或需求锚点
- **AI 输入栏**: 底部 Tabbar 上方悬浮的 AI 入口，整合搜索与创建功能
- **CUI 副驾面板**: AI 交互面板，展示思考态、搜索态、结果态的流式反馈
- **Boost (强力召唤)**: 付费增值服务（¥3），3km内推送 + 地图Pin闪烁
- **Pin+ (黄金置顶)**: 付费增值服务（¥5），地图Pin变大变金色，持续24小时
- **靠谱度**: 用户履约率，简化为徽章展示（🏅超靠谱/✓靠谱/🆕新人）
- **履约确认**: 活动结束后发起人确认参与者到场情况的流程
- **申诉**: 被标记"未到场"的用户可一键申诉的机制（MVP阶段视为争议，双方均不扣分）
- **幽灵锚点 (Ghost Anchor)**: 运营投放的需求引导Pin（绿色虚线），用于冷启动
- **位置备注 (Location Hint)**: 重庆地形适配的必填字段，如"4楼平台入口"、"地下通道进"
- **安全中心 (Safety Center)**: 提供安全须知、举报入口、紧急联系方式的功能页面
- **设置页面 (Settings)**: 账户管理、隐私设置、通知设置等用户偏好配置页面

## Requirements

### Requirement 1: 导航架构

**User Story:** As a 用户, I want 使用简洁的3 Tab + AI输入栏导航结构, so that 我可以快速访问核心功能和AI助手。

#### Acceptance Criteria

1. WHEN 用户打开小程序 THEN 小程序 SHALL 显示底部导航栏包含3个Tab（首页、消息、我的）
2. WHEN 用户打开小程序 THEN 小程序 SHALL 在Tabbar上方显示悬浮的AI输入栏
3. WHEN 用户切换Tab THEN 小程序 SHALL 平滑切换到对应页面并更新Tab选中状态
4. WHILE 有未读消息 THEN 消息Tab SHALL 显示未读消息数量角标

### Requirement 2: AI 输入栏

**User Story:** As a 用户, I want 通过AI输入栏用自然语言搜索或创建活动, so that 我可以像在群里说话一样轻松组局。

#### Acceptance Criteria

1. WHEN 用户在首页 THEN 小程序 SHALL 在Tabbar上方显示AI输入栏（黑色长条，左侧AI图标，中间提示文案，右侧语音按钮）
2. WHEN 用户点击AI输入栏 THEN 小程序 SHALL 展开CUI副驾面板并聚焦输入框
3. WHEN 用户输入文本（如"明晚观音桥打麻将，3缺1"） THEN 小程序 SHALL 调用AI解析API并显示流式响应
4. WHEN 用户粘贴群消息文本 THEN 小程序 SHALL 自动识别并解析群接龙格式
5. WHEN 用户点击语音按钮 THEN 小程序 SHALL 启动语音识别并将结果填入输入框
6. WHILE 用户停止输入500ms THEN 小程序 SHALL 触发AI解析请求（防抖机制）

### Requirement 3: CUI 副驾面板

**User Story:** As a 用户, I want 看到AI的思考过程和搜索结果, so that 我感受到有人在回应我而不是冷冰冰的等待。

#### Acceptance Criteria

1. WHEN AI开始处理请求 THEN 副驾面板 SHALL 在0.5s内显示思考态（"收到，正在定位观音桥..."）
2. WHEN AI定位到地点 THEN 小程序 SHALL 同步将地图飞向目标位置
3. WHEN AI开始搜索 THEN 副驾面板 SHALL 显示搜索态（"正在检索附近的麻将局..."，文字逐字跳动）
4. WHEN AI搜索完成且有匹配活动 THEN 副驾面板 SHALL 显示双选卡片（A.发现X个局 B.创建草稿卡片）
5. WHEN AI搜索完成且无匹配活动 THEN 副驾面板 SHALL 显示创建草稿卡片并提示"附近暂无，帮你组好了"
6. WHEN 用户点击"发现X个局"卡片 THEN 小程序 SHALL 在地图上高亮显示匹配的活动Pin
7. WHEN 用户点击创建草稿卡片的"立即发布"按钮 THEN 小程序 SHALL 跳转到活动创建页并预填AI解析的信息

### Requirement 4: 首页

**User Story:** As a 用户, I want 在首页查看地图和附近的活动, so that 我可以直观地发现和参与感兴趣的活动。

#### Acceptance Criteria

1. WHEN 用户进入首页 THEN 小程序 SHALL 请求位置权限并以用户当前位置为中心渲染全屏地图
2. WHEN 地图加载完成 THEN 小程序 SHALL 从API获取附近活动数据并渲染活动Pin（橙色）
3. WHEN 活动启用Pin+服务 THEN 该活动Pin SHALL 显示为1.5倍大小、金色、带光晕动效
4. WHEN 活动启用Boost服务 THEN 该活动Pin SHALL 显示闪烁动效和"🔥急招"标签
5. WHEN 用户点击活动Pin THEN 小程序 SHALL 显示活动简要信息卡片
6. WHEN 用户点击活动卡片 THEN 小程序 SHALL 跳转到活动详情页
7. WHEN 首页存在幽灵锚点 THEN 小程序 SHALL 渲染绿色虚线Pin并显示引导文案

### Requirement 5: 幽灵锚点 (Ghost Anchors)

**User Story:** As a 用户, I want 看到运营推荐的活动需求点, so that 我可以在冷启动期也能发现有趣的组局机会。

#### Acceptance Criteria

1. WHEN 首页加载完成 THEN 小程序 SHALL 从API获取幽灵锚点数据并渲染绿色虚线Pin
2. WHEN 用户点击幽灵锚点 THEN 小程序 SHALL 直接唤起AI输入栏并预填锚点建议的类型和位置
3. WHEN 幽灵锚点被渲染 THEN 小程序 SHALL 显示引导文案（如"这里缺一个火锅局🍲"）
4. WHILE 幽灵锚点显示 THEN 小程序 SHALL 确保其视觉样式与真实活动Pin明显区分（严禁伪装）

### Requirement 6: 浮动按钮

**User Story:** As a 用户, I want 在首页快速访问常用功能, so that 我可以便捷地操作地图和访问安全功能。

#### Acceptance Criteria

1. WHEN 用户在首页 THEN 小程序 SHALL 在地图右侧显示定位按钮
2. WHEN 用户点击定位按钮 THEN 小程序 SHALL 将地图中心移动到用户当前位置
3. WHEN 用户在首页 THEN 小程序 SHALL 在地图左上角显示安全中心按钮
4. WHEN 用户点击安全中心按钮 THEN 小程序 SHALL 跳转到安全中心页面

### Requirement 7: 活动详情页

**User Story:** As a 用户, I want 查看活动的完整信息, so that 我可以决定是否参与该活动。

#### Acceptance Criteria

1. WHEN 用户进入活动详情页 THEN 小程序 SHALL 显示活动标题、描述、图片、时间、地点、位置备注、人数、费用类型等信息
2. WHEN 活动设置为私密局 THEN 小程序 SHALL 显示模糊地址（如"某某小区附近"）直到用户报名通过
3. WHEN 用户点击发起人头像 THEN 小程序 SHALL 显示发起人的靠谱度徽章、组织场次、参与场次等信息
4. WHEN 用户点击报名按钮 THEN 小程序 SHALL 校验用户靠谱度是否满足活动门槛
5. IF 用户靠谱度不满足门槛 THEN 小程序 SHALL 显示"靠谱度不足"提示并阻止报名
6. WHEN 活动有位置备注 THEN 小程序 SHALL 显示位置备注信息（如"4楼平台入口"）

### Requirement 8: 活动创建

**User Story:** As a 用户, I want 创建活动并发布, so that 我可以组织线下聚会。

#### Acceptance Criteria

1. WHEN 用户进入活动创建页 THEN 小程序 SHALL 显示标题、描述、时间、地点、人数、费用类型、隐私设置等字段
2. WHEN 用户选择地点 THEN 小程序 SHALL 强制要求填写位置备注（选项：地面入口/地下通道进/XX楼平台/其他自定义）
3. WHEN 用户勾选"模糊地理位置" THEN 小程序 SHALL 在活动发布后对未通过审批的用户隐藏精确位置
4. WHEN 用户点击发布按钮 THEN 小程序 SHALL 校验必填字段（含位置备注）并调用创建活动API
5. WHEN 活动创建成功 THEN 小程序 SHALL 显示分享引导并可分享到微信群
6. WHEN 用户选择推广服务 THEN 小程序 SHALL 显示Boost（¥3）和Pin+（¥5）选项
7. WHEN 从AI输入栏跳转 THEN 小程序 SHALL 预填AI解析的标题、时间、地点等信息

### Requirement 9: 消息中心

**User Story:** As a 用户, I want 在一个页面查看所有通知和群聊, so that 我可以及时处理活动相关的消息。

#### Acceptance Criteria

1. WHEN 用户进入消息页 THEN 小程序 SHALL 显示系统通知区域和群聊列表区域
2. WHEN 有新的申请通知 THEN 系统通知区域 SHALL 显示"XXX申请加入你的XXX活动"
3. WHEN 用户被标记为"未到场" THEN 系统通知 SHALL 显示通知并包含"我到场了"申诉按钮
4. WHEN 用户点击群聊项 THEN 小程序 SHALL 跳转到对应活动的群聊页面
5. WHILE 有未读消息 THEN 消息Tab SHALL 显示未读消息数量角标

### Requirement 10: 群聊功能

**User Story:** As a 活动参与者, I want 在活动群聊中与其他参与者沟通, so that 我可以协调活动细节。

#### Acceptance Criteria

1. WHEN 用户进入群聊页 THEN 小程序 SHALL 显示活动信息头部和消息列表
2. WHEN 用户发送文本消息 THEN 小程序 SHALL 调用发送消息API并实时显示在消息列表
3. WHEN 其他用户发送消息 THEN 小程序 SHALL 通过WebSocket实时接收并显示新消息
4. WHEN 活动结束 THEN 群聊 SHALL 保留但标记为"已归档"状态

### Requirement 11: 履约确认

**User Story:** As a 活动发起人, I want 在活动结束后确认参与者的到场情况, so that 系统可以更新参与者的靠谱度。

#### Acceptance Criteria

1. WHEN 活动结束时间到达 THEN 小程序 SHALL 向发起人发送履约确认通知
2. WHEN 发起人进入履约确认页 THEN 小程序 SHALL 显示所有参与者列表并默认勾选"已到场"
3. WHEN 发起人标记某用户"未到场" THEN 小程序 SHALL 显示警告提示
4. WHEN 发起人点击确认完成 THEN 小程序 SHALL 调用履约确认API更新参与者状态
5. IF 发起人24小时内未操作 THEN 系统 SHALL 自动标记全员履约成功

### Requirement 12: 申诉机制

**User Story:** As a 被标记未到场的用户, I want 一键申诉, so that 我可以避免被错误扣分。

#### Acceptance Criteria

1. WHEN 用户被标记为"未到场" THEN 小程序 SHALL 发送推送通知包含"我到场了"按钮
2. WHEN 用户点击"我到场了"按钮 THEN 小程序 SHALL 调用申诉API并将状态改为"争议中"
3. WHILE 状态为"争议中" THEN 系统 SHALL 视为争议，双方均不扣分（MVP阶段）
4. IF 用户24小时内未申诉 THEN 系统 SHALL 自动生效扣分

### Requirement 13: 个人中心

**User Story:** As a 用户, I want 查看和管理我的个人信息, so that 我可以维护我的账户和了解我的活动数据。

#### Acceptance Criteria

1. WHEN 用户进入个人中心 THEN 小程序 SHALL 显示用户头像、昵称、靠谱度徽章（🏅超靠谱/✓靠谱/🆕新人）
2. WHEN 用户查看统计数据 THEN 小程序 SHALL 显示组织场次、参与场次、收到差评次数
3. WHEN 用户点击"我发布的" THEN 小程序 SHALL 显示用户创建的活动列表
4. WHEN 用户点击"我参与的" THEN 小程序 SHALL 显示用户参与的活动列表
5. WHEN 用户未登录 THEN 小程序 SHALL 显示登录入口并隐藏需要登录的功能

### Requirement 14: 靠谱度展示

**User Story:** As a 用户, I want 看到简洁的靠谱度徽章, so that 我可以快速判断其他用户的可信度。

#### Acceptance Criteria

1. WHEN 用户履约率大于90% THEN 小程序 SHALL 显示"🏅 超靠谱"徽章
2. WHEN 用户履约率大于80%且小于等于90% THEN 小程序 SHALL 显示"✓ 靠谱"徽章
3. WHEN 用户为新人或履约率低于80% THEN 小程序 SHALL 显示"🆕 新人"徽章
4. WHEN 显示靠谱度 THEN 小程序 SHALL 不显示具体百分比数值（简化展示）

### Requirement 15: 差评反馈

**User Story:** As a 活动参与者, I want 在活动结束后反馈问题, so that 系统可以记录不良行为并帮助其他用户做决策。

#### Acceptance Criteria

1. WHEN 活动结束 THEN 小程序 SHALL 向参与者弹出体验反馈弹窗
2. WHEN 用户点击"有问题" THEN 小程序 SHALL 显示问题类型选择（迟到、放鸽子、态度不好、与描述不符、其他）
3. WHEN 用户选择问题类型并指定对象 THEN 小程序 SHALL 调用反馈API记录差评
4. WHEN 用户点击"挺好的"或关闭弹窗 THEN 小程序 SHALL 不记录任何反馈

### Requirement 16: 增值服务购买

**User Story:** As a 用户, I want 购买增值服务, so that 我可以获得更多曝光。

#### Acceptance Criteria

1. WHEN 用户在活动发布页选择Boost服务 THEN 小程序 SHALL 显示服务说明（3km内推送+Pin闪烁）和价格（¥3）
2. WHEN 用户在活动发布页选择Pin+服务 THEN 小程序 SHALL 显示服务说明（Pin变大变金24h）和价格（¥5）
3. WHEN 用户确认购买 THEN 小程序 SHALL 调用微信支付API完成支付
4. WHEN 支付成功 THEN 小程序 SHALL 立即下发对应权益并更新活动状态

### Requirement 17: 分享功能

**User Story:** As a 活动发起人, I want 分享活动到微信, so that 我可以在微信群中推广我的活动。

#### Acceptance Criteria

1. WHEN 活动创建成功 THEN 小程序 SHALL 显示分享引导
2. WHEN 用户点击分享按钮 THEN 小程序 SHALL 调用微信原生分享接口生成分享卡片
3. WHEN 其他用户点击分享卡片 THEN 小程序 SHALL 直接打开对应活动详情页
4. WHEN 分享卡片生成 THEN 小程序 SHALL 显示活动标题、时间、缺人数等关键信息

### Requirement 18: 懒注册

**User Story:** As a 游客, I want 在不登录的情况下浏览活动, so that 我可以先了解平台再决定是否注册。

#### Acceptance Criteria

1. WHILE 用户未登录 THEN 小程序 SHALL 允许浏览地图和查看活动详情
2. WHEN 未登录用户尝试创建活动 THEN 小程序 SHALL 跳转到登录页面
3. WHEN 未登录用户尝试报名活动 THEN 小程序 SHALL 跳转到登录页面
4. WHEN 未登录用户尝试进入群聊 THEN 小程序 SHALL 跳转到登录页面

### Requirement 19: AI 额度管理

**User Story:** As a 用户, I want 了解我的AI使用额度, so that 我可以合理使用AI功能。

#### Acceptance Criteria

1. WHILE 用户使用AI输入栏 THEN 小程序 SHALL 消耗AI搜索/解析额度（50次/天）
2. WHEN AI额度用完 THEN 小程序 SHALL 显示"今日AI额度已用完，明天再来"提示
3. WHEN 用户发布活动 THEN 小程序 SHALL 消耗发布额度（3次/天）
4. WHEN 发布额度用完 THEN 小程序 SHALL 显示"今日发布额度已用完"提示

### Requirement 20: 设置页面

**User Story:** As a 用户, I want 管理我的账户设置和应用偏好, so that 我可以自定义使用体验并管理隐私。

#### Acceptance Criteria

1. WHEN 用户从个人中心点击设置入口 THEN 小程序 SHALL 跳转到设置页面
2. WHEN 用户进入设置页面 THEN 小程序 SHALL 显示账户管理、隐私设置、通知设置、关于我们等选项
3. WHEN 用户点击"通知设置" THEN 小程序 SHALL 显示消息推送开关（活动提醒、系统通知、营销消息）
4. WHEN 用户点击"隐私设置" THEN 小程序 SHALL 显示位置权限管理、个人信息可见性设置
5. WHEN 用户点击"清除缓存" THEN 小程序 SHALL 清除本地缓存数据并显示成功提示
6. WHEN 用户点击"退出登录" THEN 小程序 SHALL 清除登录态并跳转到首页
7. WHEN 用户点击"关于我们" THEN 小程序 SHALL 显示版本号、用户协议、隐私政策链接

### Requirement 21: 安全中心

**User Story:** As a 用户, I want 访问安全相关功能和信息, so that 我可以保护自己的账户安全并了解平台安全机制。

#### Acceptance Criteria

1. WHEN 用户从首页点击安全中心按钮 THEN 小程序 SHALL 跳转到安全中心页面
2. WHEN 用户进入安全中心 THEN 小程序 SHALL 显示安全须知、举报入口、紧急联系方式等信息
3. WHEN 用户点击"安全须知" THEN 小程序 SHALL 显示线下见面安全提示（公共场所见面、告知朋友行程、保持通讯畅通等）
4. WHEN 用户点击"举报" THEN 小程序 SHALL 显示举报类型选择（虚假信息、骚扰行为、违法内容、其他）
5. WHEN 用户提交举报 THEN 小程序 SHALL 调用举报API并显示"已收到举报，我们会尽快处理"提示
6. WHEN 用户点击"紧急联系" THEN 小程序 SHALL 显示平台客服电话和一键拨打按钮
7. WHEN 用户点击"黑名单管理" THEN 小程序 SHALL 显示已拉黑用户列表并支持解除拉黑操作
