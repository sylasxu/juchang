# Design Document: RAG Integration Polish

## Overview

本设计文档描述 RAG 语义搜索功能的集成完善工作，包括用户兴趣向量闭环、边界情况处理、以及重试机制。

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Activity Service                             │
├─────────────────────────────────────────────────────────────────┤
│  joinActivity()                                                  │
│       │                                                          │
│       ├─── 1. 更新 participants 表                               │
│       │                                                          │
│       └─── 2. 异步更新用户兴趣向量 ──────────────────────────────┤
│                    │                                             │
│                    ▼                                             │
│            ┌─────────────────┐                                   │
│            │ addInterestVector│ ← 从活动提取 embedding           │
│            │ (memory/working) │                                   │
│            └─────────────────┘                                   │
│                    │                                             │
│                    ▼                                             │
│            ┌─────────────────┐                                   │
│            │ users.workingMemory │ ← 最多保存 3 个向量 (FIFO)    │
│            └─────────────────┘                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     RAG Search Flow                              │
├─────────────────────────────────────────────────────────────────┤
│  search()                                                        │
│       │                                                          │
│       ├─── 1. generateEmbedding (with retry)                     │
│       │         │                                                │
│       │         ├─── 成功 → 继续                                 │
│       │         └─── 失败 → 降级到 location-only 搜索            │
│       │                                                          │
│       ├─── 2. Hard Filter (SQL)                                  │
│       │                                                          │
│       ├─── 3. Soft Rank (Vector)                                 │
│       │                                                          │
│       ├─── 4. MaxSim Boost (if user has interest vectors)        │
│       │         │                                                │
│       │         └─── 无兴趣向量 → 跳过，不报错                    │
│       │                                                          │
│       └─── 5. 返回结果                                           │
│                 │                                                │
│                 ├─── 有结果 → 返回 ScoredActivity[]              │
│                 └─── 无结果 → 返回空数组 + 友好提示               │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Activity Service 扩展

```typescript
// activity.service.ts - joinActivity 扩展

export async function joinActivity(activityId: string, userId: string): Promise<{ id: string }> {
  // ... 现有逻辑 ...
  
  // v4.5: 异步更新用户兴趣向量 (不阻塞主流程)
  updateUserInterestVector(userId, activityId).catch(err => {
    console.error('Failed to update interest vector:', err);
  });
  
  return { id: participant.id };
}

/**
 * 更新用户兴趣向量
 * 从活动提取 embedding 并保存到用户 workingMemory
 */
async function updateUserInterestVector(userId: string, activityId: string): Promise<void> {
  // 1. 获取活动的 embedding
  const [activity] = await db
    .select({ embedding: activities.embedding })
    .from(activities)
    .where(eq(activities.id, activityId))
    .limit(1);
  
  // 2. 如果没有 embedding，跳过
  if (!activity?.embedding) {
    return;
  }
  
  // 3. 添加到用户兴趣向量
  await addInterestVector(userId, {
    activityId,
    embedding: activity.embedding,
    participatedAt: new Date(),
    feedback: 'positive',
  });
}
```

### 2. Embedding 重试机制

```typescript
// rag/utils.ts - 带重试的 embedding 生成

const RETRY_CONFIG = {
  maxRetries: 2,
  initialDelayMs: 1000,
  multiplier: 2,
};

export async function generateEmbeddingWithRetry(text: string): Promise<number[] | null> {
  let lastError: Error | null = null;
  let delay = RETRY_CONFIG.initialDelayMs;
  
  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      return await getZhipuEmbedding(text);
    } catch (error) {
      lastError = error as Error;
      logger.warn('Embedding generation failed', { 
        attempt: attempt + 1, 
        maxRetries: RETRY_CONFIG.maxRetries + 1,
        error: lastError.message,
      });
      
      if (attempt < RETRY_CONFIG.maxRetries) {
        await sleep(delay);
        delay *= RETRY_CONFIG.multiplier;
      }
    }
  }
  
  logger.error('All embedding retries failed', { error: lastError?.message });
  return null; // 返回 null 表示失败，调用方可以降级处理
}
```

### 3. RAG Search 降级处理

```typescript
// rag/search.ts - search 函数增强

export async function search(params: HybridSearchParams): Promise<ScoredActivity[]> {
  const { semanticQuery, filters, ... } = params;
  
  // 1. 尝试生成查询向量（带重试）
  let queryVector: number[] | null = null;
  try {
    queryVector = await generateEmbeddingWithRetry(semanticQuery);
  } catch (error) {
    logger.warn('Query embedding failed, falling back to location-only search', { error });
  }
  
  // 2. 如果向量生成失败，降级到 location-only 搜索
  if (!queryVector) {
    return searchByLocationOnly(filters);
  }
  
  // 3. 正常的向量搜索流程...
  // ...
}

/**
 * 降级搜索：仅基于位置
 */
async function searchByLocationOnly(filters: SearchFilters): Promise<ScoredActivity[]> {
  // 使用 PostGIS 距离排序，不使用向量相似度
  const results = await db.execute(sql`
    SELECT a.*, 
           ST_Distance(...) as distance
    FROM activities a
    WHERE ${buildFilterConditions(filters)}
    ORDER BY distance ASC
    LIMIT 10
  `);
  
  return results.map(r => ({
    activity: mapRowToActivity(r),
    score: 1 - (r.distance / 10000), // 距离转换为 0-1 分数
    distance: r.distance,
  }));
}
```

### 4. 活动更新时重新索引

```typescript
// activity.service.ts - updateActivity 扩展

export async function updateActivity(
  activityId: string,
  userId: string,
  updates: Partial<CreateActivityRequest>
): Promise<void> {
  // ... 现有更新逻辑 ...
  
  // v4.5: 如果更新了影响语义的字段，重新索引
  const semanticFields = ['title', 'description', 'type', 'startAt'];
  const needsReindex = semanticFields.some(field => field in updates);
  
  if (needsReindex) {
    const activity = await getActivityById(activityId);
    if (activity) {
      indexActivity(activity as any).catch(err => {
        console.error('Failed to re-index activity:', err);
      });
    }
  }
}
```

## Data Models

### InterestVector 结构

```typescript
interface InterestVector {
  activityId: string;
  embedding: number[];  // 1024 维
  participatedAt: Date;
  feedback?: 'positive' | 'neutral' | 'negative';
}

// 存储在 users.workingMemory.interestVectors
// 最多 3 个，FIFO 策略
```

### 重试配置

```typescript
interface RetryConfig {
  maxRetries: number;      // 2
  initialDelayMs: number;  // 1000
  multiplier: number;      // 2
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do.*

### Property 1: Interest Vector Limit Invariant

*For any* user, the number of interest vectors in their workingMemory SHALL never exceed 3.

**Validates: Requirements 2.3**

### Property 2: Join Activity Updates Interest Vector

*For any* activity with a non-null embedding, when a user joins that activity, the activity's embedding SHALL be added to the user's interest vectors.

**Validates: Requirements 2.1, 2.2**

### Property 3: Activity Update Triggers Re-indexing

*For any* activity update that modifies title, description, type, or startAt, the system SHALL trigger an asynchronous re-indexing of that activity.

**Validates: Requirements 5.1**

## Error Handling

| 场景 | 处理方式 |
|------|---------|
| Embedding API 超时 | 重试 2 次，指数退避 |
| Embedding API 全部失败 | 降级到 location-only 搜索 |
| 数据库查询失败 | 返回友好错误消息 |
| 活动无 embedding | 跳过兴趣向量更新 |
| 用户无兴趣向量 | 跳过 MaxSim boost |

## Testing Strategy

### Unit Tests

- 验证 `addInterestVector` 的 FIFO 逻辑
- 验证重试机制的延迟计算
- 验证降级搜索的结果格式

### Integration Tests

- 验证 joinActivity 后兴趣向量更新
- 验证 updateActivity 后重新索引
- 验证 search 在各种边界情况下的行为
