# Tasks - AI Ops Consolidation (Streamlined)

> **设计哲学**: 不做 Manager，只做 Maker。砍掉所有"管理"功能，保留所有"创造"和"调试"功能。

---

## Phase 1: 核心链路 (The Core Loop)

### Task 1: 创建执行追踪类型定义 ✅

**Requirements**: R8, R13

**Description**: 定义 ExecutionTrace 和 TraceStep 的 TypeScript 类型。

**Acceptance Criteria**:
- [x] 创建 `apps/admin/src/features/ai-ops/types/trace.ts`
- [x] 定义 ExecutionTrace 接口
- [x] 定义 TraceStep 接口
- [x] 定义各步骤的 data 类型
- [x] 导出类型守卫和辅助函数

---

### Task 2: 实现 StreamingText 组件 ✅

**Requirements**: R19, R23

**Description**: 创建流式文本渲染组件，支持闪烁光标效果。

**Acceptance Criteria**:
- [x] 创建 `apps/admin/src/features/ai-ops/components/shared/streaming-text.tsx`
- [x] 实现闪烁光标动画
- [x] 添加 CSS @keyframes blink 到 index.css

---

### Task 3: 实现 JSON 查看器组件 ✅

**Requirements**: R12

**Description**: 创建 JSON 语法高亮查看器，使用简单 CSS（不引入 shiki）。

**Acceptance Criteria**:
- [x] 创建 `apps/admin/src/features/ai-ops/components/shared/json-viewer.tsx`
- [x] 实现简单的 JSON 语法高亮
- [x] 实现复制按钮
- [x] 支持折叠/展开

---

### Task 4: 实现 Prompt 查看弹窗 ✅

**Requirements**: R10

**Description**: 创建 System Prompt 查看弹窗。

**Acceptance Criteria**:
- [x] 创建 `apps/admin/src/features/ai-ops/components/shared/prompt-modal.tsx`
- [x] 使用 Dialog 组件
- [x] 实现简单的 Markdown 渲染
- [x] 实现复制按钮

---

### Task 5: 实现 TraceStep 组件 ✅

**Requirements**: R9, R21

**Description**: 创建单个执行步骤的卡片组件。

**Acceptance Criteria**:
- [x] 创建 `apps/admin/src/features/ai-ops/components/execution-trace/trace-step.tsx`
- [x] 实现收起/展开状态
- [x] 显示时间戳、图标、名称、耗时
- [x] 显示状态指示器（spinner/✅/❌）

---

### Task 6: 实现步骤详情组件 ✅

**Requirements**: R10, R11, R12

**Description**: 为不同类型的步骤创建详情展示组件。

**Acceptance Criteria**:
- [x] 创建 `trace-step-input.tsx`
- [x] 创建 `trace-step-prompt.tsx`
- [x] 创建 `trace-step-llm.tsx`
- [x] 创建 `trace-step-tool.tsx`
- [x] 创建 `trace-step-output.tsx`

---

### Task 7: 实现 TraceTimeline 组件 ✅

**Requirements**: R9

**Description**: 创建时间线容器组件。

**Acceptance Criteria**:
- [x] 创建 `apps/admin/src/features/ai-ops/components/execution-trace/trace-timeline.tsx`
- [x] 实现垂直时间线布局
- [x] 管理步骤展开状态
- [x] 支持步骤选中高亮

---

### Task 8: 实现 ExecutionTracePanel 组件 ✅

**Requirements**: R8

**Description**: 创建执行追踪面板容器。

**Acceptance Criteria**:
- [x] 创建 `apps/admin/src/features/ai-ops/components/execution-trace/trace-panel.tsx`
- [x] 显示请求 ID 和总耗时
- [x] 包含 TraceTimeline
- [x] 支持空状态和加载状态

---

### Task 9: 实现 useExecutionTrace Hook ✅

**Requirements**: R8, R21

**Description**: 创建执行追踪状态管理 Hook。

**Acceptance Criteria**:
- [x] 创建 `apps/admin/src/features/ai-ops/hooks/use-execution-trace.ts`
- [x] 实现 trace 状态管理
- [x] 处理 trace-start、trace-step、trace-end 事件

---

### Task 10: 实现 useSplitView Hook ✅

**Requirements**: R14

**Description**: 创建分屏布局状态管理 Hook。

**Acceptance Criteria**:
- [x] 创建 `apps/admin/src/features/ai-ops/hooks/use-split-view.ts`
- [x] 实现面板可见性和宽度状态
- [x] 实现响应式布局模式检测
- [x] 实现 localStorage 持久化

---

### Task 11: 实现 PlaygroundLayout 组件 ✅

**Requirements**: R8, R14

**Description**: 创建 Split View 布局容器。

**Acceptance Criteria**:
- [x] 创建 `apps/admin/src/features/ai-ops/components/playground/playground-layout.tsx`
- [x] 实现左右分屏布局
- [x] 实现可拖拽分隔线
- [x] 实现 ⌘+E 快捷键切换追踪面板

---

### Task 12: 实现 PlaygroundHeader 组件 ✅

**Requirements**: R6, R7

**Description**: 创建 Playground 顶部工具栏。

**Acceptance Criteria**:
- [x] 创建 `apps/admin/src/features/ai-ops/components/playground/playground-header.tsx`
- [x] 显示 DeepSeek 余额
- [x] 显示测试用例下拉菜单
- [x] 显示追踪面板切换按钮

---

### Task 13: 增强 PlaygroundChat 组件 ✅

**Requirements**: R1, R2, R3, R16, R17, R19, R20

**Description**: 增强对话组件，集成执行追踪。

**Acceptance Criteria**:
- [x] 创建 `apps/admin/src/features/ai-ops/components/playground/playground-chat.tsx`
- [x] 集成 StreamingText 组件
- [x] 添加与 Trace 的联动
- [x] 实现自动滚动控制

---

## Phase 2: 路由与清理 (Wiring)

### Task 14: 更新路由配置 ✅

**Requirements**: R1, R5

**Description**: 修改路由，使 /ai-ops 渲染 Playground。

**Acceptance Criteria**:
- [x] 修改 `apps/admin/src/routes/_authenticated/ai-ops/index.tsx` 渲染 PlaygroundLayout
- [x] 修改 `apps/admin/src/routes/_authenticated/ai-ops/playground.tsx` 重定向到 /ai-ops
- [x] 删除 `apps/admin/src/routes/_authenticated/ai-ops/welcome-preview.tsx`

---

### Task 15: 更新侧边栏导航 ✅

**Requirements**: R5

**Description**: 简化 AI Ops 侧边栏导航。

**Acceptance Criteria**:
- [x] 修改 `apps/admin/src/components/layout/data/sidebar-data.ts`
- [x] 将 Playground 设为 /ai-ops 主入口
- [x] 移除"AI Ops 总览"和"欢迎卡片预览"入口

---

### Task 16: 清理废弃代码 ✅

**Requirements**: R1, R2

**Description**: 删除不再需要的页面和组件。

**Acceptance Criteria**:
- [x] 重命名 `apps/admin/src/features/ai-ops/index.tsx` 为 `ai-overview.tsx`（保留备用）
- [x] 删除 `apps/admin/src/features/ai-ops/welcome-preview/` 目录
- [x] 创建新的 `apps/admin/src/features/ai-ops/index.tsx` 导出 PlaygroundLayout

---

## Phase 3: API 追踪支持 (Backend)

### Task 17: 修改 API 返回执行追踪数据 ✅

**Requirements**: R13

**Description**: 修改 /ai/chat API，新增 `trace: boolean` 参数控制是否返回执行追踪数据。

**Acceptance Criteria**:
- [x] 在 `ai.model.ts` 中添加 `trace` 参数到请求 Schema
- [x] 修改 `ai.controller.ts` 传递 trace 参数
- [x] 修改 `apps/api/src/modules/ai/ai.service.ts` 的 streamChat 函数
- [x] 当 `trace=true` 时，在流式响应中发送 trace-start 事件
- [x] 在各阶段发送 trace-step 事件（input, prompt, llm, tool, output）
- [x] 收集 LLM 指标（Token 数、耗时）
- [x] 收集 Tool 调用信息
- [x] 前端 Playground 调用时传 `trace: true`

---

## Phase 4: 上下文配置 (God Mode)

### Task 18: 实现 PlaygroundContext 组件

**Requirements**: R4

**Description**: 创建上下文配置面板。

**Acceptance Criteria**:
- [x] 创建 `apps/admin/src/features/ai-ops/components/playground/playground-context.tsx`
- [x] 实现用户选择下拉框
- [x] 实现位置坐标输入
- [x] 实现草稿上下文选择

---

### Task 19: 实现位置上下文调试（腾讯地图）

**Requirements**: R35

**Description**: 实现腾讯地图 GL 版的位置选择器。

**Acceptance Criteria**:
- [ ] 安装 `tlbs-map-react` 依赖
- [ ] 创建 `apps/admin/src/features/ai-ops/components/playground/context-map.tsx`
- [ ] 实现十字准星定位交互
- [ ] 实现逆地理编码显示位置名称
- [ ] 实现快捷位置按钮（观音桥、解放碑、南坪、沙坪坝）
- [ ] 实现 Soft Tech 视觉效果（内阴影、去饱和滤镜）

---

## Phase 5: 效率工具 (Efficiency)

### Task 20: 实现快捷键系统

**Requirements**: R15

**Description**: 实现 Playground 快捷键支持。

**Acceptance Criteria**:
- [ ] 创建 `apps/admin/src/features/ai-ops/hooks/use-playground-shortcuts.ts`
- [ ] 实现 ⌘+Enter 发送消息
- [ ] 实现 ⌘+E 切换追踪面板（已在 Layout 中实现）
- [ ] 实现 ⌘+K 打开测试用例
- [ ] 实现 ⌘+L 清空对话
- [ ] 实现 Esc 关闭弹窗
- [ ] 实现 ? 显示帮助
- [ ] 创建快捷键帮助弹窗

---

### Task 21: 实现 Command Palette

**Requirements**: R34

**Description**: 实现命令面板快捷操作。

**Acceptance Criteria**:
- [ ] 安装 `cmdk` 库
- [ ] 创建 `apps/admin/src/features/ai-ops/components/command-palette/`
- [ ] 实现 ⌘+P 触发
- [ ] 实现模糊搜索
- [ ] 集成常用操作（清空对话、切换模式、打开设置等）

---

## Phase 6: 视觉微调 (Polish)

### Task 22: 安装必要依赖

**Requirements**: R9, R17

**Description**: 安装 framer-motion、cmdk 等必要库。

**Acceptance Criteria**:
- [ ] 安装 `framer-motion`（克制使用）
- [ ] 安装 `cmdk`
- [ ] 配置等宽字体（JetBrains Mono / Geist Mono）

---

### Task 23: 实现简洁的视觉动效

**Requirements**: R9, R17.5

**Description**: 实现必要的微动效。

**Acceptance Criteria**:
- [ ] TraceStep 进场动画（简单 fade-in）
- [ ] Widget 出场动画（Slide Up + Fade，200ms）
- [ ] 时间线连接线样式

---

## 🚫 已砍掉的任务 (The Kill List)

以下任务已被移除，原因见设计哲学：

| 原任务 | 砍掉原因 |
|--------|----------|
| Task 23 (成本仪表盘) | Header 显示余额就够了 |
| Task 24 (对话回放) | 直接看 Log |
| Task 25 (A/B Prompt 对比) | 手动改 Prompt 再发一次 |
| Task 26 (测试套件) | 写代码里的 test 脚本更快 |
| Task 27 (Prompt 版本管理) | 用 Git 管理 |
| Task 28 (标注系统) | 没空打分 |
| Task 29 (用户旅程追踪) | 用 Amplitude |
| Task 30 (健康度指示器) | API 通就是绿灯 |
| Task 31 (导出报告) | Solo 不需要 |
| Task 38 (Token 速度计) | 显示总数就够了 |
| Task 39 (Zen Mode) | Sidebar 折叠就够了 |

---

## 进度总结

**已完成**: Task 1-17 (核心组件 + 路由与清理 + API 追踪支持)
**待完成**: Task 18-23 (上下文、效率工具、视觉)

**预计工作量**: 精简后约 10 个任务，比原来 44 个任务减少 77%。
