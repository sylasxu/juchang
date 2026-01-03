# Implementation Plan: AI SDK Optimization

## Overview

本任务列表将 AI 模块重构为遵循 Vercel AI SDK 最佳实践，主要包括：
1. 使用官方 DeepSeek Provider
2. 简化消息格式转换
3. 简化 Tool 类型定义
4. 使用 maxSteps 替代手动步数检查
5. 小程序端消息格式标准化
6. 移除废弃代码

## Tasks

- [x] 1. 更新 API 依赖和 Provider 配置
  - [x] 1.1 更新 apps/api 依赖
    - 执行 `bun remove @ai-sdk/openai` 移除旧依赖
    - 执行 `bun add @ai-sdk/deepseek` 安装官方 DeepSeek provider
    - _Requirements: 1.1, 1.2_

  - [x] 1.2 简化 getAIModel() 函数
    - 修改 `apps/api/src/modules/ai/ai.service.ts`
    - 替换 `import { createOpenAI } from '@ai-sdk/openai'` 为 `import { createDeepSeek } from '@ai-sdk/deepseek'`
    - 移除 multi-provider switch 语句（openai, dashscope 分支）
    - 简化为单行 DeepSeek 初始化
    - _Requirements: 1.3, 1.4_

- [x] 2. 简化消息格式转换
  - [x] 2.1 使用 convertToModelMessages() 替代手动转换
    - 修改 `apps/api/src/modules/ai/ai.service.ts` 的 `streamChat()` 函数
    - 导入 `import { convertToModelMessages } from 'ai'`
    - 移除 ~100 行手动消息格式转换代码（MessagePart 接口、for 循环处理逻辑）
    - 移除 `tool-invocation` 旧格式支持，只保留 AI SDK v6 格式
    - _Requirements: 2.2, 2.3, 2.4_

  - [x] 2.2 移除手动定义的消息类型
    - 移除 `MessagePart` 接口定义
    - 移除 `InputMessage` 接口定义
    - 使用 AI SDK 内置的 `UIMessage` 类型
    - _Requirements: 2.1_

- [ ] 3. 简化 streamText 配置
  - [ ] 3.1 使用 maxSteps 替代手动步数检查
    - 修改 `apps/api/src/modules/ai/ai.service.ts` 的 `streamText()` 调用
    - 添加 `maxSteps: 5` 参数
    - 简化 `stopWhen` 回调，只保留 `askPreference` 检查
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ] 3.2 简化 Token Usage 获取
    - 修改 `onFinish` 回调
    - 直接使用 `event.usage` 而非 `(event as any).totalUsage || event.usage`
    - 移除 `inputTokens`/`outputTokens` 兼容逻辑
    - _Requirements: 5.1, 5.2, 5.3_

- [ ] 4. 简化 Tool 类型定义
  - [ ] 4.1 简化 askPreference Tool
    - 修改 `apps/api/src/modules/ai/tools/ask-preference.ts`
    - 移除 `AskPreferenceResult` 接口定义
    - 移除 `tool<AskPreferenceParams, AskPreferenceResult>` 泛型参数
    - 让 AI SDK 从 `execute` 函数返回值推导类型
    - 使用 `as const` 确保字面量类型
    - _Requirements: 3.1, 3.2, 3.4_

  - [ ] 4.2 简化其他 Tools（create-draft, refine-draft, explore-nearby, publish-activity）
    - 对每个 Tool 文件执行相同的简化
    - 移除手动定义的 Result 接口
    - 让 AI SDK 推导返回类型
    - _Requirements: 3.1, 3.2, 3.4_

- [ ] 5. Checkpoint - API 端改动验证
  - 确保 API 服务可以正常启动
  - 确保 Admin Playground 可以正常对话
  - 如有问题，请暂停并询问

- [ ] 6. 小程序端消息格式标准化
  - [ ] 6.1 更新 Home Store 消息类型
    - 修改 `apps/miniprogram/src/stores/home.ts`
    - 扩展 `ChatMessage` 类型添加 `parts?: UIMessagePart[]` 字段
    - 定义 `UIMessagePart` 接口（支持 text 和 tool parts）
    - _Requirements: 6.1_

  - [ ] 6.2 更新 Data Stream Parser 保存 Tool Parts
    - 修改 `apps/miniprogram/src/utils/data-stream-parser.ts`
    - 在 `handleToolCall` 中构建 AI SDK v6 格式的 tool part
    - 在 `handleToolResult` 中更新对应 tool part 的 output 和 state
    - 添加 `getToolParts()` 方法返回收集的 tool parts
    - _Requirements: 6.2, 6.4_

  - [ ] 6.3 更新 SSE Request 发送完整消息历史
    - 修改 `apps/miniprogram/src/utils/sse-request.ts`
    - 更新 `sendAIChat` 函数签名，接收完整的 `UIMessage[]` 数组
    - 移除内部的消息构建逻辑，直接发送传入的消息数组
    - _Requirements: 6.1, 6.3_

  - [ ] 6.4 更新 Home Page 发送逻辑
    - 修改 `apps/miniprogram/pages/home/index.ts`
    - 在 `startAIParse` 中构建完整的消息历史（包含 tool parts）
    - 从 store 中获取消息并转换为 UIMessage 格式
    - _Requirements: 6.1, 6.2_

- [ ] 7. 移除废弃代码
  - [ ] 7.1 移除 API 端废弃函数
    - 修改 `apps/api/src/modules/ai/ai.service.ts`
    - 移除 `parseTextStream()` 函数
    - 移除 `parseAIResponse()` 函数
    - 移除 `SYSTEM_PROMPT_TEST` 常量
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 8. Final Checkpoint - 端到端验证
  - 确保 API 服务正常启动
  - 确保 Admin Playground 对话正常
  - 确保小程序对话正常（包含多轮对话 tool call history）
  - 如有问题，请暂停并询问

## Notes

- 本次优化不涉及 Workflow Pattern 变更，专注于代码简化和标准化
- Admin 端无需改动，已经使用正确的 AI SDK 模式
- 小程序端改动主要是消息格式标准化，支持 tool call history
