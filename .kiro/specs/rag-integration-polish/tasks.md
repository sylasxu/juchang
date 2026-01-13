# Implementation Plan: RAG Integration Polish

## Overview

本实现计划完善 RAG 语义搜索功能，包括：用户兴趣向量闭环、边界情况处理、重试机制、以及前端 SDK 重新生成。

## Tasks

- [x] 1. Embedding 生成重试机制 (P3)
  - [x] 1.1 添加重试工具函数
    - 修改 `apps/api/src/modules/ai/rag/utils.ts`
    - 添加 `sleep()` 辅助函数
    - 添加 `generateEmbeddingWithRetry()` 函数
    - 配置：maxRetries=2, initialDelayMs=1000, multiplier=2
    - 失败时返回 null（不抛异常）
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 2. RAG 搜索降级处理 (P3)
  - [x] 2.1 添加 location-only 降级搜索
    - 修改 `apps/api/src/modules/ai/rag/search.ts`
    - 添加 `searchByLocationOnly()` 函数
    - 使用 PostGIS 距离排序，不使用向量相似度
    - _Requirements: 3.2_

  - [x] 2.2 更新 search() 使用重试和降级
    - 修改 `apps/api/src/modules/ai/rag/search.ts` 的 `search()` 函数
    - 使用 `generateEmbeddingWithRetry()` 替代 `generateEmbedding()`
    - 如果向量生成失败，降级到 `searchByLocationOnly()`
    - 无兴趣向量时跳过 MaxSim boost（不报错）
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 3. 用户参与活动后更新兴趣向量 (P1)
  - [x] 3.1 添加兴趣向量更新函数
    - 修改 `apps/api/src/modules/activities/activity.service.ts`
    - 添加 `updateUserInterestVector()` 内部函数
    - 从活动提取 embedding 并调用 `addInterestVector()`
    - 如果活动无 embedding，静默跳过
    - _Requirements: 2.1, 2.2, 2.4_

  - [x] 3.2 集成到 joinActivity
    - 修改 `apps/api/src/modules/activities/activity.service.ts` 的 `joinActivity()` 函数
    - 在成功报名后异步调用 `updateUserInterestVector()`
    - 使用 `.catch()` 捕获错误，不阻塞主流程
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 4. 活动更新时重新索引 (P1)
  - [x] 4.1 添加 updateActivity 函数
    - 修改 `apps/api/src/modules/activities/activity.service.ts`
    - 添加 `updateActivity()` 函数
    - 检测语义字段变更（title, description, type, startAt）
    - 异步调用 `indexActivity()` 重新索引
    - _Requirements: 5.1, 5.2, 5.3_

- [ ] 5. 前端 SDK 重新生成 (P0)
  - [ ] 5.1 运行 SDK 生成命令
    - 执行 `bun run gen:api`（需要先启动 API 服务器）
    - 验证生成的 SDK 包含最新类型
    - _Requirements: 1.1, 1.2_

- [ ] 6. Final Checkpoint
  - 验证 RAG 搜索在各种边界情况下的行为
  - 验证 joinActivity 后兴趣向量更新
  - 验证 SDK 生成成功

## Notes

- 任务按依赖顺序排列，需要顺序执行
- 根据项目规范，不包含测试任务
- 所有代码使用纯函数，禁止 class
- 使用 TypeBox 而非 Zod
- 使用 Bun 而非 npm/yarn
- 向量维度：智谱 embedding-3 是 1024 维
- 兴趣向量最多 3 个，FIFO 策略
