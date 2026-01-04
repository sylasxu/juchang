# Requirements Document

## Introduction

本功能将小程序的 AI 对话实现统一为与 Admin 端一致的 `useChat` 模式，实现流式文本打字机效果，并重构首页以使用新的 `useChatStore`。

## Glossary

- **useChatStore**: 小程序端类似 `@ai-sdk/react` 的 `useChat` 的状态管理 Store
- **UIMessage**: AI SDK v6 格式的消息结构，包含 `parts` 数组
- **UIMessagePart**: 消息内容片段，可以是 `text`、`tool-*` 或 `widget` 类型
- **WidgetPart**: 小程序特有的 Widget 渲染片段
- **StreamingMessageId**: 当前正在流式输出的消息 ID
- **ChatStatus**: 对话状态枚举 (`idle` | `submitted` | `streaming`)

## Requirements

### Requirement 1: 集成 useChatStore 到首页

**User Story:** As a 用户, I want 首页使用统一的 useChatStore 管理 AI 对话, so that 代码结构与 Admin 端保持一致，便于维护。

#### Acceptance Criteria

1. WHEN 首页加载时, THE Home_Page SHALL 订阅 useChatStore 的状态变化
2. WHEN useChatStore.messages 变化时, THE Home_Page SHALL 更新页面 data.messages
3. WHEN useChatStore.status 变化时, THE Home_Page SHALL 更新 AI 思考态显示
4. WHEN useChatStore.streamingMessageId 变化时, THE Home_Page SHALL 更新流式输出状态

### Requirement 2: 重构消息发送流程

**User Story:** As a 用户, I want 通过 useChatStore.sendMessage 发送消息, so that 消息发送逻辑统一管理。

#### Acceptance Criteria

1. WHEN 用户在 AI_Dock 输入并发送消息时, THE Home_Page SHALL 调用 useChatStore.sendMessage(text)
2. WHEN 用户在 Widget_Draft 发送修改请求时, THE Home_Page SHALL 调用 useChatStore.sendMessage(text, { draftContext })
3. WHEN 用户点击 Dashboard 快捷操作时, THE Home_Page SHALL 调用 useChatStore.sendMessage(prompt)
4. THE Home_Page SHALL 移除旧的 startAIParse 方法和 sseController 状态

### Requirement 3: 适配 UIMessage.parts 渲染

**User Story:** As a 用户, I want 首页模板根据 UIMessage.parts 渲染消息内容, so that 支持混合内容（文本 + Widget）的消息。

#### Acceptance Criteria

1. WHEN 渲染 assistant 消息时, THE Home_Page SHALL 遍历 message.parts 数组
2. WHEN part.type 为 'text' 时, THE Home_Page SHALL 渲染 message-bubble 组件
3. WHEN part.type 为 'widget' 时, THE Home_Page SHALL 根据 widgetType 渲染对应 Widget 组件
4. WHEN 消息同时包含 text 和 widget parts 时, THE Home_Page SHALL 按顺序渲染所有 parts

### Requirement 4: 流式文本打字机效果

**User Story:** As a 用户, I want 看到 AI 回复的流式打字机效果, so that 交互体验更自然流畅。

#### Acceptance Criteria

1. WHEN streamingMessageId 等于当前消息 ID 时, THE message-bubble SHALL 显示闪烁光标
2. WHEN 流式输出进行中时, THE message-bubble SHALL 实时更新文本内容
3. WHEN 流式输出完成时, THE message-bubble SHALL 隐藏闪烁光标
4. THE 闪烁光标 SHALL 使用 CSS 动画实现，频率为 1 秒闪烁一次

### Requirement 5: 历史消息加载

**User Story:** As a 用户, I want 首页加载时显示历史对话, so that 我可以继续之前的对话。

#### Acceptance Criteria

1. WHEN 首页加载时, THE Home_Page SHALL 从 useChatStore 获取缓存的消息
2. IF 缓存消息为空, THEN THE Home_Page SHALL 显示 Dashboard 欢迎卡片
3. WHEN 用户下拉加载更多时, THE Home_Page SHALL 调用 API 获取更早的历史消息
4. THE useChatStore SHALL 持久化最近 50 条消息到本地存储

### Requirement 6: 清空对话

**User Story:** As a 用户, I want 点击新对话按钮清空当前对话, so that 我可以开始新的对话。

#### Acceptance Criteria

1. WHEN 用户点击新对话按钮时, THE Home_Page SHALL 调用 useChatStore.clearMessages()
2. WHEN 消息清空后, THE Home_Page SHALL 显示 Dashboard 欢迎卡片
3. IF 正在进行流式输出, THEN THE useChatStore SHALL 先停止当前请求再清空消息
