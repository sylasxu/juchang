# Design Document

## Overview

本设计文档描述如何重构 AI 模块以遵循 Vercel AI SDK 最佳实践，主要改进包括：

1. **使用官方 DeepSeek Provider** - 替换 `@ai-sdk/openai` 为 `@ai-sdk/deepseek`
2. **简化消息格式转换** - 使用 `convertToModelMessages()` 替代手动转换
3. **简化 Tool 类型** - 利用 AI SDK 内置类型推导
4. **使用 maxSteps** - 替代手动步数检查
5. **清理废弃代码** - 移除遗留兼容代码
6. **Workflow Pattern 评估** - 基于 Anthropic 最佳实践评估当前架构

## Architecture

### 当前架构问题

```
┌─────────────────────────────────────────────────────────────┐
│                    当前实现问题                              │
├─────────────────────────────────────────────────────────────┤
│  1. 使用 @ai-sdk/openai 模拟 DeepSeek（需要 .chat() hack）   │
│  2. 手动消息格式转换（~100 行代码）                          │
│  3. 支持多种 provider（openai, deepseek, dashscope）        │
│  4. 手动定义 Tool Result 类型                               │
│  5. 手动步数检查 + stopWhen                                 │
│  6. 兼容旧版 tool-invocation 格式                           │
└─────────────────────────────────────────────────────────────┘
```

### 目标架构

```
┌─────────────────────────────────────────────────────────────┐
│                    优化后架构                                │
├─────────────────────────────────────────────────────────────┤
│  API 层 (apps/api)                                          │
│  ├── @ai-sdk/deepseek - 官方 provider                       │
│  ├── convertToModelMessages() - 标准消息转换                 │
│  ├── maxSteps: 5 - 内置步数限制                             │
│  └── tool() 类型推导 - 无需手动定义 Result 类型              │
│                                                              │
│  小程序层 (apps/miniprogram)                                 │
│  ├── UIMessage 格式 - 标准消息格式                          │
│  └── tool-{toolName} parts - AI SDK v6 格式                 │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. DeepSeek Provider 配置

```typescript
// apps/api/src/modules/ai/ai.service.ts

// 之前
import { createOpenAI } from '@ai-sdk/openai';

function getAIModel() {
  const provider = process.env.AI_PROVIDER || 'deepseek';
  switch (provider) {
    case 'openai': // ...
    case 'deepseek':
      const deepseekClient = createOpenAI({
        baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
        apiKey: process.env.DEEPSEEK_API_KEY || '',
      });
      return deepseekClient.chat('deepseek-chat');
    case 'dashscope': // ...
  }
}

// 之后
import { createDeepSeek } from '@ai-sdk/deepseek';

const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY || '',
});

function getAIModel() {
  return deepseek('deepseek-chat');
}
```

### 2. 消息格式转换简化

```typescript
// 之前：手动转换 (~100 行)
const aiMessages: Array<{
  role: 'user' | 'assistant' | 'tool';
  content: unknown;
}> = [];

for (const m of messages) {
  if (m.parts && Array.isArray(m.parts)) {
    // 收集 text parts
    const textParts = m.parts.filter(...);
    // 收集 tool-invocation parts (旧格式)
    const toolInvocationParts = m.parts.filter(...);
    // 收集 tool-{toolName} parts (新格式)
    const toolUIParts = m.parts.filter(...);
    // 合并两种格式...
    // 处理 assistant 消息中的 tool calls...
    // ...
  }
}

// 之后：使用 AI SDK 内置转换
import { convertToModelMessages } from 'ai';

const aiMessages = convertToModelMessages(messages);
```

### 3. Tool 类型简化

```typescript
// 之前：手动定义 Result 类型
export interface AskPreferenceResult {
  success: boolean;
  widgetType: 'widget_ask_preference';
  questionType: 'location' | 'type';
  question: string;
  options: Array<{ label: string; value: string }>;
  allowSkip: boolean;
  collectedInfo?: { location?: string; type?: string };
  error?: string;
}

export function askPreferenceTool(userId: string | null) {
  return tool<AskPreferenceParams, AskPreferenceResult>({
    // ...
    execute: async (params): Promise<AskPreferenceResult> => {
      // ...
    },
  });
}

// 之后：让 AI SDK 推导类型
export function askPreferenceTool(userId: string | null) {
  return tool({
    description: '...',
    parameters: jsonSchema<AskPreferenceParams>(toJsonSchema(askPreferenceSchema)),
    execute: async (params) => {
      // 返回类型自动推导
      return {
        success: true,
        widgetType: 'widget_ask_preference' as const,
        questionType: params.questionType,
        question: params.question,
        options: params.options,
        allowSkip: params.allowSkip ?? true,
        collectedInfo: params.collectedInfo,
      };
    },
  });
}
```

### 4. maxSteps 替代手动检查

```typescript
// 之前
const result = streamText({
  // ...
  stopWhen: (event) => {
    // 手动检查步数
    if (event.steps.length >= 5) return true;
    
    // 检查 askPreference
    const lastStep = event.steps[event.steps.length - 1];
    if (lastStep?.toolCalls) {
      const hasAskPreference = lastStep.toolCalls.some(
        (tc) => tc.toolName === 'askPreference'
      );
      if (hasAskPreference) return true;
    }
    return false;
  },
});

// 之后
const result = streamText({
  // ...
  maxSteps: 5, // 内置步数限制
  stopWhen: (event) => {
    // 只检查 askPreference
    const lastStep = event.steps.at(-1);
    return lastStep?.toolCalls?.some(tc => tc.toolName === 'askPreference') ?? false;
  },
});
```

### 5. Token Usage 简化

```typescript
// 之前
onFinish: async (event) => {
  const eventUsage = (event as any).totalUsage || event.usage;
  totalUsage = {
    promptTokens: eventUsage?.promptTokens ?? eventUsage?.inputTokens ?? 0,
    completionTokens: eventUsage?.completionTokens ?? eventUsage?.outputTokens ?? 0,
    totalTokens: eventUsage?.totalTokens ?? 0,
  };
}

// 之后
onFinish: async ({ usage }) => {
  totalUsage = {
    promptTokens: usage.promptTokens,
    completionTokens: usage.completionTokens,
    totalTokens: usage.totalTokens,
  };
}
```

### 6. 小程序消息格式标准化

```typescript
// apps/miniprogram/src/utils/sse-request.ts

// 之前：简单格式
const allMessages = [
  ...messages,
  { role: 'user' as const, content: message },
];

// 之后：UIMessage 格式（支持 tool call history）
interface UIMessage {
  role: 'user' | 'assistant';
  content: string;
  parts?: UIMessagePart[];
}

interface UIMessagePart {
  type: string;
  // text part
  text?: string;
  // tool part (AI SDK v6 格式)
  toolCallId?: string;
  toolName?: string;
  input?: unknown;
  output?: unknown;
  state?: 'call' | 'output-available';
}

// 小程序发送消息时，需要包含完整的对话历史（含 tool calls）
```

## Data Models

### UIMessage 格式（AI SDK 标准）

```typescript
// AI SDK v6 UIMessage 格式
interface UIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  parts?: UIMessagePart[];
}

// Text Part
interface TextPart {
  type: 'text';
  text: string;
}

// Tool Part (AI SDK v6 格式)
interface ToolPart {
  type: `tool-${string}`; // e.g., 'tool-createActivityDraft'
  toolCallId: string;
  toolName: string;
  input: unknown;
  output?: unknown;
  state: 'call' | 'output-available';
}
```

### 移除的类型

```typescript
// 移除：手动定义的 Result 接口
// - AskPreferenceResult
// - CreateActivityDraftResult
// - ExploreNearbyResult
// - PublishActivityResult
// - RefineDraftResult

// 移除：旧版消息格式
// - tool-invocation part 格式
// - MessagePart 接口（手动定义）
// - InputMessage 接口（手动定义）
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

基于需求分析，以下是可测试的正确性属性：

### Property 1: UIMessage 格式一致性

*For any* 小程序发送的消息，消息格式应符合 AI SDK UIMessage 规范：包含 `role`（'user' | 'assistant'）、`content`（string）、可选的 `parts` 数组。

**Validates: Requirements 2.1, 6.1**

### Property 2: Tool Part 格式一致性

*For any* 包含 tool call 的消息，tool parts 应使用 AI SDK v6 格式：`type` 为 `tool-{toolName}`，包含 `toolCallId`、`toolName`、`input`、`output`（可选）、`state`。

**Validates: Requirements 6.2, 6.4**

### Property 3: 消息转换等价性

*For any* 有效的 UIMessage 数组，使用 `convertToModelMessages()` 转换后的 CoreMessage 数组应能被 AI SDK 正确处理，且不丢失 tool call 历史信息。

**Validates: Requirements 2.2, 2.3**

## Error Handling

### 1. DeepSeek API 错误

当 DeepSeek API 返回错误时：
- 记录错误日志
- 返回友好的错误消息给用户
- 不暴露 API 密钥或内部错误详情

### 2. 消息格式错误

当收到不符合 UIMessage 格式的消息时：
- 尝试降级处理（只提取 content 字段）
- 记录警告日志
- 继续处理请求

### 3. Tool 执行错误

当 Tool 执行失败时：
- 返回 `{ success: false, error: string }` 格式
- 前端根据 `success` 字段显示错误 UI

## Testing Strategy

### 单元测试

1. **DeepSeek Provider 初始化**
   - 验证 provider 正确初始化
   - 验证模型名称正确

2. **消息格式转换**
   - 验证 UIMessage 到 CoreMessage 的转换
   - 验证 tool call history 正确传递

### 属性测试

使用 fast-check 进行属性测试：

1. **UIMessage 格式属性测试**
   - 生成随机 UIMessage
   - 验证格式符合规范

2. **Tool Part 格式属性测试**
   - 生成随机 tool call
   - 验证 part 格式正确

### 集成测试

1. **端到端 AI Chat 测试**
   - 测试完整的消息发送和响应流程
   - 验证 tool call 和 result 正确处理

### 测试框架

- 单元测试：Vitest
- 属性测试：fast-check


## Admin 端配套改动

### 现状分析

Admin 端已经使用了正确的 AI SDK 模式：
- ✅ 使用 `@ai-sdk/react` 的 `useChat` hook
- ✅ 使用 `UIMessage` 类型
- ✅ 使用 `DefaultChatTransport` 发送请求
- ✅ 使用 `isToolUIPart` 和 `getToolName` 处理 tool parts

### 需要的改动

**无需改动** - Admin 端已经符合 AI SDK 最佳实践。

API 端的改动对 Admin 端透明，因为：
1. `useChat` hook 自动处理消息格式转换
2. `DefaultChatTransport` 自动发送正确格式的请求
3. Tool parts 格式已经是 AI SDK v6 标准格式

## 小程序端配套改动

### 现状分析

小程序端使用自定义的 SSE 请求和 Data Stream Parser：
- `apps/miniprogram/src/utils/sse-request.ts` - SSE 请求封装
- `apps/miniprogram/src/utils/data-stream-parser.ts` - Data Stream 解析器
- `apps/miniprogram/src/stores/home.ts` - 消息状态管理

### 问题

1. **消息格式不完整**：当前只发送 `{ role, content }` 简单格式，不包含 tool call history
2. **不支持多轮对话上下文**：AI 无法看到之前的 tool calls 和 results

### 需要的改动

#### 1. 更新 SSE Request 消息格式

```typescript
// apps/miniprogram/src/utils/sse-request.ts

// 之前
const allMessages = [
  ...messages,
  { role: 'user' as const, content: message },
];

// 之后：支持完整的 UIMessage 格式
interface UIMessagePart {
  type: string;
  text?: string;
  toolCallId?: string;
  toolName?: string;
  input?: unknown;
  output?: unknown;
  state?: 'call' | 'output-available';
}

interface UIMessage {
  role: 'user' | 'assistant';
  content: string;
  parts?: UIMessagePart[];
}

// sendAIChat 需要接收完整的消息历史
export function sendAIChat(
  messages: UIMessage[],  // 改为接收完整消息数组
  callbacks: SSECallbacks = {},
  options: { location?: { lat: number; lng: number }; draftContext?: DraftContext } = {}
): SSEController {
  return sseRequest('/ai/chat', {
    body: {
      messages,  // 直接发送完整消息数组
      source: 'miniprogram',
      ...options,
    },
  }, callbacks);
}
```

#### 2. 更新 Home Store 消息格式

```typescript
// apps/miniprogram/src/stores/home.ts

// 扩展 ChatMessage 类型以支持 parts
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  type: MessageType;
  content: unknown;
  parts?: UIMessagePart[];  // 新增：tool call history
  activityId: string | null;
  createdAt: string;
}

// addAIMessage 需要保存 tool parts
addAIMessage: (message) => {
  const aiMessage: ChatMessage = {
    // ...
    parts: message.parts,  // 保存 tool parts
  };
  // ...
}
```

#### 3. 更新 Home Page 发送逻辑

```typescript
// apps/miniprogram/pages/home/index.ts

startAIParse(text: string, draftContext?: DraftContext) {
  const homeStore = useHomeStore.getState();
  
  // 构建完整的消息历史（包含 tool parts）
  const messages: UIMessage[] = homeStore.messages.map(m => ({
    role: m.role,
    content: typeof m.content === 'object' && 'text' in m.content 
      ? (m.content as { text: string }).text 
      : '',
    parts: m.parts,  // 包含 tool call history
  }));
  
  // 添加当前用户消息
  messages.push({ role: 'user', content: text });
  
  // 发送请求
  this.sseController = sendAIChat(messages, callbacks, options);
}
```

#### 4. 更新 Data Stream Parser 保存 Tool Parts

```typescript
// apps/miniprogram/src/utils/data-stream-parser.ts

// 在 handleToolCall 和 handleToolResult 中构建 parts 格式
private handleToolCall(content: string): void {
  const data = JSON.parse(content) as ToolCall;
  
  // 构建 AI SDK v6 格式的 tool part
  const toolPart: UIMessagePart = {
    type: `tool-${data.toolName}`,
    toolCallId: data.toolCallId,
    toolName: data.toolName,
    input: data.args,
    state: 'call',
  };
  
  this.state.toolParts.push(toolPart);
  this.callbacks.onToolCall?.(data);
}

private handleToolResult(content: string): void {
  const data = JSON.parse(content) as ToolResult;
  
  // 更新对应的 tool part
  const toolPart = this.state.toolParts.find(p => p.toolCallId === data.toolCallId);
  if (toolPart) {
    toolPart.output = data.result;
    toolPart.state = 'output-available';
  }
  
  this.callbacks.onToolResult?.(data);
}
```

## 依赖更新

### API 端

```json
// apps/api/package.json
{
  "dependencies": {
    "@ai-sdk/deepseek": "^1.0.0",  // 新增
    // "@ai-sdk/openai": "^3.0.2",  // 移除
    "ai": "^6.0.5",
  }
}
```

### 安装命令

```bash
cd apps/api
bun remove @ai-sdk/openai
bun add @ai-sdk/deepseek
```

## 测试策略

### 单元测试

1. **DeepSeek Provider 初始化**
   - 验证 provider 正确初始化
   - 验证模型名称正确

2. **消息格式转换**
   - 验证 UIMessage 到 CoreMessage 的转换
   - 验证 tool call history 正确传递

### 属性测试

使用 fast-check 进行属性测试：

1. **UIMessage 格式属性测试**
   - 生成随机 UIMessage
   - 验证格式符合规范

2. **Tool Part 格式属性测试**
   - 生成随机 tool call
   - 验证 part 格式正确

### 集成测试

1. **端到端 AI Chat 测试**
   - 测试完整的消息发送和响应流程
   - 验证 tool call 和 result 正确处理

### 测试框架

- 单元测试：Vitest
- 属性测试：fast-check
