# Requirements Document

## Introduction

本需求文档描述 AI 模块的重构优化，目标是简化代码、遵循 AI SDK 最佳实践、减少自造轮子。

## Glossary

- **AI_SDK**: Vercel AI SDK，提供 LLM 集成的标准化工具
- **UIMessage**: AI SDK 定义的前端消息格式规范
- **Data_Stream_Protocol**: AI SDK 的流式数据传输协议
- **DeepSeek_Provider**: `@ai-sdk/deepseek` 官方 provider 包
- **Tool**: AI SDK 中的工具调用机制
- **CoreMessage**: AI SDK 内部使用的消息格式

## Requirements

### Requirement 1: 使用 @ai-sdk/deepseek 官方 Provider

**User Story:** As a developer, I want to use the official DeepSeek provider, so that I can simplify model configuration and get better type safety.

#### Acceptance Criteria

1. THE System SHALL replace `@ai-sdk/openai` with `@ai-sdk/deepseek` for DeepSeek model access
2. THE System SHALL remove multi-provider switching logic (openai, dashscope) and only support DeepSeek
3. THE System SHALL use `deepseek('deepseek-chat')` instead of `createOpenAI().chat('deepseek-chat')`
4. THE System SHALL simplify `getAIModel()` function to a single-line DeepSeek initialization

### Requirement 2: 简化消息格式转换

**User Story:** As a developer, I want to simplify message format conversion, so that I can reduce code complexity and potential bugs.

#### Acceptance Criteria

1. WHEN the miniprogram sends messages, THE System SHALL use AI SDK's standard `UIMessage` format
2. THE System SHALL use `convertToModelMessages()` from AI SDK to convert UIMessage to CoreMessage
3. THE System SHALL remove the manual message format conversion logic (~100 lines)
4. THE System SHALL remove support for legacy `tool-invocation` format (only support AI SDK v6 format)

### Requirement 3: 简化 Tool 类型定义

**User Story:** As a developer, I want to simplify Tool type definitions, so that I can leverage AI SDK's built-in type inference.

#### Acceptance Criteria

1. THE System SHALL use `tool()` function's built-in type inference for parameters
2. THE System SHALL remove manual `AskPreferenceResult` interface definitions
3. THE System SHALL use `typeof schema.static` for parameter types
4. THE System SHALL let AI SDK infer return types from `execute` function

### Requirement 4: 使用 maxSteps 替代手动步数检查

**User Story:** As a developer, I want to use AI SDK's built-in maxSteps, so that I can simplify the stopWhen logic.

#### Acceptance Criteria

1. THE System SHALL use `maxSteps: 5` parameter instead of manual step count check in `stopWhen`
2. THE System SHALL keep `stopWhen` only for `askPreference` tool detection
3. THE System SHALL simplify `stopWhen` callback to a single condition check

### Requirement 5: 简化 Token Usage 获取

**User Story:** As a developer, I want to simplify token usage retrieval, so that I can remove compatibility code for different providers.

#### Acceptance Criteria

1. THE System SHALL use `event.usage` directly in `onFinish` callback
2. THE System SHALL remove fallback logic for `totalUsage`, `inputTokens`, `outputTokens`
3. THE System SHALL rely on DeepSeek provider's standardized usage format

### Requirement 6: 小程序端消息格式标准化

**User Story:** As a developer, I want the miniprogram to send standard UIMessage format, so that the API can use AI SDK's built-in conversion.

#### Acceptance Criteria

1. WHEN sending messages, THE Miniprogram SHALL format messages as `{ role: 'user' | 'assistant', content: string, parts?: UIMessagePart[] }`
2. THE Miniprogram SHALL include tool call history in `parts` array using AI SDK v6 format
3. THE Miniprogram SHALL remove legacy `tool-invocation` format support
4. THE Miniprogram SHALL use `tool-{toolName}` format for tool parts

### Requirement 7: 移除废弃代码

**User Story:** As a developer, I want to remove deprecated code, so that I can reduce maintenance burden.

#### Acceptance Criteria

1. THE System SHALL remove `parseTextStream()` function (legacy compatibility)
2. THE System SHALL remove `parseAIResponse()` function (legacy JSON parsing)
3. THE System SHALL remove `SYSTEM_PROMPT_TEST` constant (test mode prompt)
4. THE System SHALL remove multi-provider configuration in `getAIModel()`
