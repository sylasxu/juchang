# Implementation Plan: Streaming Text Display

## Overview

重构小程序首页，使用 useChatStore 替代旧的 homeStore + startAIParse 模式。

## Tasks

- [x] 1. 重构首页使用 useChatStore
  - 替换 useHomeStore 订阅为 useChatStore 订阅
  - 移除 startAIParse 方法和 sseController
  - 更新 onSend/onDraftSendMessage 调用 useChatStore.sendMessage
  - _Requirements: 1.1-1.4, 2.1-2.4_

- [x] 2. 更新首页模板渲染逻辑
  - 修改 wxml 支持 UIMessage.parts 格式
  - 用户消息从 parts 提取文本
  - AI 消息遍历 parts 渲染 text 和 widget
  - _Requirements: 3.1-3.4_

- [x] 3. 实现流式打字机效果
  - message-bubble 组件已支持 isStreaming 属性
  - 确保 streamingMessageId 正确传递
  - _Requirements: 4.1-4.4_

- [x] 4. 适配 Dashboard 和清空对话
  - showDashboard 使用 useChatStore.addWidgetMessage
  - onNewChat 使用 useChatStore.clearMessages
  - _Requirements: 5.1-5.4, 6.1-6.3_

## Notes

- useChatStore 已实现，本任务主要是首页集成
- 保留 useAppStore 用于 UI 状态（authSheet、shareGuide）
- 保留 useUserStore 用于用户信息
