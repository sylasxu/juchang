# Requirements Document

## Introduction

本需求文档定义了 RAG 语义搜索功能的集成完善工作，包括验证、用户兴趣向量闭环、以及边界情况处理。

## Glossary

- **RAG**: Retrieval-Augmented Generation，检索增强生成
- **MaxSim**: Maximum Similarity，用户兴趣向量与查询向量的最大相似度策略
- **Interest_Vector**: 用户参与活动后保存的活动向量，用于个性化推荐
- **Embedding**: 文本向量化表示，使用智谱 embedding-3 模型生成 1024 维向量

## Requirements

### Requirement 1: 前端 SDK 重新生成

**User Story:** As a developer, I want to regenerate the frontend SDK, so that the miniprogram can use the latest API types.

#### Acceptance Criteria

1. WHEN the developer runs `bun run gen:api`, THE System SHALL generate updated Orval SDK for miniprogram
2. THE Generated_SDK SHALL include the latest ExploreData type with matchReason field

### Requirement 2: 用户参与活动后更新兴趣向量

**User Story:** As a user, I want the system to remember my activity preferences, so that future recommendations are more personalized.

#### Acceptance Criteria

1. WHEN a user successfully joins an activity, THE System SHALL extract the activity's embedding vector
2. WHEN the activity has an embedding, THE System SHALL call addInterestVector to save it to user's workingMemory
3. THE System SHALL limit interest vectors to maximum 3 per user (FIFO)
4. IF the activity has no embedding, THEN THE System SHALL skip interest vector update without error

### Requirement 3: RAG 搜索边界情况处理

**User Story:** As a user, I want the search to handle edge cases gracefully, so that I always get a reasonable response.

#### Acceptance Criteria

1. WHEN no activities match the search criteria, THE System SHALL return an empty results array with a friendly message
2. WHEN embedding generation fails, THE System SHALL log the error and fall back to location-only search
3. WHEN the database query fails, THE System SHALL return a user-friendly error message
4. WHEN the user has no interest vectors, THE System SHALL skip MaxSim boost without error

### Requirement 4: Embedding 生成重试机制

**User Story:** As a system operator, I want embedding generation to be resilient, so that temporary API failures don't cause data loss.

#### Acceptance Criteria

1. WHEN embedding API call fails, THE System SHALL retry up to 2 times with exponential backoff
2. WHEN all retries fail, THE System SHALL log the error and continue without embedding
3. THE System SHALL use 1 second initial delay with 2x multiplier for backoff

### Requirement 5: 活动更新时重新索引

**User Story:** As an activity creator, I want my activity updates to be reflected in search results, so that users see accurate information.

#### Acceptance Criteria

1. WHEN an activity's title, description, type, or startAt is updated, THE System SHALL re-index the activity
2. THE Re-indexing SHALL be asynchronous and not block the update response
3. IF re-indexing fails, THEN THE System SHALL log the error but not fail the update
