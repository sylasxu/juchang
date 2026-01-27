# Tasks: AI Playground 全屏画布改造

## Task 1: 创建浮动控制按钮组件

**文件**: `apps/admin/src/features/ai-ops/components/playground/floating-controls.tsx`

**内容**:
- 创建 FloatingControls 组件
- 三个按钮：设置、发送消息、清空
- 使用 Tooltip 提示
- 固定定位在右上角
- 半透明背景 + 阴影效果

**依赖**: shadcn/ui Button, Tooltip

---

## Task 2.1: 更新 FlowNode 类型定义

**文件**: `apps/admin/src/features/ai-ops/types/flow.ts`

**改动**:
- 在 `BaseFlowNodeData` 中添加 `downstreamNodes?: string[]` 字段
- 在 `BaseFlowNodeData` 中添加 `metadata` 字段用于存储执行详情
- 这些字段用于支持增强的节点详情展示

---

## Task 2.2: 更新 flow-builder 构建逻辑

**文件**: `apps/admin/src/features/ai-ops/components/flow/utils/flow-builder.ts`

**改动**:
- 在构建节点时，根据 edges 计算每个节点的 `downstreamNodes`
- 提取执行详情到 `metadata` 字段
- 确保节点数据包含完整的展示信息

---

## Task 2.3: 创建统一 Drawer 组件

**文件**: `apps/admin/src/features/ai-ops/components/playground/unified-drawer.tsx`

**内容**:
- 创建 UnifiedDrawer 组件
- 支持两种视图：'control' | 'node'
- **控制面板视图**：
  - 消息发送区（Textarea + Button）
  - Trace 开关（Switch）
  - 模拟设置（MockSettingsPanel）
  - 统计信息（StatsPanel）
- **节点详情视图（增强版 - 参考 Dify）**：
  - Header: 返回按钮 + 节点图标 + 名称 + 类型标签 + 状态 Badge
  - 输入参数卡片（带边框和背景）
  - 输出结果卡片（带边框和背景）
  - 执行详情卡片（耗时、Token 等）
  - 关联节点快速跳转按钮
- 使用 Sheet 组件，右侧滑入
- 动态宽度：控制面板 400px，节点详情 480px

**依赖**: shadcn/ui Sheet, Textarea, Switch, Label, Button, Badge

**辅助函数**:
- `getNodeIcon(type)`: 根据节点类型返回图标
- `getNodeTypeLabel(type)`: 返回节点类型中文标签

---

## Task 2.4: 创建节点详情子组件

**文件**: `apps/admin/src/features/ai-ops/components/playground/node-detail-components.tsx`

**内容**:
- 创建 `NodeInputContent` 组件：展示节点输入参数
- 创建 `NodeOutputContent` 组件：展示节点输出结果
- 创建 `NodeMetadata` 组件：展示执行详情（耗时、Token、成本等）
- 创建 `getNodeLabel` 函数：根据节点 ID 获取节点名称
- 这些组件被 UnifiedDrawer 的节点详情视图使用

**样式**:
- 使用 `text-sm` 和 `text-muted-foreground` 保持一致性
- JSON 数据使用 `<pre>` 标签格式化展示
- 关键指标使用 Badge 或高亮显示

---

## Task 3: 重构 PlaygroundLayout

**文件**: `apps/admin/src/features/ai-ops/components/playground/playground-layout.tsx`

**改动**:
1. 移除 Header 组件
2. 移除顶部设置区
3. 移除 Split View 布局
4. 改为全屏容器 (`h-screen w-screen`)
5. FlowTracePanel 占据全屏
6. 添加 FloatingControls
7. 添加 UnifiedDrawer（统一的右侧抽屉）

**状态管理**:
- 添加 `drawerOpen` 状态（统一的开关）
- 添加 `drawerView` 状态（'control' | 'node'）
- 添加 `selectedNode` 状态
- 保留现有 trace 相关状态

**事件处理**:
- `handleOpenControl`: 打开控制面板
- `handleNodeClick`: 打开节点详情

---

## Task 4: 提取消息发送逻辑

**文件**: `apps/admin/src/features/ai-ops/components/playground/playground-layout.tsx`

**改动**:
- 从 PlaygroundChat 提取 `handleSendMessage` 函数
- 移到 PlaygroundLayout 中
- 传递给 UnifiedDrawer
- 保持相同的 API 调用和 trace 处理逻辑

---

## Task 5: 更新 FlowTracePanel

**文件**: `apps/admin/src/features/ai-ops/components/flow/flow-trace-panel.tsx`

**改动**:
- 添加 `onNodeClick` prop
- 点击节点时触发回调
- 移除内部的 NodeDrawer（移到 PlaygroundLayout）

---

## Task 6: 添加键盘快捷键

**文件**: `apps/admin/src/features/ai-ops/components/playground/playground-layout.tsx`

**改动**:
- 添加 `useEffect` 监听键盘事件
- `⌘/Ctrl + K`: 打开控制 Drawer
- `⌘/Ctrl + Shift + K`: 清空 trace
- `ESC`: 关闭所有 Drawer

---

## Task 7: 样式调整

**文件**: 
- `apps/admin/src/features/ai-ops/components/playground/floating-controls.tsx`
- `apps/admin/src/features/ai-ops/components/playground/unified-drawer.tsx`

**改动**:
- 浮动按钮：半透明背景、圆形、阴影
- Drawer：滚动条样式、间距调整、动态宽度切换
- 响应式：小屏幕下 Drawer 宽度自适应

---

## Task 8: 清理旧代码

**文件**: 
- `apps/admin/src/features/ai-ops/components/playground/playground-chat.tsx`

**改动**:
- 标记为 deprecated（暂不删除，保留备份）
- 添加注释说明已迁移到新架构

---

## Task 9: 测试验证

**验证项**:
- [ ] 全屏模式正常显示
- [ ] 浮动按钮可点击
- [ ] 点击浮动按钮打开控制面板
- [ ] 消息发送功能正常
- [ ] 点击节点打开节点详情
- [ ] 节点详情 Header 显示图标、名称、类型、状态
- [ ] 输入/输出/执行详情分组展示
- [ ] 关联节点按钮可点击跳转
- [ ] 在节点详情中可以返回控制面板
- [ ] Drawer 宽度根据视图动态切换
- [ ] 键盘快捷键生效
- [ ] Trace 数据流正常
- [ ] 清空功能正常

---

## 实施顺序

1. Task 1: 创建 FloatingControls
2. Task 2.1: 更新 FlowNode 类型定义
3. Task 2.2: 更新 flow-builder 构建逻辑
4. Task 2.3: 创建 UnifiedDrawer（统一右侧抽屉）
5. Task 2.4: 创建节点详情子组件
6. Task 4: 提取消息发送逻辑
7. Task 5: 更新 FlowTracePanel
8. Task 3: 重构 PlaygroundLayout
9. Task 6: 添加键盘快捷键
10. Task 7: 样式调整
11. Task 8: 清理旧代码
12. Task 9: 测试验证
