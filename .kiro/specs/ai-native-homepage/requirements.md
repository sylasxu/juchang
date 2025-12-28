# Requirements Document

## Introduction

本文档定义聚场(JuChang)小程序 v3.2 的 Chat-First 架构需求，基于"蚂蚁阿福"式的对话优先设计理念。

**核心定位**：微信群组局神器 —— 把群聊里的"流"，变成对话中的"桩"

---

## 我们在解决什么？(The Problem We Solve)

### 🔴 旧世界的痛点 (The Pain)

**场景**：用户在 500 人的"重庆剧本杀组局群"或者抖音热门视频下评论。

| 痛点 | 描述 | 用户心理 |
|------|------|----------|
| **信息流失** | 喊一句"今晚打本，差1人"，5分钟后被表情包淹没 | "是不是没人理我？" |
| **信任缺失** | 抖音评论区喊人，全是陌生人，谁知道你是不是骗子？去哪？几点？ | "这人靠谱吗？" |
| **沟通成本** | 有人问"在哪？"，有人问"几点？"，有人问"还有位吗？"，发起人要回 10 遍 | "我是复读机吗？" |
| **毫无尊严** | 为了凑人，发起人像复读机一样到处粘贴，显得很卑微 | "我好像在求人..." |

### 🟢 聚场的解法 (The Solution)

**场景**：用户复制那句"今晚打本..."，丢给聚场 AI。

| 解法 | 描述 | 用户感受 |
|------|------|----------|
| **变"流"为"桩"** | AI 生成一张 Halo Card，丢回群里占屏幕面积大，信息结构化（时间/地点/人数），视觉权重碾压纯文字 | "我的消息终于不会被淹没了" |
| **建立信任** | 卡片上精美的静态地图、倒计时、已报名头像，给人"这是一个正经局"的心理暗示。**精致感本身就是信任背书** | "看起来很专业，应该靠谱" |
| **自动化管理** | 别人点卡片进来，看到"已满"就不问了；点"报名"，系统自动统计。发起人不用再做复读机 | "终于不用一个个回复了" |
| **有尊严地组局** | 一张专业的卡片，让发起人从"求人"变成"邀请" | "我是在发邀请，不是在求人" |

### 💡 核心洞察

> **我们不试图把用户从微信拉走，而是做一个"外挂"**
> - **输入端**：接住微信群里乱七八糟的文本，用 AI 整理成结构化信息
> - **输出端**：生成微信原生卡片，利用视觉优势在群消息流中"抢占地盘"

---

## v3.2 架构转向：Chat-First + Generative UI

| 版本 | 架构 | 问题 |
|------|------|------|
| v1.0 | 地图 + 表单 | 门槛高，用户要填表单，冷启动地图空白 |
| v2.0 | Card Feed + Smart Stack | 信息密度低，不够直接 |
| **v3.2** | **Chat-First + Generative UI** | ✅ 零门槛，像聊天一样组局 |

**核心交互哲学**：
1. **首页即对话**：App 打开不再是列表或地图，而是一个无限滚动的 Chat View
2. **功能即气泡**：所有功能（查看待办、创建活动、分享卡片、探索附近）都封装在对话流的 Widgets 中
3. **去 Tabbar 化**：底部取消导航栏，改为悬浮的 AI_Dock (输入坞)
4. **Generative UI**：AI 根据意图动态生成最合适的 Widget 类型（创建 vs 探索）

**技术约束（AI 友好型实现）**：
- ❌ 不使用 `backdrop-filter: blur()` —— 低端安卓机性能杀手
- ❌ 不使用跨页面 Shared Element Transition —— 小程序难以实现
- ❌ 不自动读取剪贴板 —— 微信会强制弹窗，体验差
- ❌ 不在 scroll-view 中嵌入可交互 map —— 手势冲突
- ✅ 使用高透明度白色背景 + box-shadow 模拟层级感
- ✅ 使用静态 Mesh Gradient 图片做背景（性能最优）
- ✅ 用户主动点击粘贴按钮触发剪贴板读取
- ✅ Widget_Explore 使用静态地图图片，点击后展开全屏地图

---

## 语气规范 (Tone of Voice) 🗣️

### 核心原则

> **不要让 UI 的高级感变成"距离感"**
> 虽然我们用了 Halo Card、Generative UI，但文案和交互必须接地气。

### AI 回复示例

| ❌ 反例（太装逼） | ✅ 正例（接地气） |
|------------------|------------------|
| "已为您构建全息活动契约，请确认地理围栏坐标。" | "帮你把局组好了！就在观音桥，离地铁口 200 米，把这张卡片发群里吧。" |
| "正在解析您的意图向量..." | "收到，正在帮你整理..." |
| "活动实体已成功持久化至数据库。" | "搞定！活动已发布，快分享给朋友吧。" |
| "检测到地理位置偏移，建议重新校准。" | "这个地址好像有点远，要不要换一个？" |

### 按钮文案

| ❌ 反例 | ✅ 正例 |
|--------|--------|
| 确认提交 | 确认发布 |
| 执行分享 | 分享到群 |
| 调整地理坐标 | 调整位置 |
| 查看详细信息 | 查看详情 |
| 展开地图视图 | 展开地图 |

### 错误提示

| ❌ 反例 | ✅ 正例 |
|--------|--------|
| "解析失败，请检查输入格式。" | "抱歉，我没理解你的意思，试试换个说法？" |
| "网络请求超时，错误码 504。" | "网络有点慢，再试一次？" |
| "今日配额已耗尽。" | "今天的 AI 额度用完了，明天再来吧～" |
| "用户认证失败。" | "需要先绑定手机号才能继续哦" |

### 空状态文案

| 场景 | 文案 |
|------|------|
| 无待参加活动 | "还没有局？说句话，我帮你组一个" |
| 探索无结果 | "附近暂时没有活动，要不你来发起第一个？" |
| 消息中心为空 | "还没有群聊消息，发布活动后就有了" |

**视觉识别系统：Crypto-Clean (加密极简)**：

> **设计哲学**：2025 年顶级 Web3 App（Rainbow, Family, Uniswap, Phantom, Zerion）的设计语言 —— 比 iOS 原生更敢于留白、更追求材质通透感、更强调微交互的物理反馈。

**配色系统**：
- 主色 (Brand): 矢车菊蓝 #5B75FB (Cornflower Blue) —— 温暖、可信赖的蓝紫色
- 辅助色 (Accent): 淡蓝 #93C5FD / 淡紫 #C4B5FD / 薄荷青 #6EE7B7 —— Widget 图标底色（同色系）
- 背景: 极简白 (几乎纯白 #FAFBFC 或极淡灰 #F8FAFC)
- 文字: Gray-800 #1F2937 (主) / Gray-500 #6B7280 (次)
- 阴影: 彩色弥散阴影 rgba(91, 117, 251, 0.08) —— 非黑色阴影

**容器形态 (Squircle)**：
- AI_Dock: 悬浮胶囊 (Floating Capsule)，距离底部和左右都有间距，像 iOS 灵动岛
- 卡片圆角: 40rpx+ (超大圆角，亲和力 + 现代感)
- 按钮圆角: 胶囊形 (Capsule) 或 24rpx

**质感 (Surface)**：
- Halo Card: 渐变细边框 (钛白/全息色)，极淡透明
- 边框: 1px rgba(0,0,0,0.04) 极细描边，模拟物理边缘
- 去脏阴影: 使用彩色弥散阴影，非黑色阴影

**字体排版 (Editorial)**：
- 数字: 等宽字体 (Monospace)，特粗字重，数据仪表盘精密感
- 标题: 字重 600/700，行高收紧
- 图标: Lucide 细线条 (Stroke width 1.5px-2px)

**动效 (Fluid)**：
- Chat_Stream: 新消息"上浮 + 淡入"组合动画
- 按钮点击: Scale Down 回弹 (0.95 → 1.0) + wx.vibrateShort 触感反馈
- 页面转场: 流体物理曲线，非线性 ease

## Glossary

- **Chat_Stream**: 对话流，首页核心区域，包含用户消息和 AI 消息
- **AI_Dock**: 超级输入坞，底部悬浮的 AI 交互入口
- **Widget_Dashboard**: 进场欢迎卡片，展示今日待参加活动 + 问候语
- **Widget_Draft**: 意图解析卡片，包含地图选点入口 + 确认按钮
- **Widget_Share**: 创建成功卡片，展示原生分享卡片预览
- **Custom_Navbar**: 自定义导航栏，包含 Menu/品牌词/More 三个区域
- **Profile_Page**: 个人中心页，Inset Grouped List 风格
- **Message_Center**: 消息中心，展示所有活动群聊列表
- **Dropmenu**: 下拉菜单，从右上角 More 图标触发
- **Lite_Chat**: 活动临时群聊，仅支持文字消息
- **Location_Hint**: 重庆地形适配的必填字段
- **Widget_Explore**: 探索卡片，用于展示搜索结果和附近活动推荐
- **Explore_Map_Page**: 沉浸式地图页，全屏可交互地图，支持拖拽、缩放、筛选
- **Generative_UI**: 生成式界面，AI 根据意图动态生成最合适的 Widget 类型
- **Halo_Card**: 光晕卡片，Widget_Explore 的视觉样式，带静态地图预览
- **Intent_Classification**: 意图分类，AI 区分"明确创建"和"模糊探索"两种用户意图
- **Atmospheric_Background**: 极简白背景，主背景 #FAFBFC，顶部可选极淡蓝光晕 #F0F5FF
- **Halo_Card**: 光晕卡片，纯白背景 + 超大圆角 40rpx + 彩色弥散阴影 + 渐变细边框
- **Cornflower_Blue**: 矢车菊蓝 #5B75FB，主色调，用于发送按钮、用户气泡、主要行动点
- **Colorful_Icons**: 同色系图标底色，淡蓝/淡紫/薄荷青，用于 Widget 功能图标
- **Floating_Capsule**: 悬浮胶囊，AI_Dock 的容器形态，距离屏幕边缘有间距，像 iOS 灵动岛
- **Squircle**: 超圆角，40rpx+ 的圆角值，比普通圆角更柔和、更现代
- **Colored_Diffusion_Shadow**: 彩色弥散阴影，rgba(91, 117, 251, 0.08)，非黑色阴影
- **Scale_Down_Feedback**: 按压回弹效果，按下缩小到 0.95，松开弹回 1.0，配合触感反馈

## Requirements

### Requirement 0: 数据库 Schema 优化 (Database First - 行业标准)

**User Story:** As a 开发者, I want 数据库表名和字段名符合行业标准且语义化, so that 代码可读性高、团队协作顺畅、减少 Bug。

#### Acceptance Criteria

**表命名优化 (行业标准)**：
1. THE 首页对话表 SHALL 命名为 'conversations'（而非 'home_messages'），符合行业标准的对话/会话表命名
2. THE 活动群聊表 SHALL 命名为 'activity_messages'（而非 'group_messages'），明确表达"活动内的消息"

**枚举命名优化 (语义化)**：
3. THE 对话角色枚举 SHALL 命名为 'conversation_role'（而非 'home_message_role'）
4. THE 对话消息类型枚举 SHALL 命名为 'conversation_message_type'（而非 'home_message_type'）
5. THE 活动消息类型枚举 SHALL 命名为 'activity_message_type'（而非 'message_type'）

**默认值优化 (业务逻辑)**：
6. THE 活动表 (activities) 的 status 字段 SHALL 默认值为 'draft'（而非 'active'），符合 AI 解析 → 用户确认的工作流

**字段命名优化 (可选，MVP 后考虑)**：
7. THE activities 表的 startAt 字段 MAY 重命名为 starts_at，符合 Rails/行业惯例
8. THE 冗余统计字段 (currentParticipants, activitiesCreatedCount, participationCount) MAY 在未来版本移除，改为动态计算

**迁移与文档**：
9. WHEN Schema 变更完成后, THE 开发者 SHALL 运行 'bun run db:generate' 生成迁移文件
10. WHEN 执行 'bun run db:migrate', THE 数据库 SHALL 应用所有待执行的迁移
11. THE TAD 文档和 steering 规则 SHALL 同步更新表名、枚举名和默认值说明
12. THE API 模块 SHALL 更新表引用（ai 模块引用 conversations，chat 模块引用 activity_messages）

### Requirement 1: 首页整体架构 (Chat-First Layout)

**User Story:** As a 用户, I want 打开 App 就看到一个对话界面, so that 我可以像和朋友聊天一样轻松组局。

#### Acceptance Criteria

1. WHEN 用户打开小程序首页 THEN 小程序 SHALL 显示三层结构：顶部 Custom_Navbar、中部 Chat_Stream、底部 AI_Dock
2. WHEN 用户打开小程序首页 THEN 小程序 SHALL 隐藏传统 Tabbar，仅显示悬浮的 AI_Dock
3. WHEN 用户打开小程序首页 THEN 小程序 SHALL 显示 Atmospheric_Background（空气感渐变，顶部淡蓝 #E6EFFF → 浅灰白 #F5F7FA）
4. WHEN Chat_Stream 渲染 THEN 小程序 SHALL 支持无限滚动浏览历史对话

### Requirement 2: 自定义导航栏 (Custom_Navbar)

**User Story:** As a 用户, I want 通过顶部导航栏访问个人中心和更多功能, so that 我可以管理我的账户和查看消息。

#### Acceptance Criteria

1. WHEN Custom_Navbar 渲染 THEN 小程序 SHALL 在左侧显示 Menu 图标（三道杠）
2. WHEN Custom_Navbar 渲染 THEN 小程序 SHALL 在中间显示品牌词"聚场"
3. WHEN Custom_Navbar 渲染 THEN 小程序 SHALL 在右侧显示 More 图标（三个点）
4. WHEN 用户点击 Menu 图标 THEN 小程序 SHALL 跳转到 Profile_Page（个人中心）
5. WHEN 用户点击 More 图标 THEN 小程序 SHALL 显示 Dropmenu 下拉菜单
6. WHEN Dropmenu 显示 THEN 小程序 SHALL 包含两个入口：[消息中心] 和 [新对话]
7. WHEN 用户点击 [消息中心] THEN 小程序 SHALL 跳转到 Message_Center 页面
8. WHEN 用户点击 [新对话] THEN 小程序 SHALL 清空 Chat_Stream 并重置上下文

### Requirement 3: 对话流 (Chat_Stream)

**User Story:** As a 用户, I want 在对话流中看到我和 AI 的交互历史, so that 我可以回顾之前的操作和活动。

#### Acceptance Criteria

1. WHEN Chat_Stream 渲染 THEN 小程序 SHALL 显示用户消息（右侧对齐）和 AI 消息（左侧对齐）
2. WHEN 用户首次进入首页 THEN Chat_Stream SHALL 自动显示 Widget_Dashboard（进场欢迎卡片）
3. WHEN Widget_Dashboard 渲染 THEN 小程序 SHALL 显示动态问候语（根据时间变化）
4. WHEN Widget_Dashboard 渲染且用户有待参加活动 THEN 小程序 SHALL 显示活动列表（标题、时间、地点）
5. WHEN Widget_Dashboard 渲染且用户无活动 THEN 小程序 SHALL 显示引导文案和热门 Prompt 示例
6. WHEN 用户发送消息 THEN Chat_Stream SHALL 立即显示用户消息气泡并触发 AI 解析
7. WHEN AI 解析完成 THEN Chat_Stream SHALL 显示对应的 Widget（Draft/Share/Text）

### Requirement 4: 进场欢迎卡片 (Widget_Dashboard)

**User Story:** As a 用户, I want 打开 App 就看到今日待办和个性化问候, so that 我感受到产品的温度和智能化。

#### Acceptance Criteria

1. WHEN 时间为早上 (6:00-12:00) THEN Widget_Dashboard SHALL 显示"早上好，[昵称]"
2. WHEN 时间为下午 (12:00-18:00) THEN Widget_Dashboard SHALL 显示"下午好，[昵称]"
3. WHEN 时间为晚上 (18:00-6:00) THEN Widget_Dashboard SHALL 显示"晚上好，[昵称]"
4. WHEN 时间为周五晚上 THEN Widget_Dashboard SHALL 显示"Hi [昵称]，周五晚上了，不组个局吗？"
5. WHEN 时间为周末 THEN Widget_Dashboard SHALL 显示"周末愉快，[昵称]，今天想玩什么？"
6. WHEN 用户有待参加活动 THEN Widget_Dashboard SHALL 显示活动卡片列表（最多 3 个）
7. WHEN 活动卡片渲染 THEN 小程序 SHALL 显示活动标题、类型图标、开始时间、地点
8. WHEN 用户点击活动卡片 THEN 小程序 SHALL 跳转到活动详情页

### Requirement 5: 超级输入坞 (AI_Dock)

**User Story:** As a 用户, I want 通过底部输入坞用自然语言创建活动, so that 我可以像在群里说话一样轻松组局。

#### Acceptance Criteria

1. WHEN AI_Dock 渲染 THEN 小程序 SHALL 悬浮在底部，使用 Soft_Card 风格（纯白背景 + 柔和阴影）
2. WHEN AI_Dock 渲染 THEN 小程序 SHALL 显示输入框（placeholder: "粘贴文字，或直接告诉我..."）
3. WHEN AI_Dock 渲染 THEN 小程序 SHALL 显示快捷按钮：[📋 粘贴] [🎤 语音]
4. WHEN 用户点击输入框 THEN AI_Dock SHALL 展开键盘并聚焦输入
5. WHEN 用户点击 [📋 粘贴] 按钮 THEN 小程序 SHALL 调用 wx.getClipboardData 读取剪贴板并填入输入框
6. WHEN 用户点击 [🎤 语音] 按钮 THEN 小程序 SHALL 启动语音识别并将结果填入输入框
7. WHEN 用户发送文本 THEN 小程序 SHALL 调用 AI 解析 API 并在 Chat_Stream 显示流式响应
8. WHILE 用户停止输入 800ms THEN 小程序 SHALL 触发 AI 解析请求（防抖机制）

### Requirement 6: 意图解析卡片 (Widget_Draft)

**User Story:** As a 用户, I want 看到 AI 解析的活动草稿, so that 我可以确认并发布活动。

#### Acceptance Criteria

1. WHEN AI 解析出活动意图 THEN Chat_Stream SHALL 显示 Widget_Draft 卡片
2. WHEN Widget_Draft 渲染 THEN 小程序 SHALL 显示 AI 预填的标题、时间、地点、类型
3. WHEN Widget_Draft 渲染 THEN 小程序 SHALL 显示静态地图预览（以解析坐标为中心）
4. WHEN Widget_Draft 渲染 THEN 小程序 SHALL 显示 [📍 调整位置] 按钮
5. WHEN 用户点击 [📍 调整位置] THEN 小程序 SHALL 跳转到地图选点页面
6. WHEN Widget_Draft 渲染 THEN 小程序 SHALL 显示 [✅ 确认发布] 按钮
7. WHEN 用户点击 [✅ 确认发布] 且未绑定手机号 THEN 小程序 SHALL 弹出手机号绑定弹窗
8. WHEN 用户点击 [✅ 确认发布] 且已绑定手机号 THEN 小程序 SHALL 跳转到活动确认页
9. IF AI 解析失败 THEN Chat_Stream SHALL 显示文本消息引导用户重新描述或手动创建

### Requirement 7: 创建成功卡片 (Widget_Share)

**User Story:** As a 用户, I want 活动创建成功后看到分享卡片预览, so that 我可以一键分享到微信群。

#### Acceptance Criteria

1. WHEN 活动创建成功 THEN Chat_Stream SHALL 显示 Widget_Share 卡片
2. WHEN Widget_Share 渲染 THEN 小程序 SHALL 显示原生分享卡片预览（标题、地图、关键信息）
3. WHEN Widget_Share 渲染 THEN 小程序 SHALL 显示 [📤 分享到群] 按钮
4. WHEN 用户点击 [📤 分享到群] THEN 小程序 SHALL 调用 wx.showShareMenu 触发原生分享
5. WHEN Widget_Share 渲染 THEN 小程序 SHALL 显示 [👀 查看详情] 按钮
6. WHEN 用户点击 [👀 查看详情] THEN 小程序 SHALL 跳转到活动详情页

### Requirement 8: 个人中心 (Profile_Page)

**User Story:** As a 用户, I want 在个人中心管理我的账户和活动, so that 我可以查看历史记录和修改设置。

#### Acceptance Criteria

1. WHEN 用户进入 Profile_Page THEN 小程序 SHALL 使用 Inset Grouped List 风格（浅灰背景 + 白色圆角卡片组）
2. WHEN Profile_Page 渲染 THEN 小程序 SHALL 在顶部显示 Header（头像、昵称、Slogan）
3. WHEN 用户点击 Header 区域 THEN 小程序 SHALL 弹出资料编辑弹窗
4. WHEN Profile_Page 渲染 THEN 小程序 SHALL 显示 Group 1（核心业务）：[我发布的]、[我参与的]、[历史归档]
5. WHEN 用户点击 [我发布的] THEN 小程序 SHALL 跳转到活动列表页（参数 type=created）
6. WHEN 用户点击 [我参与的] THEN 小程序 SHALL 跳转到活动列表页（参数 type=joined）
7. WHEN 用户点击 [历史归档] THEN 小程序 SHALL 跳转到活动列表页（参数 type=archived）
8. WHEN Profile_Page 渲染 THEN 小程序 SHALL 显示 Group 2（信任与安全）：[手机绑定]、[隐私设置]
9. WHEN [手机绑定] 渲染 THEN 小程序 SHALL 显示状态（已认证/未认证）
10. WHEN Profile_Page 渲染 THEN 小程序 SHALL 显示 Group 3（系统）：[关于聚场]、[意见反馈]

### Requirement 9: 消息中心 (Message_Center)

**User Story:** As a 用户, I want 在消息中心查看所有活动群聊, so that 我可以及时处理活动相关的消息。

#### Acceptance Criteria

1. WHEN 用户进入 Message_Center THEN 小程序 SHALL 显示所有我参与的活动群聊列表
2. WHEN 群聊列表渲染 THEN 小程序 SHALL 显示活动标题、最后一条消息、未读数量
3. WHEN 用户点击群聊项 THEN 小程序 SHALL 跳转到对应活动的 Lite_Chat 页面
4. WHILE 有未读消息 THEN 群聊项 SHALL 显示未读消息数量角标
5. WHEN 群聊已归档 THEN 群聊项 SHALL 显示"已归档"标识

### Requirement 10: 活动详情页

**User Story:** As a 用户, I want 查看活动的完整信息, so that 我可以决定是否参与该活动。

#### Acceptance Criteria

1. WHEN 用户进入活动详情页 THEN 小程序 SHALL 显示活动标题、描述、时间、地点、Location_Hint、类型图标、人数、发起人信息
2. WHEN 活动详情页渲染 THEN 小程序 SHALL 在顶部显示静态地图（以活动坐标为中心）
3. WHEN 用户点击地图区域 THEN 小程序 SHALL 打开腾讯地图导航
4. WHEN 用户点击报名按钮且未绑定手机号 THEN 小程序 SHALL 弹出手机号绑定弹窗
5. WHEN 用户报名成功 THEN 小程序 SHALL 更新报名状态并显示"已报名"
6. WHEN 活动详情页使用自定义导航栏 THEN Custom_Navbar SHALL 处理单页进入时的返回逻辑（跳转首页）
7. WHEN 活动状态为 cancelled THEN 小程序 SHALL 显示"活动已取消"标识并禁用报名按钮

### Requirement 11: 活动群聊 (Lite_Chat)

**User Story:** As a 活动参与者, I want 在活动群聊中与其他参与者沟通, so that 我可以协调活动细节。

#### Acceptance Criteria

1. WHEN 活动创建成功 THEN Lite_Chat SHALL 立即开启
2. WHEN 用户进入 Lite_Chat THEN 小程序 SHALL 显示活动信息头部和消息列表
3. WHEN 用户发送文本消息 THEN 小程序 SHALL 调用发送消息 API 并实时显示在消息列表
4. WHEN 小程序需要获取新消息 THEN 小程序 SHALL 每 5-10 秒轮询新消息
5. WHEN 小程序进入后台 (onHide) THEN Lite_Chat SHALL 停止轮询
6. WHEN 小程序回到前台 (onShow) THEN Lite_Chat SHALL 立即发起一次请求并恢复轮询
7. WHEN 活动结束时间 + 24 小时后 THEN Lite_Chat SHALL 变为只读/归档状态
8. WHILE Lite_Chat 为归档状态 THEN 小程序 SHALL 禁用消息发送功能并显示"群聊已归档"提示

### Requirement 12: 延迟验证（手机号绑定）

**User Story:** As a 用户, I want 在需要时才绑定手机号, so that 我可以先体验核心功能再决定是否提供手机号。

#### Acceptance Criteria

1. WHILE 用户未登录 THEN 小程序 SHALL 允许浏览对话、查看活动详情、尝试 AI 解析
2. WHEN 未绑定手机号的用户尝试发布活动 THEN 小程序 SHALL 弹出手机号绑定弹窗
3. WHEN 未绑定手机号的用户尝试报名活动 THEN 小程序 SHALL 弹出手机号绑定弹窗
4. WHEN 用户点击绑定手机号按钮 THEN 小程序 SHALL 使用 `<button open-type="getPhoneNumber">` 获取手机号
5. WHEN 手机号绑定成功 THEN 小程序 SHALL 继续执行之前被中断的操作（发布/报名）

### Requirement 13: 原生分享卡片

**User Story:** As a 活动发起人, I want 分享活动到微信群, so that 我可以在微信群中推广我的活动。

#### Acceptance Criteria

1. WHEN 用户点击分享按钮 THEN 小程序 SHALL 调用 wx.showShareMenu 触发原生分享
2. WHEN Share_Card 生成 THEN 小程序 SHALL 使用 AI 生成的骚气标题（如"🔥 观音桥老火锅，3缺1，速来！"）
3. WHEN Share_Card 生成 THEN 小程序 SHALL 使用腾讯地图静态图 API 生成地图预览图（Zoom Level 16，红色 Marker，5:4 比例）
4. WHEN 其他用户点击 Share_Card THEN 小程序 SHALL 直接打开对应活动详情页

### Requirement 14: 首页回流兜底

**User Story:** As a 通过分享卡片进入的用户, I want 返回时能到达首页, so that 我可以继续探索或创建自己的活动。

#### Acceptance Criteria

1. WHEN 用户通过 Share_Card 单点进入详情页 THEN 页面栈长度 SHALL 为 1
2. WHEN 页面栈长度为 1 且用户点击返回 THEN Custom_Navbar SHALL 调用 wx.reLaunch 跳转到首页
3. WHEN 页面栈长度大于 1 且用户点击返回 THEN Custom_Navbar SHALL 调用 wx.navigateBack 正常返回
4. WHEN 用户回到首页 THEN Chat_Stream SHALL 显示 Widget_Dashboard 欢迎卡片


### Requirement 15: 视觉设计规范 (Crypto-Clean)

**User Story:** As a 用户, I want 看到极简、通透、流体、昂贵感的视觉风格, so that 我感受到产品的高级感和专业性。

#### Acceptance Criteria

**容器形态 (Squircle - 超圆角)**：
1. WHEN 渲染 AI_Dock THEN 小程序 SHALL 使用悬浮胶囊 (Floating Capsule) 样式：
   - 距离底部: 32rpx
   - 距离左右: 32rpx
   - 圆角: 48rpx (胶囊形)
   - 背景: 纯白 + 彩色弥散阴影
2. WHEN 渲染卡片 THEN 小程序 SHALL 使用 Halo_Card 风格：
   - 背景: #FFFFFF (纯白)
   - 圆角: 40rpx (超大圆角，亲和力 + 现代感)
   - 阴影: 0 8rpx 32rpx rgba(91, 117, 251, 0.08) (彩色弥散阴影，非黑色)
   - 边框: 1rpx solid rgba(0, 0, 0, 0.04) (极细描边，模拟物理边缘)
3. WHEN 渲染按钮 THEN 小程序 SHALL 使用胶囊形圆角 24rpx

**质感 (Surface - 表面微光)**：
4. WHEN 渲染背景 THEN 小程序 SHALL 使用极简白背景：
   - 主背景: #FAFBFC (几乎纯白)
   - 顶部可选淡蓝光晕: #F0F5FF (极淡，非强渐变)
5. WHEN 渲染 Halo_Card 边框 THEN 小程序 SHALL 使用渐变细边框：
   - 渐变: 钛白/全息色 (rgba(91, 117, 251, 0.15) → rgba(196, 181, 253, 0.15))
   - 宽度: 1-2rpx
   - 使用 background-origin/clip 技术实现

**用户消息气泡**：
6. WHEN 渲染用户消息气泡 THEN 小程序 SHALL 使用 Cornflower_Blue (#5B75FB → #708DFD) 渐变背景，文字白色
7. WHEN 渲染 AI 消息气泡 THEN 小程序 SHALL 使用透明背景，文字深灰色 (#1F2937)

**按钮与图标**：
8. WHEN 渲染主要按钮 THEN 小程序 SHALL 使用 Cornflower_Blue (#5B75FB) 背景 + 胶囊形圆角
9. WHEN 渲染 Widget 功能图标 THEN 小程序 SHALL 使用同色系淡色圆形底色（淡蓝/淡紫/薄荷青）+ 深色图标
10. WHEN 渲染图标 THEN 小程序 SHALL 使用 Lucide 细线条 (Stroke width 1.5-2px)

**字体排版 (Editorial - 杂志感)**：
11. WHEN 渲染数字（倒计时、人数、距离） THEN 小程序 SHALL 使用等宽字体 + 特粗字重 (600-700)
12. WHEN 渲染标题 THEN 小程序 SHALL 使用字重 600-700，行高收紧
13. WHEN 渲染文字 THEN 小程序 SHALL 使用 Gray-800 (#1F2937) 作为主文字色，Gray-500 (#6B7280) 作为次文字色

**地图与 Pin**：
14. WHEN 渲染地图 Pin THEN 小程序 SHALL 使用 Cornflower_Blue (#5B75FB) 颜色
15. WHEN 渲染地图切片 THEN 小程序 SHALL 添加超大圆角 (40rpx) 和彩色弥散阴影，融入卡片风格

**动效 (Fluid - 流体物理)**：
16. WHEN Chat_Stream 显示新消息 THEN 小程序 SHALL 使用"上浮 + 淡入"组合动画
17. WHEN 用户点击按钮 THEN 小程序 SHALL 实现 Scale Down 回弹效果 (按下 0.95 → 松开 1.0) + wx.vibrateShort 触感反馈
18. WHEN 页面转场 THEN 小程序 SHALL 使用流体物理曲线动画 (非线性 ease)

### Requirement 16: 活动管理

**User Story:** As a 活动发起人, I want 管理活动状态, so that 我可以确认成局、取消或删除活动。

#### Acceptance Criteria

1. WHEN 活动开始时间到达 THEN 小程序 SHALL 在发起人的活动详情页显示 [✅ 确认成局] 和 [❌ 取消活动] 按钮
2. WHEN 发起人点击"确认成局" THEN 小程序 SHALL 调用 API 将活动状态更新为 completed
3. WHEN 发起人点击"取消活动" THEN 小程序 SHALL 调用 API 将活动状态更新为 cancelled
4. WHEN 活动状态更新成功 THEN 小程序 SHALL 向所有参与者发送通知
5. WHEN 活动处于 active 状态且未开始 THEN 发起人 SHALL 可以点击"删除活动"按钮
6. WHEN 发起人点击"删除活动" THEN 小程序 SHALL 调用 API 删除活动记录

### Requirement 17: 探索场景 - Generative UI (Widget_Explore)

**User Story:** As a 用户, I want 用模糊的问题探索附近的活动（如"观音桥有什么好玩的"）, so that 我可以发现感兴趣的活动而不仅仅是创建活动。

#### Acceptance Criteria

1. WHEN 用户输入探索性问题（如"观音桥附近有什么好玩的活动"） THEN AI SHALL 识别为探索意图并返回 Widget_Explore 卡片
2. WHEN Widget_Explore 渲染 THEN 小程序 SHALL 显示 Halo Card 结构：
   - Header: "为你找到 [地点] 附近的 N 个热门活动"
   - Map Preview: 静态地图图片，带多个 Marker 标记搜索结果
   - List: 2-3 个精选活动（标题、距离、时间、类型图标）
   - Action: [🗺️ 展开地图] 按钮
3. WHEN Widget_Explore 在 Chat_Stream 中渲染 THEN 地图预览 SHALL 为静态图片（避免 scroll-view 与 map 组件的手势冲突）
4. WHEN 用户点击 Widget_Explore 卡片或 [🗺️ 展开地图] 按钮 THEN 小程序 SHALL 触发沉浸式地图展开（使用 page-container 或自定义动画）
5. WHEN 用户点击 Widget_Explore 中的活动项 THEN 小程序 SHALL 跳转到对应活动详情页

### Requirement 18: 沉浸式地图页 (Explore Map Page)

**User Story:** As a 用户, I want 在全屏地图中交互式探索附近的活动, so that 我可以拖拽、缩放、筛选并找到感兴趣的活动。

#### Acceptance Criteria

1. WHEN 沉浸式地图页打开 THEN 小程序 SHALL 显示全屏可交互的 `<map>` 组件
2. WHEN 沉浸式地图页渲染 THEN 小程序 SHALL 在地图上显示搜索结果的 Activity_Pin（使用 Cornflower_Blue 颜色）
3. WHEN 用户点击地图上的 Activity_Pin THEN 小程序 SHALL 在底部显示活动简要信息卡片
4. WHEN 沉浸式地图页渲染 THEN 小程序 SHALL 在底部显示悬浮的活动列表面板（可上滑展开）
5. WHEN 用户拖拽地图到新区域 THEN 小程序 SHALL 自动加载该区域的活动数据
6. WHEN 沉浸式地图页渲染 THEN 小程序 SHALL 在顶部显示筛选栏（类型筛选：美食/运动/桌游/娱乐/全部）
7. WHEN 用户点击 [收起] 或左上角返回按钮 THEN 小程序 SHALL 关闭沉浸式地图页，返回 Chat_Stream
8. WHEN 沉浸式地图页关闭 THEN 小程序 SHALL 使用收缩动画（卡片缩回对话流），而非标准页面返回动画

### Requirement 19: AI 意图分类

**User Story:** As a 系统, I want AI 能够区分用户的明确创建意图和模糊探索意图, so that 我可以返回最合适的 Widget 类型。

#### Acceptance Criteria

1. WHEN 用户输入包含明确创建信息（时间、地点、活动类型） THEN AI SHALL 返回 Widget_Draft（意图解析卡片）
2. WHEN 用户输入为探索性问题（"附近有什么"、"推荐一下"、"有什么好玩的"） THEN AI SHALL 返回 Widget_Explore（探索卡片）
3. WHEN 用户输入无法识别意图 THEN AI SHALL 返回文本消息引导用户重新描述
4. WHEN AI 返回 Widget_Explore THEN 响应 SHALL 包含搜索结果列表（活动 ID、标题、位置、类型、距离）

### Requirement 20: 流式渲染增强 (Generative UI Streaming)

**User Story:** As a 用户, I want 看到 AI 逐步构建复杂的 Widget 卡片, so that 我感受到 AI 正在为我工作而不是简单地等待。

#### Acceptance Criteria

1. WHEN AI 开始处理探索请求 THEN Chat_Stream SHALL 显示思考态文本（"正在搜索观音桥附近的活动..."）
2. WHEN AI 定位到搜索区域 THEN 小程序 SHALL 流式显示 "找到了 N 个活动"
3. WHEN AI 返回搜索结果 THEN Widget_Explore SHALL 逐步渲染：先显示 Header，再显示地图预览，最后显示活动列表
4. WHEN Widget 渲染完成 THEN 小程序 SHALL 显示 Action 按钮（[🗺️ 展开地图]）

---

## Admin Console Requirements (AI Ops v3.2)

> **核心定位**：AI 调试与数据中控台 (AI Ops & Data Console)
> - **对于 AI**：它是 X-Ray（X光机），负责透视 AI 的思考过程、意图分类准确率和结构化数据质量
> - **对于业务**：它是 CMS，负责管理用户、活动和内容风控

### Requirement 21: AI Playground

**User Story:** As a developer, I want to test AI parsing in a sandbox environment, so that I can debug and improve AI responses.

#### Acceptance Criteria

1. WHEN a developer opens the Playground, THE Admin_Console SHALL display a chat interface
2. WHEN a developer sends a message, THE Playground SHALL call the `/ai/parse` API via `useChat` hook
3. WHEN AI returns a text response, THE Playground SHALL render it as Markdown
4. WHEN AI returns a widget response, THE Playground SHALL render an Inspector panel (not UI card)
5. THE Playground SHALL support System Prompt Override configuration
6. THE Playground SHALL support saving/loading prompt presets

### Requirement 22: Inspector Pattern

**User Story:** As a developer, I want to see structured data from AI responses, so that I can verify data quality.

#### Acceptance Criteria

1. WHEN AI returns `widget_draft`, THE DraftInspector SHALL display time, location, type in structured format
2. WHEN AI returns `widget_explore`, THE ExploreInspector SHALL display search keywords, center coordinates, result list
3. THE Inspector SHALL include a link to verify location on Tencent Map
4. THE Inspector SHALL display confidence level when available
5. THE RawJsonInspector SHALL support fold/expand and copy JSON

### Requirement 23: Conversation Audit

**User Story:** As a developer, I want to review historical conversations, so that I can identify and fix AI issues.

#### Acceptance Criteria

1. WHEN a developer opens Conversation Inspector, THE Admin_Console SHALL display a list of sessions
2. THE session list SHALL highlight conversations with widget generation failures (red)
3. THE session list SHALL highlight conversations with unclear intent
4. WHEN a developer clicks a session, THE Admin_Console SHALL display the full conversation flow
5. THE conversation detail SHALL reuse Playground rendering components in read-only mode
6. THE Admin_Console SHALL provide a [Fix & Test] button to import conversation context to Playground

### Requirement 24: Evaluation Suite (Optional)

**User Story:** As a developer, I want to run regression tests on AI prompts, so that I can ensure prompt changes don't break existing functionality.

#### Acceptance Criteria

1. THE Admin_Console SHALL support defining test cases in JSON format (Golden Dataset)
2. WHEN a developer clicks "Run All Tests", THE Admin_Console SHALL call AI API for each test case
3. THE Admin_Console SHALL compare AI responses with expected outputs
4. THE Admin_Console SHALL generate a red/green test report with pass rate

### Requirement 25: 用户列表查询

**User Story:** As a user, I want to view a paginated list of users, so that I can manage platform users.

#### Acceptance Criteria

1. WHEN requesting the user list, THE User_Module SHALL return a paginated list of users
2. WHEN pagination parameters are provided, THE User_Module SHALL return the specified page with the specified limit
3. WHEN a search parameter is provided, THE User_Module SHALL filter users by nickname or phone number
4. THE User_Module SHALL exclude sensitive fields (wxOpenId) from the response
5. THE User_Module SHALL return total count for pagination

### Requirement 26: 用户详情查询

**User Story:** As a user, I want to view user details, so that I can understand user information.

#### Acceptance Criteria

1. WHEN requesting user details by ID, THE User_Module SHALL return the user's full information
2. IF the user does not exist, THEN THE User_Module SHALL return a 404 error
3. THE User_Module SHALL exclude sensitive fields (wxOpenId) from the response

### Requirement 27: 用户信息更新

**User Story:** As a user, I want to update user information, so that I can manage user data.

#### Acceptance Criteria

1. WHEN updating user information, THE User_Module SHALL update the specified fields
2. IF the user does not exist, THEN THE User_Module SHALL return a 404 error
3. THE User_Module SHALL only allow updating non-sensitive fields (nickname, avatarUrl)

### Requirement 28: 活动列表查询

**User Story:** As a user, I want to view a paginated list of activities, so that I can manage platform activities.

#### Acceptance Criteria

1. WHEN requesting the activity list, THE Activity_Module SHALL return a paginated list of activities
2. WHEN pagination parameters are provided, THE Activity_Module SHALL return the specified page with the specified limit
3. WHEN a search parameter is provided, THE Activity_Module SHALL filter activities by title or location
4. WHEN a status filter is provided, THE Activity_Module SHALL filter activities by status
5. WHEN a type filter is provided, THE Activity_Module SHALL filter activities by type
6. THE Activity_Module SHALL include creator information in the response
7. THE Activity_Module SHALL return total count for pagination

### Requirement 29: Admin 仪表板统计增强

**User Story:** As an admin, I want to see enhanced dashboard statistics, so that I can monitor platform health.

#### Acceptance Criteria

1. THE Dashboard_Module SHALL return activeUsers count (today's active users)
2. THE Dashboard_Module SHALL return growth rate calculations
3. THE Dashboard_Module SHALL return todayNewUsers count
