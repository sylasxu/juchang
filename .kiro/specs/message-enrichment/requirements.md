# Requirements Document

## Introduction

在 API 端实现消息预处理增强功能，将用户的简洁输入自动拼接上下文信息，生成更完整的消息发送给 AI Agent，提高意图识别准确率和响应质量。

## Glossary

- **Message_Enricher**: 消息增强器，负责在 AI 处理前预处理用户消息
- **Context_Injector**: 上下文注入器，将相关上下文信息注入到用户消息中
- **Draft_Context**: 草稿上下文，当前用户正在编辑的活动草稿信息
- **Conversation_History**: 对话历史，用于理解多轮对话中的指代关系
- **User_Profile**: 用户画像，包含用户偏好、历史活动类型等

## Requirements

### Requirement 1: 草稿上下文增强

**User Story:** As a user editing a draft, I want my short commands like "改成明天" to be understood in context, so that I don't need to repeat the activity details.

#### Acceptance Criteria

1. WHEN a user has an active draft AND sends a modification command, THE Message_Enricher SHALL inject the draft context into the message
2. WHEN the user says "改时间"、"换地方"、"加人", THE Message_Enricher SHALL append the current draft details (title, location, time, participants)
3. WHEN the draft context is injected, THE Message_Enricher SHALL format it as: "[用户正在编辑草稿《{title}》，当前：{location}，{time}，{participants}人] {original_message}"

### Requirement 2: 指代消解

**User Story:** As a user in a multi-turn conversation, I want pronouns like "那个"、"这个"、"它" to be resolved correctly, so that I can speak naturally.

#### Acceptance Criteria

1. WHEN the user message contains pronouns ("那个"、"这个"、"它"、"那边"), THE Message_Enricher SHALL attempt to resolve them from conversation history
2. WHEN a pronoun refers to a previously mentioned activity, THE Message_Enricher SHALL replace it with the activity title
3. WHEN a pronoun refers to a previously mentioned location, THE Message_Enricher SHALL replace it with the location name
4. IF the pronoun cannot be resolved, THE Message_Enricher SHALL leave it unchanged

### Requirement 3: 时间表达标准化

**User Story:** As a user, I want to use natural time expressions like "后天"、"下周末"、"这周五", so that I don't need to specify exact dates.

#### Acceptance Criteria

1. WHEN the user message contains relative time expressions, THE Message_Enricher SHALL append the resolved absolute time
2. THE Message_Enricher SHALL handle: "今天"、"明天"、"后天"、"大后天"、"这周X"、"下周X"、"周末"、"下周末"
3. WHEN time is resolved, THE Message_Enricher SHALL append: "[当前时间: {now}, 用户说的"{relative_time}"指: {absolute_time}]"

### Requirement 4: 位置上下文增强

**User Story:** As a user, I want to say "附近" or "这边" and have the system understand my current location, so that I don't need to specify coordinates.

#### Acceptance Criteria

1. WHEN the user says "附近"、"这边"、"我这里" AND location is available, THE Message_Enricher SHALL append the location context
2. THE Message_Enricher SHALL format location as: "[用户当前位置: {location_name}，坐标: {lat}, {lng}]"
3. WHEN location is not available, THE Message_Enricher SHALL NOT modify the message

### Requirement 5: 用户偏好注入

**User Story:** As a returning user, I want the system to remember my preferences, so that recommendations are personalized.

#### Acceptance Criteria

1. WHEN the user asks for recommendations without specifying type, THE Message_Enricher SHALL inject user's preferred activity type
2. THE Message_Enricher SHALL query user's most frequent activity type from history
3. WHEN preference is injected, THE Message_Enricher SHALL format as: "[用户历史偏好: {preferred_type}类活动]"

### Requirement 6: 增强结果透明

**User Story:** As a developer debugging the system, I want to see what enrichment was applied, so that I can understand AI behavior.

#### Acceptance Criteria

1. WHEN trace mode is enabled, THE Message_Enricher SHALL include enrichment details in the trace output
2. THE trace output SHALL include: original message, enriched message, applied enrichments list
3. THE enrichment process SHALL NOT modify the original message stored in conversation history
