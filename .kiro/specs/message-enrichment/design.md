# Design Document: Message Enrichment

## Overview

在 API 端实现消息预处理增强服务，在用户消息发送给 AI Agent 之前，自动注入上下文信息，提高意图识别准确率。

核心设计原则：
1. **透明增强** - 增强后的消息只用于 AI 处理，不修改存储的原始消息
2. **可组合** - 多个增强器可以链式组合
3. **可追踪** - trace 模式下可以看到每个增强步骤
4. **Claude 4.x Best Practices** - XML 结构化 Prompt

---

## Architecture

AI SDK 提供了 **Language Model Middleware** 机制，通过 `wrapLanguageModel` + `transformParams` 在消息发送给 LLM 之前进行预处理。

```
┌─────────────────────────────────────────────────────────────┐
│                      streamText()                            │
├─────────────────────────────────────────────────────────────┤
│  model: wrapLanguageModel({                                  │
│    model: deepseek('deepseek-chat'),                        │
│    middleware: messageEnrichmentMiddleware                   │
│  })                                                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              messageEnrichmentMiddleware                     │
├─────────────────────────────────────────────────────────────┤
│  transformParams: ({ params }) => {                          │
│    // 1. 增强 params.prompt (messages)                       │
│    // 2. 注入 XML 结构化上下文                                │
│    return { ...params, prompt: enrichedMessages };           │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
```

### 简化方案（推荐）

考虑到当前项目已有完善的 `streamChat` 实现，可以采用更简单的方案：

```typescript
// 方案 A：使用 Middleware（完整方案）
const enrichedModel = wrapLanguageModel({
  model: deepseek('deepseek-chat'),
  middleware: createMessageEnrichmentMiddleware(context),
});

// 方案 B：直接在 streamChat 中增强（简化方案，推荐）
export async function streamChat(request: StreamChatRequest) {
  // 1. 增强消息（在调用 streamText 之前）
  const { enrichedMessages, contextXml } = await enrichMessages(
    request.messages,
    enrichmentContext
  );
  
  // 2. 构建增强后的 System Prompt
  const systemPrompt = buildXmlSystemPrompt(promptContext, contextXml);
  
  // 3. 调用 streamText（使用原有逻辑）
  const result = streamText({
    model: getAIModel(),
    system: systemPrompt,
    messages: enrichedMessages,
    // ...
  });
}
```

**推荐方案 B**，因为：
- 更简单，不需要引入新的 middleware 概念
- 与现有 trace 模式兼容
- 更容易调试和测试

---

## 2026-era Prompt Architecture (Claude 4.x Best Practices)

基于 Anthropic Claude 4.x 官方 Prompt Engineering 最佳实践重构 System Prompt。

### 核心原则（来自官方文档）

| 原则 | 说明 | 应用到小聚 |
|-----|------|-----------|
| **Be explicit** | 明确说明期望的输出，不要假设模型会"above and beyond" | 明确要求调用 Tool，不要只用文字回复 |
| **Add context** | 解释为什么需要这样做，帮助模型理解目标 | 解释"草稿优先"的原因：避免反问打断用户 |
| **Be vigilant with examples** | 示例要精确匹配期望行为 | Few-Shot 示例要覆盖边界情况 |
| **Default to action** | Claude 4.x 倾向于建议而非行动，需要明确指示 | 使用 `<default_to_action>` 指令 |
| **Parallel tool calls** | Claude 4.x 擅长并行工具调用 | 可以同时查询位置和用户偏好 |

### XML 结构化 Prompt

Claude 官方推荐使用 XML 标签组织 prompt，提高解析准确率：

```xml
<!-- 1. 角色定义 -->
<system_role>
你叫"小聚 (XiaoJu)"，是"聚场"小程序的 AI 组局主理人。
</system_role>

<!-- 2. 人设特征（提供 context/motivation） -->
<persona>
你是一个在重庆生活了 10 年的资深玩家 🎮
你是一位极其高效的活动主理人，办事利索不拖泥带水。
你说话喜欢用 Emoji，语气热情但不聒噪。
你讨厌官话套话，喜欢直接办事。
你像一个靠谱的朋友帮用户张罗局。

这种人设很重要，因为用户希望快速组局，不想被反复追问细节。
</persona>

<!-- 3. 动态上下文（由 Message Enrichment 注入） -->
<context>
<current_time>2026-01-04 周日 14:30</current_time>
<user_location lat="29.5630" lng="106.5516">观音桥</user_location>
<user_nickname>小明</user_nickname>
</context>

<!-- 4. 草稿上下文（多轮对话时注入） -->
<draft_context activity_id="xxx">
<title>🍲 观音桥火锅局</title>
<location>观音桥北城天街</location>
<location_hint>负一楼美食层</location_hint>
<time>2026-01-05 19:00</time>
<participants>4</participants>
</draft_context>

<!-- 5. 消息增强提示（由 Enricher 注入） -->
<enrichment_hints>
<time_resolved original="明晚" resolved="2026-01-05 19:00" />
<location_context>用户当前在观音桥附近</location_context>
<user_preference type="food">美食类活动</user_preference>
</enrichment_hints>

<!-- 6. 核心指令（Claude 4.x 需要明确指令） -->
<instructions>
你的核心任务是接收用户的自然语言指令，通过 Tool 调用返回结构化数据。

1. 必须使用 Tool 响应用户请求，不要只用文字回复
2. 草稿优先：永不反问，先猜后改（因为反问会打断用户的组局热情）
3. Tool Calling First：意图识别通过 Tool 实现
4. 意图分类优先级：创建意图 > 探索意图
</instructions>

<!-- 7. 默认行动指令（Claude 4.x 官方推荐） -->
<default_to_action>
默认直接调用 Tool 实现用户请求，而不是只提供建议。
如果用户意图不明确，推断最可能的意图并直接行动。
使用 Tool 获取缺失的信息，而不是猜测或反问用户。
</default_to_action>

<!-- 8. 约束条件 -->
<constraints>
禁止在回复中出现用户未提及的具体地点名称。
askPreference 调用后必须立即停止，等待用户回复。
最多 2 轮询问，避免过度打扰用户。
如果 userLocation.name 为空，使用"你附近"而非具体地名。
</constraints>

<!-- 9. 意图分类规则（带优先级） -->
<intent_classification>
<rule name="想找组合" priority="1">
  如果包含"想找" → 探索意图（用户想找已有的活动）
</rule>
<rule name="探索关键词" priority="2">
  如果包含"有什么"、"找"、"附近"、"推荐"、"看看" → 探索意图
</rule>
<rule name="创建关键词" priority="3">
  如果包含"想"（非"想找"）、"约"、"组"、"搞"、"整"、"来"、"一起" → 创建意图
</rule>
<rule name="默认" priority="4">
  无法判断 → 询问用户或默认探索
</rule>
</intent_classification>

<!-- 10. 输出格式 -->
<output_format>
必须通过 Tool 调用返回结构化 JSON 数据。
不要用纯文字描述你会做什么，直接调用 Tool。
</output_format>

<!-- 11. Few-Shot 示例（Claude 4.x 对示例非常敏感，需要精确） -->
<examples>
<example name="创建意图-标准">
  <user_input>明晚吃火锅</user_input>
  <tool_call name="createActivityDraft">
    {"title": "🍲 火锅局", "type": "food", "startAt": "2026-01-05T19:00:00"}
  </tool_call>
</example>

<example name="探索意图-想找">
  <user_input>想找个火锅局</user_input>
  <tool_call name="exploreNearby">
    {"type": "food", "center": {"lat": 29.5630, "lng": 106.5516}}
  </tool_call>
</example>

<example name="探索意图-信息不完整">
  <user_input>有什么好玩的活动</user_input>
  <tool_call name="askPreference">
    {"questionType": "location", "question": "你想看哪个地方的活动呢？ 🗺️"}
  </tool_call>
  <note>调用后停止，等待用户回复</note>
</example>

<example name="边界案例-输入错别字">
  <user_input>想迟火锅</user_input>
  <note>纠错："迟"应为"吃"，直接行动不反问</note>
  <tool_call name="createActivityDraft">
    {"title": "🍲 火锅局", "type": "food"}
  </tool_call>
</example>
</examples>

<!-- 12. 语气风格（提供正反例） -->
<tone>
温暖、专业、办事利索。像一个靠谱的朋友帮你张罗局。

正确示例：
- "帮你把局组好了！就在你附近，离地铁口 200 米 🎉"
- "收到，正在帮你整理... ✨"
- "今天的 AI 额度用完了，明天再来吧～ 😊"

错误示例（避免这些）：
- "已为您构建全息活动契约"（太装逼）
- "正在解析您的意图向量..."（太机器人）
- "解析失败，请检查输入格式。"（太冷漠）
</tone>
```

### Claude 4.x 特定优化

#### 1. Tool 触发优化

Claude 4.x 对 system prompt 非常敏感。避免使用过于激进的语言：

```xml
<!-- ❌ 避免（可能导致过度触发） -->
<rule>CRITICAL: You MUST use this tool when...</rule>

<!-- ✅ 推荐（更自然的表述） -->
<rule>Use this tool when the user expresses intent to create an activity.</rule>
```

#### 2. 并行 Tool 调用

Claude 4.x 擅长并行执行工具。可以同时查询多个信息：

```xml
<use_parallel_tool_calls>
如果需要调用多个工具且它们之间没有依赖关系，请并行调用。
例如：同时查询用户偏好和附近活动数量。
</use_parallel_tool_calls>
```

#### 3. 避免 "think" 关键词

当未启用 extended thinking 时，Claude 4.x 对 "think" 敏感。使用替代词：

```xml
<!-- ❌ 避免 -->
<instruction>Think about the user's intent...</instruction>

<!-- ✅ 推荐 -->
<instruction>Consider the user's intent...</instruction>
<instruction>Evaluate the user's request...</instruction>
```

#### 4. Interleaved Thinking（交错思考）

对于需要在 Tool 调用后反思的场景：

```xml
<interleaved_thinking>
在收到 Tool 结果后，仔细评估结果质量并确定最佳下一步。
使用你的推理来规划和迭代，然后采取最佳行动。
</interleaved_thinking>
```

### Claude 4.x Best Practices 总结

| 最佳实践 | 官方说明 | 应用到小聚 |
|---------|---------|-----------|
| **Be explicit** | Claude 4.x 需要明确指令，不会自动"above and beyond" | 明确要求调用 Tool |
| **Add context** | 解释为什么需要这样做 | 解释"草稿优先"的原因 |
| **Default to action** | 使用 `<default_to_action>` 让模型主动行动 | ✅ 已采用 |
| **Avoid aggressive language** | 避免 "CRITICAL"、"MUST" 等过激词汇 | 使用自然语言描述规则 |
| **Parallel tool calls** | Claude 4.x 擅长并行工具调用 | 可并行查询位置和偏好 |
| **Precise examples** | 示例要精确匹配期望行为 | 包含边界案例（输入错别字） |

---

## Components and Interfaces

### MessageEnricher Interface

```typescript
interface EnrichmentContext {
  userId: string | null;
  location?: { lat: number; lng: number; name?: string };
  draftContext?: {
    activityId: string;
    currentDraft: ActivityDraftForPrompt;
  };
  conversationHistory: Array<{ role: string; content: string }>;
  currentTime: Date;
  /** 启用深度思考模式（需要模型支持，如 DeepSeek-R1） */
  enableDeepThinking?: boolean;
}

interface EnrichmentResult {
  originalMessage: string;
  enrichedMessage: string;
  appliedEnrichments: string[];
  /** XML 格式的上下文注入块 */
  contextInjectionXml?: string;
}

interface MessageEnricher {
  name: string;
  enrich(message: string, context: EnrichmentContext): EnrichmentResult;
}
```

### AI SDK 集成（简化方案）

采用直接在 `streamChat` 中增强的方案，避免引入额外的 middleware 复杂度：

```typescript
// apps/api/src/modules/ai/ai.service.ts

export async function streamChat(request: StreamChatRequest) {
  const { messages, userId, location, draftContext, trace } = request;
  
  // 1. 构建增强上下文
  const enrichmentContext: EnrichmentContext = {
    userId,
    location: location ? { lat: location[1], lng: location[0], name: locationName } : undefined,
    draftContext,
    conversationHistory: [], // 从 messages 提取
    currentTime: new Date(),
  };
  
  // 2. 增强消息（在调用 streamText 之前）
  const { enrichedMessages, contextXml, enrichmentTrace } = await enrichMessages(
    messages,
    enrichmentContext
  );
  
  // 3. 构建 XML 结构化 System Prompt（v36）
  const systemPrompt = buildXmlSystemPrompt(promptContext, contextXml);
  
  // 4. 转换消息格式
  const aiMessages = await convertToModelMessages(enrichedMessages);
  
  // 5. 调用 streamText
  const result = streamText({
    model: getAIModel(),
    system: systemPrompt,
    messages: aiMessages,
    tools: tools as any,
    // ...
  });
  
  // 6. trace 模式下输出增强信息
  if (trace) {
    // 在 trace 数据中包含 enrichmentTrace
  }
}
```

**备选方案**：如果未来需要更复杂的 middleware 链，可以使用 `wrapLanguageModel`：

```typescript
import { wrapLanguageModel } from 'ai';

// 组合多个 middleware
const enrichedModel = wrapLanguageModel({
  model: deepseek('deepseek-chat'),
  middleware: {
    transformParams: async ({ params }) => {
      const { contextXml } = await enrichMessages(params.prompt, context);
      return {
        ...params,
        system: injectContextToSystemPrompt(params.system, contextXml),
      };
    },
  },
});
```

---

## Enricher Implementations

### 1. DraftContextEnricher

检测修改意图关键词，注入草稿上下文。

```typescript
const MODIFICATION_KEYWORDS = ['改', '换', '加', '减', '调', '变'];

function enrichWithDraftContext(
  message: string, 
  draftContext: DraftContext | undefined
): EnrichmentResult {
  if (!draftContext) {
    return { originalMessage: message, enrichedMessage: message, appliedEnrichments: [] };
  }
  
  const hasModificationIntent = MODIFICATION_KEYWORDS.some(k => message.includes(k));
  if (!hasModificationIntent) {
    return { originalMessage: message, enrichedMessage: message, appliedEnrichments: [] };
  }
  
  // 生成 XML 格式的上下文
  const contextXml = `
<draft_context activity_id="${draftContext.activityId}">
  <title>${draftContext.currentDraft.title}</title>
  <location>${draftContext.currentDraft.locationName}</location>
  <location_hint>${draftContext.currentDraft.locationHint}</location_hint>
  <time>${draftContext.currentDraft.startAt}</time>
  <participants>${draftContext.currentDraft.maxParticipants}</participants>
</draft_context>`;
  
  return {
    originalMessage: message,
    enrichedMessage: message,
    appliedEnrichments: ['draft_context'],
    contextInjectionXml: contextXml,
  };
}
```

### 2. TimeExpressionEnricher

解析相对时间表达，生成 XML 时间提示。

```typescript
const TIME_EXPRESSIONS: Record<string, (now: Date) => Date> = {
  '今天': (now) => now,
  '明天': (now) => addDays(now, 1),
  '后天': (now) => addDays(now, 2),
  '大后天': (now) => addDays(now, 3),
  '今晚': (now) => setHours(now, 19),
  '明晚': (now) => setHours(addDays(now, 1), 19),
  '周末': (now) => getNextWeekend(now),
  '下周末': (now) => getNextWeekend(addDays(now, 7)),
  // 周一到周日...
};

function enrichWithTimeContext(
  message: string,
  currentTime: Date
): EnrichmentResult {
  const matchedExpressions: Array<{ original: string; resolved: Date }> = [];
  
  for (const [expr, resolver] of Object.entries(TIME_EXPRESSIONS)) {
    if (message.includes(expr)) {
      matchedExpressions.push({
        original: expr,
        resolved: resolver(currentTime),
      });
    }
  }
  
  if (matchedExpressions.length === 0) {
    return { originalMessage: message, enrichedMessage: message, appliedEnrichments: [] };
  }
  
  // 生成 XML 格式的时间提示
  const timeHintsXml = matchedExpressions.map(({ original, resolved }) => 
    `<time_resolved original="${original}" resolved="${formatDateTime(resolved)}" />`
  ).join('\n  ');
  
  const contextXml = `
<enrichment_hints>
  <current_time>${formatDateTime(currentTime)}</current_time>
  ${timeHintsXml}
</enrichment_hints>`;
  
  return {
    originalMessage: message,
    enrichedMessage: message,
    appliedEnrichments: ['time_expression'],
    contextInjectionXml: contextXml,
  };
}
```

### 3. LocationContextEnricher

检测位置相关词汇，注入用户位置。

```typescript
const LOCATION_KEYWORDS = ['附近', '这边', '我这里', '这附近', '周围'];

function enrichWithLocationContext(
  message: string,
  location?: { lat: number; lng: number; name?: string }
): EnrichmentResult {
  if (!location) {
    return { originalMessage: message, enrichedMessage: message, appliedEnrichments: [] };
  }
  
  const hasLocationKeyword = LOCATION_KEYWORDS.some(k => message.includes(k));
  if (!hasLocationKeyword) {
    return { originalMessage: message, enrichedMessage: message, appliedEnrichments: [] };
  }
  
  const locationName = location.name || '当前位置';
  const contextXml = `
<user_location lat="${location.lat.toFixed(4)}" lng="${location.lng.toFixed(4)}">
  ${locationName}
</user_location>`;
  
  return {
    originalMessage: message,
    enrichedMessage: message,
    appliedEnrichments: ['location_context'],
    contextInjectionXml: contextXml,
  };
}
```

### 4. PronounResolver

解析指代词，替换为具体实体。

```typescript
const PRONOUNS = ['那个', '这个', '它', '那边', '那里'];

function resolvePronouns(
  message: string,
  conversationHistory: Array<{ role: string; content: string; activityTitle?: string; locationName?: string }>
): EnrichmentResult {
  let enrichedMessage = message;
  const appliedEnrichments: string[] = [];
  
  const recentActivity = findRecentActivity(conversationHistory);
  const recentLocation = findRecentLocation(conversationHistory);
  
  for (const pronoun of PRONOUNS) {
    if (message.includes(pronoun)) {
      if (recentActivity && isActivityContext(message)) {
        enrichedMessage = enrichedMessage.replace(pronoun, `"${recentActivity}"`);
        appliedEnrichments.push('pronoun_activity');
      } else if (recentLocation && isLocationContext(message)) {
        enrichedMessage = enrichedMessage.replace(pronoun, recentLocation);
        appliedEnrichments.push('pronoun_location');
      }
    }
  }
  
  return {
    originalMessage: message,
    enrichedMessage,
    appliedEnrichments,
  };
}
```

### 5. UserPreferenceEnricher

为推荐类查询注入用户偏好。

```typescript
const RECOMMENDATION_KEYWORDS = ['推荐', '有什么', '找个', '想找'];

async function enrichWithUserPreference(
  message: string,
  userId: string | null
): Promise<EnrichmentResult> {
  if (!userId) {
    return { originalMessage: message, enrichedMessage: message, appliedEnrichments: [] };
  }
  
  const hasRecommendationIntent = RECOMMENDATION_KEYWORDS.some(k => message.includes(k));
  if (!hasRecommendationIntent) {
    return { originalMessage: message, enrichedMessage: message, appliedEnrichments: [] };
  }
  
  // 检查是否已指定类型
  const hasTypeSpecified = ['火锅', '电影', '打球', '桌游', '麻将'].some(t => message.includes(t));
  if (hasTypeSpecified) {
    return { originalMessage: message, enrichedMessage: message, appliedEnrichments: [] };
  }
  
  const preferredType = await getUserPreferredActivityType(userId);
  if (!preferredType) {
    return { originalMessage: message, enrichedMessage: message, appliedEnrichments: [] };
  }
  
  const typeLabels: Record<string, string> = {
    food: '美食',
    entertainment: '娱乐',
    sports: '运动',
    boardgame: '桌游',
  };
  
  const contextXml = `
<user_preference>
  <preferred_type value="${preferredType}">${typeLabels[preferredType] || preferredType}</preferred_type>
</user_preference>`;
  
  return {
    originalMessage: message,
    enrichedMessage: message,
    appliedEnrichments: ['user_preference'],
    contextInjectionXml: contextXml,
  };
}
```

---

## Pipeline Orchestrator

```typescript
interface EnrichmentPipelineResult {
  enrichedMessages: UIMessage[];
  contextXml: string;
  enrichmentTrace: EnrichmentTrace[];
}

async function enrichMessages(
  messages: UIMessage[],
  context: EnrichmentContext
): Promise<EnrichmentPipelineResult> {
  const enrichmentTrace: EnrichmentTrace[] = [];
  const contextXmlParts: string[] = [];
  
  const enrichedMessages = await Promise.all(messages.map(async (msg) => {
    if (msg.role !== 'user') return msg;
    
    const content = extractTextContent(msg);
    let currentMessage = content;
    const appliedEnrichments: string[] = [];
    
    // 1. Draft Context
    const draftResult = enrichWithDraftContext(currentMessage, context.draftContext);
    currentMessage = draftResult.enrichedMessage;
    appliedEnrichments.push(...draftResult.appliedEnrichments);
    if (draftResult.contextInjectionXml) {
      contextXmlParts.push(draftResult.contextInjectionXml);
    }
    
    // 2. Time Expression
    const timeResult = enrichWithTimeContext(currentMessage, context.currentTime);
    currentMessage = timeResult.enrichedMessage;
    appliedEnrichments.push(...timeResult.appliedEnrichments);
    if (timeResult.contextInjectionXml) {
      contextXmlParts.push(timeResult.contextInjectionXml);
    }
    
    // 3. Location Context
    const locationResult = enrichWithLocationContext(currentMessage, context.location);
    currentMessage = locationResult.enrichedMessage;
    appliedEnrichments.push(...locationResult.appliedEnrichments);
    if (locationResult.contextInjectionXml) {
      contextXmlParts.push(locationResult.contextInjectionXml);
    }
    
    // 4. Pronoun Resolution
    const pronounResult = resolvePronouns(currentMessage, context.conversationHistory);
    currentMessage = pronounResult.enrichedMessage;
    appliedEnrichments.push(...pronounResult.appliedEnrichments);
    
    // 5. User Preference
    const preferenceResult = await enrichWithUserPreference(currentMessage, context.userId);
    currentMessage = preferenceResult.enrichedMessage;
    appliedEnrichments.push(...preferenceResult.appliedEnrichments);
    if (preferenceResult.contextInjectionXml) {
      contextXmlParts.push(preferenceResult.contextInjectionXml);
    }
    
    enrichmentTrace.push({
      originalMessage: content,
      enrichedMessage: currentMessage,
      appliedEnrichments,
    });
    
    return {
      ...msg,
      content: currentMessage,
    };
  }));
  
  // 合并所有 XML 上下文
  const contextXml = contextXmlParts.length > 0
    ? `<context_injection>\n${contextXmlParts.join('\n')}\n</context_injection>`
    : '';
  
  return { enrichedMessages, contextXml, enrichmentTrace };
}

/**
 * 将 XML 上下文注入到 System Prompt
 */
function injectContextToSystemPrompt(
  systemPrompt: string,
  contextXml: string
): string {
  if (!contextXml) return systemPrompt;
  
  // 在 # Context 部分后注入 XML
  const contextMarker = '# Context';
  const insertIndex = systemPrompt.indexOf(contextMarker);
  
  if (insertIndex === -1) {
    // 如果没有 Context 标记，追加到末尾
    return `${systemPrompt}\n\n${contextXml}`;
  }
  
  // 找到 Context 部分的结束位置（下一个 # 标记）
  const nextSectionIndex = systemPrompt.indexOf('\n#', insertIndex + contextMarker.length);
  const insertPosition = nextSectionIndex === -1 
    ? systemPrompt.length 
    : nextSectionIndex;
  
  return (
    systemPrompt.slice(0, insertPosition) +
    '\n\n' + contextXml + '\n' +
    systemPrompt.slice(insertPosition)
  );
}
```

---

## Data Models

```typescript
interface EnrichmentTrace {
  originalMessage: string;
  enrichedMessage: string;
  appliedEnrichments: string[];
}

interface EnrichmentContext {
  userId: string | null;
  location?: { lat: number; lng: number; name?: string };
  draftContext?: {
    activityId: string;
    currentDraft: ActivityDraftForPrompt;
  };
  conversationHistory: Array<{ role: string; content: string }>;
  currentTime: Date;
}

/** 深度思考输出格式 */
interface ReasoningOutput {
  reasoning: string;
  toolCall?: {
    name: string;
    args: unknown;
  };
}

/** Speculative Decoding 状态 */
type SpeculativeStatus = 'thinking' | 'drafting' | 'complete';

interface SpeculativeOutput<T> {
  status: SpeculativeStatus;
  thought?: string;
  partial?: Partial<T>;
  result?: T;
}
```

---

## Correctness Properties

### Property 1: Draft Context Enrichment

*For any* user message containing modification keywords AND an active draft context, the enriched context XML SHALL contain the draft title, location, time, and participant count.

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Time Expression Resolution

*For any* user message containing relative time expressions, the enriched context XML SHALL contain `<time_resolved>` elements with original and resolved timestamps.

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 3: Location Context Injection

*For any* user message containing location keywords AND available location data, the enriched context XML SHALL contain `<user_location>` with coordinates.

**Validates: Requirements 4.1, 4.2**

### Property 4: Location Unavailable Passthrough

*For any* user message containing location keywords BUT no available location data, the enriched message SHALL equal the original message.

**Validates: Requirements 4.3**

### Property 5: Pronoun Resolution Fallback

*For any* user message containing pronouns that cannot be resolved from conversation history, the enriched message SHALL preserve the original pronouns unchanged.

**Validates: Requirements 2.4**

### Property 6: Original Message Preservation

*For any* enrichment operation, the original message stored in conversation history SHALL NOT be modified by the enrichment process.

**Validates: Requirements 6.3**

### Property 7: Trace Output Completeness

*For any* enrichment operation in trace mode, the trace output SHALL contain the original message, enriched message, and list of applied enrichments.

**Validates: Requirements 6.1, 6.2**

---

## Error Handling

1. **Enricher Failure Isolation** - 单个 enricher 失败不影响其他 enricher，返回原始消息
2. **Database Query Timeout** - 用户偏好查询设置 500ms 超时，超时则跳过
3. **Invalid Context** - 上下文数据缺失时优雅降级，不抛异常
4. **XML Escaping** - 用户输入中的特殊字符需要 XML 转义

---

## Testing Strategy

### Unit Tests
- 每个 enricher 的关键词检测
- 时间表达式解析的边界情况
- 指代消解的上下文匹配
- XML 生成格式验证

### Property-Based Tests
- 使用 fast-check 生成随机消息和上下文
- 验证增强后的消息包含预期的上下文信息
- 验证原始消息不被修改

### Integration Tests
- 完整 pipeline 的端到端测试
- trace 模式输出验证
- AI SDK Middleware 集成测试
