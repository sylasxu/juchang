# Design Document

## Overview

将小程序首页重构为使用 `useChatStore`，实现与 Admin 端一致的 AI 对话模式，核心是流式文本显示和 Widget 渲染。

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Home Page                         │
│  ┌─────────────────────────────────────────────┐   │
│  │              useChatStore                    │   │
│  │  - messages: UIMessage[]                    │   │
│  │  - status: 'idle' | 'streaming'             │   │
│  │  - streamingMessageId: string | null        │   │
│  │  - sendMessage(text, options?)              │   │
│  └─────────────────────────────────────────────┘   │
│                        │                            │
│                        ▼                            │
│  ┌─────────────────────────────────────────────┐   │
│  │           Message Rendering                  │   │
│  │  - user → message-bubble                    │   │
│  │  - assistant.text → message-bubble          │   │
│  │  - assistant.widget → widget-*              │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

## Components and Interfaces

### useChatStore (已实现)

```typescript
interface ChatState {
  messages: UIMessage[]
  status: ChatStatus
  streamingMessageId: string | null
  sendMessage: (text: string, options?: { draftContext?: DraftContext }) => void
  stop: () => void
  clearMessages: () => void
  addWidgetMessage: (widgetType: string, data: unknown) => string
}
```

### UIMessage 结构

```typescript
interface UIMessage {
  id: string
  role: 'user' | 'assistant'
  parts: (UIMessagePart | WidgetPart)[]
  createdAt: Date
}

// 文本片段
interface TextPart {
  type: 'text'
  text: string
}

// Widget 片段
interface WidgetPart {
  type: 'widget'
  widgetType: 'dashboard' | 'draft' | 'explore' | 'share' | 'ask_preference' | 'error'
  data: unknown
}
```

### 消息渲染逻辑

```
遍历 messages:
  if role === 'user':
    渲染 message-bubble(role='user', content=getTextContent(msg))
  else:
    遍历 msg.parts:
      if part.type === 'text':
        渲染 message-bubble(role='assistant', content=part.text, isStreaming)
      if part.type === 'widget':
        根据 widgetType 渲染对应 Widget
```

## Data Models

### PageData 简化

```typescript
interface PageData {
  // 从 useChatStore 同步
  messages: UIMessage[]
  status: ChatStatus
  streamingMessageId: string | null
  
  // 保留的页面状态
  userNickname: string
  isAuthSheetVisible: boolean
  isShareGuideVisible: boolean
  shareGuideData: { activityId?: string; title?: string } | null
}
```

## Correctness Properties

本功能主要是 UI 重构，核心正确性由 useChatStore 保证：

1. **消息同步**: Page.data.messages 始终与 useChatStore.messages 同步
2. **流式状态**: streamingMessageId 正确标识当前流式消息
3. **Widget 渲染**: 每种 widgetType 都能正确渲染对应组件

## Error Handling

- SSE 连接失败 → 显示 widget-error 并提供重试
- 网络中断 → 自动停止流式输出，状态重置为 idle

## Testing Strategy

手动测试：
1. 发送消息 → 验证流式打字效果
2. Tool 调用 → 验证 Widget 正确渲染
3. 新对话 → 验证消息清空和 Dashboard 显示
