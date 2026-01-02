# Requirements Document

## Introduction

本文档定义了 JuChang Admin AI Ops 模块的整合重构需求。核心目标是将分散的 AI 运维功能整合到以 Playground 为核心的统一体验中，消除功能重复，提升运维效率。

**核心理念**：Playground 不仅是测试工具，更是 AI 系统的"可观测性中心"，提供类似 Dify 的执行追踪能力，但不引入复杂的流程图编排。

**设计哲学**：
- **驾驶舱思维** (Cockpit Mindset)：这不是后台，是你的 AI 控制中心
- **实时遥测** (Real-time Telemetry)：Token 使用、成本、耗时一目了然
- **透视视野** (X-Ray Vision)：AI 的每一步思考都清晰可见
- **键盘驱动** (Keyboard Driven)：一个人像一支军队一样战斗
- **成本掌控** (Money Matters)：每条消息显示成本，展示商业敏感度
- **克制的美学** (Restrained Aesthetics)：动画服务于功能，不抢眼

**目标用户画像**：
- 🎯 **Solo 创始人**：没有 QA 团队，没有专门运维，这个后台必须极致透明、极致高效
- 🎯 **投资人 Demo**：打开就能展示 AI 系统的专业度和可控性
- 🎯 **深夜调试**：暗黑模式 + 快捷键，高效解决问题

**技术约束**：
- 尽量使用 shadcn/ui 现有组件
- 动画克制，只在关键交互点使用
- 不引入重型依赖（如地图库）
- 代码高亮用简单的 CSS 即可

## Glossary

- **AI_Playground**: AI 对话调试沙盒，支持测试 AI 对话、查看 Tool 调用、预览 Widget 渲染
- **Welcome_Card**: 欢迎卡片，用户进入首页时显示的个性化问候和快捷操作
- **Generative_UI**: 生成式 UI，AI 返回结构化数据驱动前端渲染 Widget 组件
- **Tool_Inspector**: Tool 调用检查器，显示 Tool 的输入参数和输出结果
- **Widget_Preview**: Widget 预览，在 Admin 端渲染小程序 Widget 组件的效果
- **Execution_Trace**: 执行追踪，展示 AI 请求从输入到输出的完整执行链路
- **Trace_Step**: 追踪步骤，执行链路中的单个阶段（用户输入、Prompt 注入、LLM 推理、Tool 调用等）
- **Split_View**: 分屏视图，左侧对话流 + 右侧执行追踪
- **Floating_Panel**: 浮动面板，可拖拽、可调整大小的辅助面板

## Technical Constraints

**技术选型约束**：
- **框架**：Vite + React 19 + TanStack Router（非 Next.js）
- **AI SDK**：`@ai-sdk/react` 的 `useChat` hook + `DefaultChatTransport`
- **UI 库**：shadcn/ui + Tailwind CSS
- **不使用 AI Elements**：因为 AI Elements 依赖 Next.js，与我们的技术栈不兼容
- **自定义实现**：基于现有 `playground-chat.tsx` 扩展，保持代码风格一致

**参考 AI Elements 的设计模式**：

1. **组件化架构** (Component-Based Architecture)
   - `conversation`: 对话容器组件
   - `message`: 单条消息组件，支持 parts 渲染
   - `tool`: Tool 调用可视化组件
   - `reasoning`: 推理过程展示组件
   - `code-block`: 代码块语法高亮组件

2. **Parts-Based 消息结构** (AI SDK UIMessage.parts)
   - `text`: 文本内容
   - `tool-xxx`: Tool 调用（使用 `isToolUIPart` 辅助函数）
   - `file`: 文件/图片附件
   - `source`: 来源引用
   - `data-xxx`: 自定义数据部分（用于执行追踪）

3. **流式数据传输** (Streaming Data)
   - 使用 `createUIMessageStream` 发送自定义数据
   - 使用 `transient: true` 发送临时状态（不保存到历史）
   - 使用 `id` 实现数据部分的增量更新（reconciliation）

4. **Transport 配置** (DefaultChatTransport)
   - `api`: 自定义 API 端点
   - `body`: 附加请求参数（如 `source: 'admin'`）
   - `headers`: 动态请求头（如认证 token）

## Requirements

### Requirement 1: Playground 作为 AI Ops 核心入口

**User Story:** As an admin, I want Playground to be the main AI Ops page, so that I can access all AI debugging features from one place.

#### Acceptance Criteria

1. THE Admin_Console SHALL set `/ai-ops` route to render Playground directly
2. THE Playground SHALL display Welcome_Card when conversation is empty
3. THE Playground SHALL provide quick access to other AI Ops tools via sidebar or tabs
4. THE Admin_Console SHALL remove the separate "AI Ops 总览" dashboard page

### Requirement 2: 整合欢迎卡片预览功能

**User Story:** As an admin, I want to preview welcome cards for different users within Playground, so that I don't need a separate page.

#### Acceptance Criteria

1. THE Playground SHALL include a "用户模拟" panel to select different user contexts
2. WHEN admin selects a different user, THE Playground SHALL refresh Welcome_Card with that user's data
3. WHEN admin changes location coordinates, THE Playground SHALL refresh Welcome_Card with new location
4. THE Admin_Console SHALL remove the separate "欢迎卡片预览" page (`/ai-ops/welcome-preview`)

### Requirement 3: Playground 增强 - Widget 预览

**User Story:** As an admin, I want to see Widget rendering preview in Playground, so that I can verify Generative UI output.

#### Acceptance Criteria

1. WHEN AI returns Widget data (widget_draft, widget_explore, widget_share), THE Playground SHALL render a visual preview
2. THE Widget_Preview SHALL match the visual style of miniprogram widgets
3. THE Playground SHALL display both Widget_Preview and raw JSON in tabs

### Requirement 4: Playground 增强 - 上下文面板

**User Story:** As an admin, I want to configure AI context variables in Playground, so that I can test different scenarios.

#### Acceptance Criteria

1. THE Playground SHALL provide a "上下文配置" panel with:
   - 用户选择（模拟不同用户）
   - 位置坐标（经纬度输入）
   - 草稿上下文（选择现有草稿）
2. WHEN context is changed, THE Playground SHALL update the AI request parameters
3. THE Playground SHALL display current context summary in the header

### Requirement 5: 侧边栏导航简化

**User Story:** As an admin, I want a simplified AI Ops navigation, so that I can quickly access the tools I need.

#### Acceptance Criteria

1. THE Sidebar SHALL reorganize AI Ops items to:
   - Playground（主入口，原 AI Ops 总览位置）
   - 额度管理
   - Token 统计
   - Prompt 查看
   - 对话审计
2. THE Sidebar SHALL remove "欢迎卡片预览" entry
3. THE Sidebar SHALL remove "AI Ops 总览" entry (Playground 取代)

### Requirement 6: Playground 增强 - 运行状态指示

**User Story:** As an admin, I want to see AI service status in Playground, so that I know if the service is healthy.

#### Acceptance Criteria

1. THE Playground header SHALL display DeepSeek balance with refresh button
2. THE Playground header SHALL display service availability status (正常/异常)
3. WHEN balance is low (≤ 0), THE Playground SHALL show warning indicator

### Requirement 7: Playground 增强 - 快捷测试用例

**User Story:** As an admin, I want preset test cases in Playground, so that I can quickly test common scenarios.

#### Acceptance Criteria

1. THE Playground SHALL provide a "测试用例" dropdown with preset prompts:
   - 创建活动：明晚观音桥打麻将，3缺1
   - 探索附近：附近有什么活动
   - 修改草稿：换个地方
   - 发布活动：发布
2. WHEN admin selects a test case, THE Playground SHALL populate the input field
3. THE Playground SHALL allow admin to add custom test cases (stored in localStorage)

### Requirement 8: 执行追踪 (Execution Trace) - 核心交互

**User Story:** As an admin, I want to see the complete execution trace of each AI request, so that I can debug and understand AI behavior at each stage.

#### Acceptance Criteria

1. THE Playground SHALL use Split_View layout: left side for conversation, right side for Execution_Trace
2. THE Split_View divider SHALL be draggable to adjust panel widths
3. THE Execution_Trace panel SHALL be collapsible via toggle button or keyboard shortcut (⌘+E)
4. WHEN a message is selected in conversation, THE Execution_Trace SHALL highlight corresponding trace
5. THE Execution_Trace SHALL show the following Trace_Steps in a vertical timeline:
   - 用户输入（原始文本）
   - System Prompt 注入（时间、位置、草稿上下文）
   - LLM 推理（模型名称、输入/输出 Token 数、耗时）
   - Tool 调用（可能多个，按顺序显示）
   - 最终响应（AI 回复文本）
6. EACH Trace_Step SHALL display a status indicator:
   - 🔵 进行中 (streaming)
   - ✅ 成功
   - ❌ 失败
   - ⏳ 等待中

### Requirement 9: 执行追踪 - 时间线视觉设计（升级版）

**User Story:** As an admin, I want a cinematic visual timeline of execution steps, so that I can feel like I'm in the Matrix.

#### Acceptance Criteria

1. THE Execution_Trace SHALL use a vertical timeline with connecting lines between steps
2. THE connecting lines SHALL have **flowing gradient animation** when AI is processing
3. EACH Trace_Step SHALL show:
   - 左侧：时间戳（相对于请求开始的毫秒数）
   - 中间：步骤图标 + 步骤名称
   - 右侧：耗时 badge（如 "1.2s"）
4. THE timeline SHALL animate step-by-step as execution progresses (streaming mode)
5. WHEN hovering a Trace_Step, THE step SHALL highlight with subtle background color
6. THE Trace_Step card SHALL expand on click to show details
7. THE expanded card SHALL have smooth height transition animation (200ms ease-out)
8. **EACH Trace_Step SHALL have a status indicator with visual effects**:
   - 🔵 进行中：**呼吸光效 (Pulse Animation)** + 边缘发光
   - ✅ 成功：绿色勾选 + 微弱光晕
   - ❌ 失败：红色边框 + 警告图标
   - ⏳ 等待中：灰色虚线边框
9. THE Trace_Step card SHALL use **glassmorphism style** (磨砂玻璃质感)
10. THE JSON data SHALL use **syntax highlighting** with vibrant colors (like VS Code Dark+)

### Requirement 10: 执行追踪 - System Prompt 查看

**User Story:** As an admin, I want to see the actual System Prompt sent to LLM, so that I can verify context injection is correct.

#### Acceptance Criteria

1. THE "System Prompt 注入" Trace_Step SHALL show a summary card with:
   - 当前时间（格式化后的值）
   - 用户位置（坐标 + 地名，如果有）
   - 草稿上下文（活动标题，如果有）
2. THE summary card SHALL have "查看完整 Prompt" button
3. WHEN clicked, THE full Prompt SHALL open in a modal dialog (not inline expand)
4. THE modal SHALL use Monaco Editor (read-only) with markdown syntax highlighting
5. THE modal SHALL have "复制" button in header
6. THE modal SHALL support keyboard shortcut (Esc to close)

### Requirement 11: 执行追踪 - LLM 推理详情

**User Story:** As an admin, I want to see LLM inference details, so that I can monitor token usage and latency.

#### Acceptance Criteria

1. THE "LLM 推理" Trace_Step summary SHALL display:
   - 模型名称 badge（如 "deepseek-chat"）
   - Token 使用量（输入 + 输出 = 总计）
   - 总耗时
2. THE expanded view SHALL show:
   - 输入 Token 数（带进度条，相对于 context window）
   - 输出 Token 数
   - 首 Token 延迟 (Time to First Token)
   - 生成速度 (tokens/s)
3. WHEN token usage > 2000, THE Token badge SHALL show warning color (orange)
4. WHEN token usage > 4000, THE Token badge SHALL show danger color (red)

### Requirement 12: 执行追踪 - Tool 调用详情

**User Story:** As an admin, I want to see Tool call details with input/output, so that I can verify Tool behavior.

#### Acceptance Criteria

1. THE "Tool 调用" Trace_Step summary SHALL display:
   - 工具图标 + 工具名称（中文，如 "创建活动草稿"）
   - 执行状态 badge
   - 执行耗时
2. THE expanded view SHALL have two tabs: "输入参数" | "执行结果"
3. EACH tab SHALL display JSON with:
   - Syntax highlighting
   - 折叠/展开嵌套对象
   - "复制 JSON" button
   - 行号显示
4. WHEN Tool execution fails, THE Trace_Step SHALL:
   - Show red border
   - Display error message prominently
   - Provide "重试" button (if applicable)
5. FOR createActivityDraft Tool, THE expanded view SHALL also show Widget_Preview tab

### Requirement 13: 执行追踪 - API 层支持

**User Story:** As a developer, I want the API to return execution trace data, so that the frontend can display it.

#### Acceptance Criteria

1. WHEN `source='admin'` is passed to `/ai/chat`, THE API SHALL include execution trace in response
2. THE execution trace data structure SHALL be:
   ```typescript
   interface ExecutionTrace {
     requestId: string;
     startedAt: string;
     completedAt: string;
     steps: TraceStep[];
   }
   interface TraceStep {
     type: 'input' | 'prompt' | 'llm' | 'tool' | 'output';
     name: string;
     startedAt: string;
     completedAt?: string;
     status: 'pending' | 'running' | 'success' | 'error';
     data: Record<string, unknown>;
     error?: string;
   }
   ```
3. THE API SHALL stream trace steps in real-time using SSE (Server-Sent Events)
4. THE API SHALL NOT include execution trace for non-admin requests

### Requirement 14: Playground 布局 - 响应式设计

**User Story:** As an admin, I want Playground to work well on different screen sizes, so that I can use it on various devices.

#### Acceptance Criteria

1. ON screens ≥ 1440px, THE Playground SHALL show Split_View by default
2. ON screens 1024px - 1439px, THE Execution_Trace SHALL be collapsed by default, expandable via button
3. ON screens < 1024px, THE Execution_Trace SHALL be in a bottom sheet (slide up from bottom)
4. THE layout preference SHALL be persisted in localStorage

### Requirement 15: Playground 交互 - 键盘快捷键

**User Story:** As an admin, I want keyboard shortcuts for common actions, so that I can work more efficiently.

#### Acceptance Criteria

1. THE Playground SHALL support the following keyboard shortcuts:
   - `⌘+Enter` / `Ctrl+Enter`: 发送消息
   - `⌘+E` / `Ctrl+E`: 切换执行追踪面板
   - `⌘+K` / `Ctrl+K`: 打开测试用例选择器
   - `⌘+L` / `Ctrl+L`: 清空对话
   - `⌘+S` / `Ctrl+S`: 保存当前对话为测试用例
   - `Esc`: 关闭任何打开的 modal/panel
2. THE Playground SHALL display keyboard shortcut hints in tooltips
3. THE Playground SHALL show a "快捷键" help modal (via `?` key)

### Requirement 16: Playground 交互 - 消息操作

**User Story:** As an admin, I want to perform actions on individual messages, so that I can debug specific interactions.

#### Acceptance Criteria

1. WHEN hovering a message, THE message SHALL show action buttons:
   - 复制文本
   - 查看执行追踪（跳转到对应 trace）
   - 重新生成（仅 AI 消息）
   - 编辑并重发（仅用户消息）
2. THE action buttons SHALL appear with fade-in animation
3. THE "编辑并重发" action SHALL:
   - Open inline editor on the message
   - Show "发送" and "取消" buttons
   - Clear subsequent messages when sent

### Requirement 17: Playground 交互 - 实时状态反馈（升级版）

**User Story:** As an admin, I want cinematic visual feedback during AI processing, so that I feel like I'm controlling the Matrix.

#### Acceptance Criteria

1. WHEN AI is processing, THE Playground SHALL show:
   - Typing indicator in conversation (三个跳动的点)
   - Current step highlight in Execution_Trace
   - Progress text (如 "正在调用 createActivityDraft...")
2. THE typing indicator SHALL have smooth pulse animation
3. WHEN streaming text, THE text SHALL appear character-by-character with **Block Cursor (▊)** blinking like a retro terminal
4. THE "停止生成" button SHALL be prominently visible during streaming
5. **THE right panel edge SHALL have a subtle breathing glow effect (呼吸光效) when AI is thinking**
6. **WHEN Tool is being called, THE system SHALL show a rotating gear icon with text "Calling createDraft..."**
7. **THE Token speed meter SHALL display real-time speed like "45 tokens/s" with jumping numbers**

### Requirement 17.5: Widget 出场动画

**User Story:** As an admin, I want Widget cards to appear with cinematic animations, so that the demo looks impressive.

#### Acceptance Criteria

1. WHEN Widget data is ready, THE Widget_Preview SHALL appear with **Slide Up + Fade + Scale** combined animation
2. THE animation SHALL feel like the card is being "spit out" by the AI
3. THE animation duration SHALL be 300ms with ease-out timing
4. THE Widget card SHALL have a subtle shadow that grows during animation
5. AFTER animation completes, THE Widget SHALL have a subtle hover effect

### Requirement 18: Playground 交互 - 错误处理

**User Story:** As an admin, I want clear error messages and recovery options, so that I can handle failures gracefully.

#### Acceptance Criteria

1. WHEN an error occurs, THE Playground SHALL show:
   - Error message in conversation (red background)
   - Error step in Execution_Trace (red border)
   - "重试" button
2. THE error message SHALL be human-readable (not raw error codes)
3. THE Execution_Trace SHALL preserve partial results before error
4. THE "重试" button SHALL retry from the failed step (not from beginning)



### Requirement 19: 流式渲染 - 文本流式输出

**User Story:** As an admin, I want to see AI response streaming in real-time, so that I don't have to wait for the complete response.

#### Acceptance Criteria

1. THE Playground SHALL render AI text response character-by-character as it streams
2. THE streaming text SHALL have a blinking cursor at the end (like terminal)
3. THE streaming speed SHALL match the actual token generation speed from API
4. THE conversation SHALL auto-scroll to keep the latest content visible
5. THE auto-scroll SHALL pause if user manually scrolls up (to read previous content)
6. THE auto-scroll SHALL resume when user scrolls back to bottom

### Requirement 20: 流式渲染 - Widget 组件出现

**User Story:** As an admin, I want Widget components to appear when data is ready, so that I can see the final result.

#### Acceptance Criteria

1. WHEN Tool call completes and returns Widget data, THE Widget_Preview SHALL appear immediately
2. THE Widget_Preview SHALL have a simple fade-in animation (200ms)
3. THE Widget_Preview SHALL NOT do progressive field rendering (show complete widget at once)
4. BEFORE Widget data is ready, THE conversation SHALL show a loading skeleton

### Requirement 21: 流式渲染 - 执行追踪直接展示

**User Story:** As an admin, I want to see execution trace information directly without complex animations, so that I can quickly debug.

#### Acceptance Criteria

1. THE Execution_Trace SHALL update in real-time as steps complete
2. THE Execution_Trace SHALL NOT have complex animations (simple state changes only)
3. EACH Trace_Step SHALL show current status directly:
   - 进行中：显示 spinner
   - 完成：显示 ✅
   - 失败：显示 ❌
4. THE timing and token information SHALL update in real-time (simple text update)

### Requirement 22: 流式渲染 - 中断控制

**User Story:** As an admin, I want to stop streaming and see partial results, so that I can interrupt long responses.

#### Acceptance Criteria

1. THE "停止生成" button SHALL be visible throughout streaming
2. WHEN streaming is stopped, THE Playground SHALL:
   - Keep all streamed content (text + partial Tool results)
   - Mark the response as "已中断"
3. THE partial results SHALL still be viewable in Execution_Trace

### Requirement 23: 流式渲染 - 视觉反馈

**User Story:** As an admin, I want clear visual cues during streaming, so that I know the system is working.

#### Acceptance Criteria

1. THE Playground header SHALL show streaming indicator (spinner + "正在生成...")
2. THE input field SHALL be disabled during streaming
3. WHEN streaming completes, THE indicator SHALL disappear

---

## 🚀 WOW Factor 功能（让投资人骂脏话的特性）

### Requirement 24: AI 成本实时仪表盘

**User Story:** As a founder, I want to see real-time AI cost metrics at a glance, so that I can monitor burn rate and optimize spending.

#### Acceptance Criteria

1. THE Playground header SHALL display a mini cost dashboard showing:
   - 今日花费（实时累计）
   - 本月花费（带预算进度条）
   - 平均每次对话成本
2. THE cost display SHALL update in real-time after each AI request
3. WHEN clicking the cost badge, THE system SHALL show a detailed breakdown modal:
   - 按 Tool 分类的成本占比（饼图）
   - 按时间的成本趋势（折线图）
   - Top 5 最贵的对话
4. THE system SHALL support setting cost alerts (如：日花费超过 ¥50 时提醒)

### Requirement 25: 对话回放 (Conversation Replay)

**User Story:** As an admin, I want to replay any historical conversation step-by-step, so that I can debug issues and understand AI behavior.

#### Acceptance Criteria

1. THE Playground SHALL have a "历史对话" 按钮打开对话列表
2. WHEN selecting a historical conversation, THE Playground SHALL enter "回放模式"
3. IN replay mode, THE Playground SHALL show:
   - 播放控制条（播放/暂停/快进/后退）
   - 时间轴滑块（可拖拽到任意时间点）
   - 当时的执行追踪（完整还原）
4. THE replay SHALL animate messages appearing as they originally did
5. THE replay speed SHALL be adjustable (0.5x, 1x, 2x, 4x)

### Requirement 26: A/B Prompt 对比测试

**User Story:** As an admin, I want to compare different prompts side-by-side, so that I can optimize AI performance.

#### Acceptance Criteria

1. THE Playground SHALL support "对比模式" (Split comparison view)
2. IN comparison mode, THE layout SHALL show two chat panels side-by-side
3. EACH panel SHALL have independent:
   - Prompt 版本选择（当前版本 vs 历史版本）
   - 上下文配置
   - 执行追踪
4. WHEN sending a message, THE system SHALL send to both panels simultaneously
5. THE system SHALL highlight differences in:
   - 响应内容
   - Token 使用量
   - 响应时间
   - Tool 调用顺序

### Requirement 27: 智能测试套件

**User Story:** As an admin, I want to run automated test suites against the AI, so that I can ensure quality before deploying prompt changes.

#### Acceptance Criteria

1. THE Playground SHALL support creating "测试套件" containing multiple test cases
2. EACH test case SHALL define:
   - 输入 prompt
   - 期望的 Tool 调用（可选）
   - 期望的输出关键词（可选）
   - 期望的响应时间阈值（可选）
3. THE system SHALL support "一键运行" 整个测试套件
4. THE results SHALL show:
   - 通过/失败状态
   - 实际 vs 期望的对比
   - 总体通过率
5. THE test suites SHALL be exportable/importable (JSON 格式)

### Requirement 28: Prompt 版本管理

**User Story:** As an admin, I want to manage prompt versions with history, so that I can track changes and rollback if needed.

#### Acceptance Criteria

1. THE Prompt 查看器 SHALL show version history timeline
2. EACH version SHALL display:
   - 版本号
   - 修改时间
   - 修改摘要（Git commit message）
   - 修改者
3. THE system SHALL support viewing diff between any two versions
4. THE system SHALL support "在 Playground 中测试此版本" 快捷操作
5. THE system SHALL show which version is currently deployed

### Requirement 29: 实时协作标注

**User Story:** As an admin, I want to annotate AI responses for quality review, so that I can build training data and track issues.

#### Acceptance Criteria

1. EACH AI response SHALL have a "标注" 按钮
2. THE annotation options SHALL include:
   - 质量评分（1-5 星）
   - 问题标签（幻觉、不相关、格式错误、语气不当等）
   - 自由文本备注
3. THE annotations SHALL be saved and searchable
4. THE system SHALL show annotation statistics:
   - 平均评分趋势
   - 常见问题分布
   - 需要关注的对话列表

### Requirement 30: 用户旅程追踪

**User Story:** As an admin, I want to see a user's complete AI interaction journey, so that I can understand usage patterns.

#### Acceptance Criteria

1. THE Playground SHALL support "用户视角" 模式
2. WHEN selecting a user, THE system SHALL show:
   - 该用户的所有对话时间线
   - 创建的活动列表
   - AI 额度使用情况
   - 常用的 prompt 模式
3. THE timeline SHALL be interactive (点击跳转到具体对话)
4. THE system SHALL highlight "异常行为"（如：频繁重试、高错误率）

### Requirement 31: 性能基准测试

**User Story:** As an admin, I want to benchmark AI performance over time, so that I can detect regressions.

#### Acceptance Criteria

1. THE system SHALL automatically track key metrics:
   - 平均响应时间
   - 首 Token 延迟 (TTFT)
   - Tool 调用成功率
   - 意图识别准确率（基于标注数据）
2. THE Playground header SHALL show a "健康度" 指示器
3. WHEN clicking the indicator, THE system SHALL show:
   - 过去 7 天的性能趋势
   - 与历史基准的对比
   - 异常检测告警

### Requirement 32: 一键导出调试报告

**User Story:** As an admin, I want to export a complete debug report, so that I can share issues with the team or for documentation.

#### Acceptance Criteria

1. THE Playground SHALL have "导出报告" 按钮
2. THE report SHALL include:
   - 对话完整记录
   - 执行追踪详情
   - System Prompt 快照
   - 环境信息（时间、位置、用户上下文）
   - 性能指标
3. THE report format SHALL support:
   - Markdown（适合 GitHub Issue）
   - JSON（适合程序处理）
   - PDF（适合分享）

### Requirement 33: 暗黑模式 + 主题定制

**User Story:** As an admin working late nights, I want a beautiful dark mode, so that I can work comfortably.

#### Acceptance Criteria

1. THE Playground SHALL support dark mode (跟随系统或手动切换)
2. THE dark mode SHALL have carefully designed:
   - 代码高亮配色（类似 VS Code Dark+）
   - 执行追踪时间线配色
   - Widget 预览适配
3. THE system SHALL support accent color customization
4. THE transitions between themes SHALL be smooth (200ms fade)

### Requirement 33.5: Zen Mode（全屏沉浸模式）

**User Story:** As an admin doing a demo, I want to enter a distraction-free mode, so that the focus is entirely on the AI interaction.

#### Acceptance Criteria

1. THE Playground SHALL support "Zen Mode" via `⌘+⇧+F` or toggle button
2. IN Zen Mode, THE system SHALL:
   - Hide the Sidebar completely
   - Hide the Header (only show minimal status bar)
   - Expand the Playground to full screen
   - Use pure black background (#000) for maximum contrast
3. THE Zen Mode transition SHALL be smooth (300ms fade)
4. THE Zen Mode SHALL show a floating mini control bar (bottom center) with:
   - Exit Zen Mode button
   - Token speed meter
   - Cost indicator
5. PRESSING `Esc` SHALL exit Zen Mode

### Requirement 34: 命令面板 (Command Palette)

**User Story:** As a power user, I want a command palette for quick actions, so that I can work faster.

#### Acceptance Criteria

1. THE Playground SHALL support `⌘+P` / `Ctrl+P` to open command palette
2. THE command palette SHALL support:
   - 模糊搜索所有操作
   - 最近使用的命令
   - 快捷键提示
3. THE available commands SHALL include:
   - 切换沙盒/生产模式
   - 清空对话
   - 打开测试用例
   - 切换追踪面板
   - 导出报告
   - 打开设置
   - 跳转到其他 AI Ops 页面

### Requirement 35: 位置上下文调试（Context-Aware Debugging）

**User Story:** As an admin, I want to drag a map pin and instantly change AI's location context, so that I can test location-aware features like "探索附近".

#### Acceptance Criteria

1. THE Context Panel SHALL include a mini map for location selection (腾讯地图 GL 版)
2. THE map SHALL use a crosshair-style location selector (拖动地图，准星对准目标位置)
3. WHEN admin drags the map, THE system SHALL:
   - Update the location coordinates in real-time (GCJ-02 坐标系，与小程序一致)
   - Perform reverse geocoding to show location name: "当前模拟位置：重庆·观音桥"
   - Update the AI request context automatically
4. THE map SHALL support:
   - Quick preset locations (观音桥、解放碑、南坪、沙坪坝)
   - Manual coordinate input as fallback
5. THE map style SHALL use custom "极简灰" theme (Soft Tech 风格)

**技术决策**：
- ✅ **使用腾讯地图 GL 版**，不用 Mapbox
- **原因 1**：坐标系一致性 - 腾讯地图原生 GCJ-02，与微信小程序完全一致，避免"坐标系地狱"
- **原因 2**：POI 数据一致性 - Admin 搜到的地点，小程序里一定有
- **原因 3**：Solo 团队效率 - 不需要写任何坐标转换代码
- **费用**：0 元（Admin 用量远达不到收费标准）

**视觉设计**：
- 使用腾讯控制台的"极简灰"模板，关掉多余 POI
- CSS 内阴影 + 去饱和滤镜，达到 Apple Maps 质感
- 大圆角 + 淡边框，契合 Soft Tech 风格

**设计说明**：地图是调试工具，不是入口。用于 Context-Aware Debugging（环境感知调试），让 Admin 像上帝一样随手一拖就能改变 AI 的"世界"。

### Requirement 36: 消息成本显示

**User Story:** As a cost-conscious founder, I want to see the cost of each message, so that I can understand my burn rate.

#### Acceptance Criteria

1. EACH AI response SHALL display a tiny cost indicator: "$0.0004" or "¥0.003"
2. THE cost indicator SHALL be subtle (small gray text, bottom-right of message)
3. WHEN hovering the cost, THE system SHALL show breakdown:
   - Input tokens: 234 ($0.0001)
   - Output tokens: 567 ($0.0003)
   - Total: $0.0004
4. THE cost calculation SHALL use actual DeepSeek pricing

### Requirement 37: Fix & Retry（错误即机遇）

**User Story:** As an admin, I want to fix AI errors inline and retry, so that I don't have to restart the entire conversation.

#### Acceptance Criteria

1. WHEN AI generates invalid output (e.g., malformed JSON), THE Trace_Step SHALL show "Fix & Retry" button
2. CLICKING "Fix & Retry" SHALL:
   - Open an inline JSON editor with the problematic output
   - Allow admin to manually fix the JSON
   - Show "Retry with Fix" button
3. WHEN retrying, THE system SHALL:
   - Use the fixed JSON as Tool output
   - Continue the conversation from that point
   - NOT restart from the beginning
4. THE fixed output SHALL be marked with a "🔧 Manually Fixed" badge

### Requirement 38: 保存为回归测试用例

**User Story:** As an admin, I want to save any conversation as a regression test case, so that I can ensure AI behavior doesn't regress.

#### Acceptance Criteria

1. THE Playground SHALL support `⌘+/` to save current conversation as test case
2. THE save dialog SHALL allow:
   - Test case name
   - Expected behavior description
   - Tags (e.g., "创建活动", "探索", "边界情况")
3. THE saved test cases SHALL be runnable from the Test Suite
4. THE system SHALL track test case pass/fail history over time
