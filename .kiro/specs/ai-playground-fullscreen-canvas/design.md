# Design: AI Playground 全屏画布改造

## 1. 架构设计

### 1.1 组件结构

```
PlaygroundLayout (全屏容器)
├── FlowTracePanel (全屏流程图)
├── FloatingControls (浮动按钮组)
└── UnifiedDrawer (统一右侧抽屉 - 根据 drawerView 动态切换)
    ├── view='control' → 控制面板
    │   ├── MessageInput (消息发送)
    │   ├── MockSettingsPanel (模拟设置)
    │   ├── StatsPanel (统计信息)
    │   └── TraceToggle (Trace 开关)
    └── view='node' → 节点详情
        ├── BackButton (返回控制面板)
        └── NodeDrawerContent (复用现有节点详情内容)
```

### 1.2 布局变化

**改造前**:
```
┌─────────────────────────────────────────┐
│ Header (固定)                            │
├─────────────────────────────────────────┤
│ 顶部设置区                               │
├──────────────────┬──────────────────────┤
│ Chat Panel       │ Trace Panel          │
│ (左侧)           │ (右侧)               │
└──────────────────┴──────────────────────┘
```

**改造后**:
```
┌─────────────────────────────────────────┐
│                                    [⚙️][💬][🗑️] │
│                                         │
│         Flow Graph (全屏)               │
│                                         │
└─────────────────────────────────────────┘

点击按钮或节点打开统一的右侧 Drawer:
┌─────────────────────────────────────────┐
│                              ┌──────────┤
│                              │ 控制面板  │
│         Flow Graph           │ 或       │
│                              │ 节点详情  │
└─────────────────────────────┴──────────┘
```

**重要**: 只有一个右侧 Drawer，根据触发源动态切换内容：
- 点击浮动按钮 → 显示控制面板
- 点击流程图节点 → 显示节点详情
- 在节点详情中可以返回控制面板

## 2. 组件设计

### 2.1 FloatingControls 组件

**位置**: 右上角，固定定位  
**功能**: 提供快速访问按钮

```typescript
interface FloatingControlsProps {
  onOpenSettings: () => void;
  onOpenChat: () => void;
  onClear: () => void;
}

export function FloatingControls({
  onOpenSettings,
  onOpenChat,
  onClear,
}: FloatingControlsProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex gap-2">
      <Tooltip content="设置">
        <Button
          variant="secondary"
          size="icon"
          className="h-10 w-10 rounded-full shadow-lg"
          onClick={onOpenSettings}
        >
          <Settings className="h-5 w-5" />
        </Button>
      </Tooltip>
      
      <Tooltip content="发送消息">
        <Button
          variant="secondary"
          size="icon"
          className="h-10 w-10 rounded-full shadow-lg"
          onClick={onOpenChat}
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
      </Tooltip>
      
      <Tooltip content="清空">
        <Button
          variant="secondary"
          size="icon"
          className="h-10 w-10 rounded-full shadow-lg"
          onClick={onClear}
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </Tooltip>
    </div>
  );
}
```

### 2.2 UnifiedDrawer 组件

**位置**: 右侧滑入  
**宽度**: 400px (控制面板) / 480px (节点详情)  
**功能**: 统一的右侧抽屉，根据内容类型动态切换

**设计参考**: 借鉴 Dify 的节点详情信息层级设计

```typescript
type DrawerView = 'control' | 'node';

interface UnifiedDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  view: DrawerView;
  onViewChange: (view: DrawerView) => void;
  
  // 控制面板相关
  mockSettings: MockSettings;
  onMockSettingsChange: (settings: MockSettings) => void;
  traceEnabled: boolean;
  onTraceEnabledChange: (enabled: boolean) => void;
  onSendMessage: (message: string) => void;
  stats: ConversationStats | null;
  
  // 节点详情相关
  selectedNode: FlowNode | null;
  onNodeClick?: (nodeId: string) => void; // 用于关联节点跳转
}

export function UnifiedDrawer({
  open,
  onOpenChange,
  view,
  onViewChange,
  mockSettings,
  onMockSettingsChange,
  traceEnabled,
  onTraceEnabledChange,
  onSendMessage,
  stats,
  selectedNode,
  onNodeClick,
}: UnifiedDrawerProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const width = view === 'control' ? 'w-[400px]' : 'w-[480px]';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className={`${width} overflow-y-auto`}>
        {view === 'control' ? (
          <>
            <SheetHeader>
              <SheetTitle>控制面板</SheetTitle>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* 消息发送区 */}
              <div className="space-y-2">
                <Label>发送消息</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="输入测试消息..."
                  rows={4}
                />
                <Button onClick={handleSend} className="w-full">
                  发送
                </Button>
              </div>

              {/* Trace 开关 */}
              <div className="flex items-center justify-between">
                <Label>启用 Trace</Label>
                <Switch
                  checked={traceEnabled}
                  onCheckedChange={onTraceEnabledChange}
                />
              </div>

              {/* 模拟设置 */}
              <div className="space-y-2">
                <Label>模拟设置</Label>
                <MockSettingsPanel
                  settings={mockSettings}
                  onChange={onMockSettingsChange}
                />
              </div>

              {/* 统计信息 */}
              {stats && (
                <div className="space-y-2">
                  <Label>统计信息</Label>
                  <StatsPanel stats={stats} />
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* 增强的节点详情 Header - 参考 Dify */}
            <SheetHeader>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onViewChange('control')}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                
                {/* 节点类型图标 */}
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  {getNodeIcon(selectedNode.data.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <SheetTitle className="truncate">{selectedNode.data.label}</SheetTitle>
                  <p className="text-xs text-muted-foreground">
                    {getNodeTypeLabel(selectedNode.data.type)}
                  </p>
                </div>
                
                {/* 执行状态 Badge */}
                {selectedNode.data.status && (
                  <Badge variant={selectedNode.data.status === 'success' ? 'default' : 'destructive'}>
                    {selectedNode.data.status}
                  </Badge>
                )}
              </div>
            </SheetHeader>

            {/* 结构化的节点详情内容 */}
            <div className="mt-6 space-y-6">
              {/* 输入参数 */}
              {selectedNode.data.input && (
                <div>
                  <h3 className="mb-2 text-sm font-medium">输入</h3>
                  <div className="rounded-lg border bg-muted/50 p-3">
                    <NodeInputContent data={selectedNode.data} />
                  </div>
                </div>
              )}
              
              {/* 输出结果 */}
              {selectedNode.data.output && (
                <div>
                  <h3 className="mb-2 text-sm font-medium">输出</h3>
                  <div className="rounded-lg border bg-muted/50 p-3">
                    <NodeOutputContent data={selectedNode.data} />
                  </div>
                </div>
              )}
              
              {/* 执行详情（耗时、Token 等） */}
              {selectedNode.data.metadata && (
                <div>
                  <h3 className="mb-2 text-sm font-medium">执行详情</h3>
                  <div className="rounded-lg border bg-muted/50 p-3">
                    <NodeMetadata data={selectedNode.data.metadata} />
                  </div>
                </div>
              )}
              
              {/* 关联节点 - 参考 Dify 的"下一步"设计 */}
              {selectedNode.data.downstreamNodes?.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-medium">下一步</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedNode.data.downstreamNodes.map(nodeId => (
                      <Button
                        key={nodeId}
                        variant="outline"
                        size="sm"
                        onClick={() => onNodeClick?.(nodeId)}
                      >
                        {getNodeLabel(nodeId)}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

// 辅助函数
function getNodeIcon(type: string) {
  const icons = {
    'input': <MessageSquare className="h-5 w-5" />,
    'p0-match': <Search className="h-5 w-5" />,
    'p1-intent': <Target className="h-5 w-5" />,
    'processor': <Cpu className="h-5 w-5" />,
    'llm': <Sparkles className="h-5 w-5" />,
    'tool': <Wrench className="h-5 w-5" />,
    'output': <CheckCircle className="h-5 w-5" />,
  };
  return icons[type] || <Circle className="h-5 w-5" />;
}

function getNodeTypeLabel(type: string) {
  const labels = {
    'input': '用户输入',
    'p0-match': 'P0 匹配',
    'p1-intent': 'P1 意图识别',
    'processor': '处理器',
    'llm': '大语言模型',
    'tool': '工具调用',
    'output': '输出结果',
  };
  return labels[type] || type;
}
```

### 2.3 PlaygroundLayout 重构

```typescript
export function PlaygroundLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerView, setDrawerView] = useState<'control' | 'node'>('control');
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  const [traceEnabled, setTraceEnabled] = useState(true);
  const [mockSettings, setMockSettings] = useState<MockSettings>({
    userType: 'with_phone',
    location: 'guanyinqiao',
  });

  const {
    traces,
    clearTrace,
    handleTraceStart,
    handleTraceStep,
    handleTraceEnd,
    isStreaming,
  } = useExecutionTrace();

  const handleSendMessage = async (message: string) => {
    // 发送消息逻辑
  };

  const handleNodeClick = (node: FlowNode) => {
    setSelectedNode(node);
    setDrawerView('node');
    setDrawerOpen(true);
  };

  const handleOpenControl = () => {
    setDrawerView('control');
    setDrawerOpen(true);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* 全屏流程图 */}
      <FlowTracePanel
        traces={traces}
        isStreaming={isStreaming}
        onNodeClick={handleNodeClick}
      />

      {/* 浮动控制按钮 */}
      <FloatingControls
        onOpenSettings={handleOpenControl}
        onOpenChat={handleOpenControl}
        onClear={clearTrace}
      />

      {/* 统一的右侧 Drawer */}
      <UnifiedDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        view={drawerView}
        onViewChange={setDrawerView}
        mockSettings={mockSettings}
        onMockSettingsChange={setMockSettings}
        traceEnabled={traceEnabled}
        onTraceEnabledChange={setTraceEnabled}
        onSendMessage={handleSendMessage}
        stats={null}
        selectedNode={selectedNode}
      />
    </div>
  );
}
```

## 3. 状态管理

### 3.1 Drawer 状态
- `drawerOpen`: 统一 Drawer 的开关状态
- `drawerView`: 当前显示的视图 ('control' | 'node')
- `selectedNode`: 当前选中的节点（用于节点详情视图）

**状态切换逻辑**:
- 点击浮动按钮 → `drawerView = 'control'`, `drawerOpen = true`
- 点击流程图节点 → `drawerView = 'node'`, `drawerOpen = true`, 设置 `selectedNode`
- 在节点详情中点击返回 → `drawerView = 'control'`
- 关闭 Drawer → `drawerOpen = false`

### 3.2 消息发送
- 从 PlaygroundChat 组件提取消息发送逻辑
- 移到 UnifiedDrawer 的控制面板视图中
- 保持相同的 API 调用和 trace 处理

## 4. 样式设计

### 4.1 浮动按钮
- 半透明背景: `bg-background/80 backdrop-blur-sm`
- 圆形按钮: `rounded-full`
- 阴影: `shadow-lg`
- Hover 效果: `hover:bg-background`

### 4.2 Drawer
- 宽度: 400px (控制面板) / 480px (节点详情)
- 位置: 统一从右侧滑入
- 滑入动画: Sheet 组件自带
- 遮罩: 半透明黑色
- 动态宽度: 根据 `drawerView` 切换

## 5. 键盘快捷键

- `⌘/Ctrl + K`: 打开控制 Drawer
- `⌘/Ctrl + Shift + K`: 清空 trace
- `ESC`: 关闭所有 Drawer

## 6. 设计参考

### 6.1 从 Dify 学到的有用设计

1. **节点详情信息层级**：
   - 节点类型图标 + 名称 + 类型标签
   - 输入/输出参数分组展示
   - 执行状态可视化（Badge）
   - 关联节点快速跳转

2. **卡片式内容展示**：
   - 使用边框和背景色区分不同区域
   - 提升可读性和视觉层次

3. **状态可视化**：
   - 不同节点类型用不同图标
   - 执行状态用 Badge 标识
   - 虚线/实线表示执行路径

### 6.2 不适用的部分

- 左侧节点库（我们是只读 trace）
- 顶部工具栏（我们用浮动按钮）
- 节点配置功能（我们只展示结果）

## 7. 迁移计划

1. 创建新组件 (FloatingControls, UnifiedDrawer)
2. 重构 PlaygroundLayout
3. 移除旧组件 (PlaygroundChat 的 UI 部分)
4. 保留 trace 逻辑和数据流
5. 测试所有功能
