# Implementation Plan: Activity Semantic Search

## Overview

本实现计划将活动语义搜索功能分为 6 个阶段：数据库升级 → RAG 模块 → Agent 封装层 (含 Processors) → Tool 升级 → 脚本和文档 → 清理冗余模块。

**破坏性升级**：本次升级采用 Mastra 风格的 Processors 架构，彻底重构 Agent 调用方式。

## Tasks

- [x] 1. 数据库升级 (Phase 1)
  - [x] 1.1 添加 pgvector 扩展和 embedding 列
    - 创建迁移文件 `packages/db/drizzle/0009_add_embedding.sql`
    - 添加 `CREATE EXTENSION IF NOT EXISTS vector`
    - 添加 `embedding vector(1024)` 列到 activities 表 (智谱 embedding-3 是 1024 维)
    - 创建 HNSW 索引 `activities_embedding_idx`
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 1.2 更新 Drizzle Schema
    - 修改 `packages/db/src/schema/activities.ts`
    - 添加 `embedding: vector('embedding', { dimensions: 1024 })`
    - 添加 `embeddingIndex` 索引定义
    - 运行 `bun run db:push`
    - _Requirements: 11.1, 11.3_

  - [x] 1.3 更新 users.workingMemory 类型
    - 修改 `packages/db/src/schema/users.ts` 中的 EnhancedUserProfile 接口
    - 添加 `interestVectors` 字段定义
    - _Requirements: 11.4_

- [x] 2. RAG 子模块实现 (Phase 2)
  - [x] 2.1 创建 RAG 类型定义
    - 创建 `apps/api/src/modules/ai/rag/types.ts`
    - 定义 HybridSearchParams, ScoredActivity, IndexItem, RagConfig
    - _Requirements: 9.2, 12.2_

  - [x] 2.2 实现 RAG 工具函数
    - 创建 `apps/api/src/modules/ai/rag/utils.ts`
    - 实现 `enrichActivityText()` - 文本富集化 (吸收 enrichment/ 功能)
    - 实现 `inferVibe()` - 氛围推断
    - 实现 `generateEmbedding()` - 向量生成 (调用 getZhipuEmbedding)
    - 实现日期格式化函数 (周一-周日, 早上/下午/晚上/深夜)
    - _Requirements: 2.2, 2.4, 2.6, 2.7_

  - [x] 2.3 实现 RAG 核心服务
    - 创建 `apps/api/src/modules/ai/rag/search.ts`
    - 实现 `indexActivity()` - 索引单个活动
    - 实现 `indexActivities()` - 批量索引
    - 实现 `deleteIndex()` - 删除索引
    - 实现 `search()` - 混合检索 (Hard Filter + Soft Rank)
    - 实现 `generateMatchReason()` - 推荐理由生成
    - _Requirements: 3.1-3.5, 4.1-4.6, 5.1-5.5, 9.5_

  - [x] 2.4 创建 RAG 模块导出
    - 创建 `apps/api/src/modules/ai/rag/index.ts`
    - 导出 search, indexActivity, deleteIndex
    - _Requirements: 9.2, 12.2_

  - [x] 2.5 集成 RAG 到 Activities 模块
    - 修改 `apps/api/src/modules/activities/activities.service.ts`
    - 在 createActivity 后异步调用 indexActivity
    - 在 updateActivity 后异步调用 indexActivity
    - 在 deleteActivity 后调用 deleteIndex
    - _Requirements: 2.1, 2.3, 9.6, 12.5_

- [x] 3. Checkpoint - 验证 RAG 模块
  - 确保 RAG 模块可以正常索引和检索活动
  - 如有问题请询问用户

- [x] 4. Agent 封装层实现 (Phase 3) - Mastra 风格
  - [x] 4.1 创建 Agent 类型定义
    - 创建 `apps/api/src/modules/ai/agent/types.ts`
    - 定义 AgentConfig, RuntimeContext, ChatParams
    - 定义 AgentStreamOptions, AgentGenerateOptions, StepResult
    - 定义 Processor 接口 (processInput, processOutputResult, processOutputStream)
    - _Requirements: 13.2_

  - [x] 4.2 实现 Processors (Mastra 风格)
    - 创建 `apps/api/src/modules/ai/agent/processors.ts`
    - 实现 Input Processors:
      - `inputGuardProcessor` - 输入安全检查
      - `userProfileProcessor` - 用户画像注入 (吸收 processors/ai-pipeline.ts)
      - `tokenLimitProcessor` - Token 限制截断
    - 实现 Output Processors:
      - `outputGuardProcessor` - 输出安全检查
      - `saveHistoryProcessor` - 保存对话历史
      - `extractPreferencesProcessor` - 提取用户偏好
    - 导出 `defaultInputProcessors` 和 `defaultOutputProcessors`
    - _Requirements: 13.5_

  - [x] 4.3 实现 Agent 工厂和预定义配置
    - 创建 `apps/api/src/modules/ai/agent/agents.ts`
    - 实现 `createAgent()` 工厂函数 (支持 inputProcessors/outputProcessors)
    - 定义 5 个预定义 Agent: explorer, creator, partner, manager, chat
    - 实现 `getAgent()` 函数
    - _Requirements: 13.6, 13.7_

  - [x] 4.4 实现上下文构建
    - 创建 `apps/api/src/modules/ai/agent/context.ts`
    - 实现 `buildContext()` - 构建 RuntimeContext
    - _Requirements: 13.5_

  - [x] 4.5 实现意图路由
    - 创建 `apps/api/src/modules/ai/agent/router.ts`
    - 实现 `classifyIntent()` - 委托给现有 intent/classifier
    - _Requirements: 13.5_

  - [x] 4.6 实现 Agent 入口函数
    - 创建 `apps/api/src/modules/ai/agent/chat.ts`
    - 实现 `streamChat()` - 流式对话入口
    - 实现 `generateChat()` - 非流式对话入口
    - 实现 Processors Pipeline:
      1. 执行 inputProcessors (顺序)
      2. 调用 streamText/generateText
      3. 执行 outputProcessors (顺序)
    - _Requirements: 13.3, 13.5_

  - [x] 4.7 创建 Agent 模块导出
    - 创建 `apps/api/src/modules/ai/agent/index.ts`
    - 导出 streamChat, generateChat, getAgent
    - 导出 defaultInputProcessors, defaultOutputProcessors
    - _Requirements: 13.2_

  - [x] 4.8 更新 ai.service.ts 为薄代理
    - 修改 `apps/api/src/modules/ai/ai.service.ts`
    - re-export streamChat, generateChat from agent/chat
    - _Requirements: 13.4_

- [x] 5. Checkpoint - 验证 Agent 封装层
  - 确保 Agent 封装层可以正常处理对话
  - 确保 Processors Pipeline 正确执行
  - 如有问题请询问用户

- [x] 6. Tool 升级 (Phase 4)
  - [x] 6.1 创建 Tool 工厂函数
    - 创建 `apps/api/src/modules/ai/tools/create-tool.ts`
    - 实现 `createTool()` - Mastra 风格 (TypeBox 版本)
    - 实现 `createToolFactory()` - 带 userId 闭包
    - _Requirements: 8.1_

  - [x] 6.2 升级 exploreNearby Tool
    - 修改 `apps/api/src/modules/ai/tools/explore-nearby.ts`
    - 使用 createToolFactory 重构
    - 添加 semanticQuery 参数
    - 调用 RAG service search()
    - 返回 matchReason 字段
    - _Requirements: 8.1-8.6_

- [x] 7. 用户兴趣向量 (MaxSim)
  - [x] 7.1 实现兴趣向量存储
    - 修改 `apps/api/src/modules/ai/memory/working.ts`
    - 实现 `addInterestVector()` - 添加用户兴趣向量
    - 实现 `getInterestVectors()` - 获取用户兴趣向量
    - 限制最多存储 3 个向量
    - _Requirements: 6.1, 6.2, 6.6_

  - [x] 7.2 集成 MaxSim 到 RAG 检索
    - 修改 `apps/api/src/modules/ai/rag/search.ts` 的 search()
    - 实现 MaxSim 策略 (取最大相似度)
    - 实现 20% 排名提升
    - _Requirements: 6.3, 6.4, 6.5_

- [x] 8. 脚本实现 (Phase 5)
  - [x] 8.1 创建 Embedding 回填脚本
    - 创建 `scripts/backfill-embeddings.ts`
    - 实现批量处理 (100 条/批)
    - 实现 --force 和 --dry-run 参数
    - 实现进度日志
    - _Requirements: 7.1-7.6_

  - [x] 8.2 创建数据迁移脚本
    - 创建 `scripts/upgrade-v4.5.ts`
    - 整合数据库升级和 embedding 回填
    - 实现幂等性和 --dry-run 参数
    - _Requirements: 16.1-16.6_

- [x] 9. 文档更新
  - [x] 9.1 更新 TAD.md
    - 添加 RAG 系统章节
    - 添加 Processors 架构说明
    - 更新 AI 模块架构图 (包含 agent/processors.ts)
    - 更新 activities 表 schema (添加 embedding 列，1024 维)
    - 更新 Memory System 章节 (语义回忆已实现)
    - _Requirements: 10.1-10.4, 11.1-11.3, 14.1-14.3_

- [x] 10. 清理冗余模块 (Phase 6) - 破坏性升级
  - [x] 10.1 删除 processors/ 目录
    - 删除 `apps/api/src/modules/ai/processors/` 整个目录
    - 功能已被 `agent/processors.ts` 吸收
    - _Requirements: 17.1_

  - [x] 10.2 删除 enrichment/ 目录
    - 删除 `apps/api/src/modules/ai/enrichment/` 整个目录
    - 功能已被 `rag/utils.ts` 吸收
    - _Requirements: 17.1_

  - [x] 10.3 迁移 services/metrics.ts
    - 将 `apps/api/src/modules/ai/services/metrics.ts` 功能合并到 `observability/metrics.ts`
    - 删除 `services/` 目录
    - 更新所有 import 路径
    - _Requirements: 17.1_

  - [x] 10.4 移除旧搜索逻辑
    - exploreNearby Tool 已升级为使用 RAG 检索
    - 统一使用 RAG 检索
    - _Requirements: 15.2, 17.1-17.4_

  - [x] 10.5 清理兼容代码
    - 更新 ai/index.ts 导出（添加 agent/, rag/ 模块）
    - 添加 processAIContext 兼容函数到 agent/processors.ts
    - _Requirements: 15.6, 17.5_

- [x] 11. Final Checkpoint
  - 所有类型检查通过
  - 冗余目录已删除
  - 如需运行 `bun run gen:api` 重新生成前端 SDK

## Notes

- 任务按依赖顺序排列，需要顺序执行
- 每个 Checkpoint 是验证点，确保前面的任务正确完成
- 根据项目规范，不包含测试任务
- 所有代码使用纯函数，禁止 class
- 使用 TypeBox 而非 Zod
- 使用 Bun 而非 npm/yarn
- **向量维度**：智谱 embedding-3 是 1024 维，不是 1536
- **破坏性升级**：本次升级会删除 processors/, enrichment/, services/ 目录

## 新增文件清单

```
apps/api/src/modules/ai/
├── agent/                        # [NEW] 7 个文件
│   ├── index.ts
│   ├── types.ts
│   ├── agents.ts
│   ├── chat.ts
│   ├── router.ts
│   ├── context.ts
│   └── processors.ts             # [NEW] Mastra 风格 Processors
│
├── rag/                          # [NEW] 4 个文件
│   ├── index.ts
│   ├── search.ts
│   ├── utils.ts
│   └── types.ts
│
└── tools/
    └── create-tool.ts            # [NEW] Tool 工厂
```

## 删除文件清单

```
apps/api/src/modules/ai/
├── processors/                   # [DELETE] 整个目录
│   ├── ai-pipeline.ts
│   └── index.ts
│
├── enrichment/                   # [DELETE] 整个目录
│   ├── enrichers/
│   ├── index.ts
│   ├── pipeline.ts
│   └── types.ts
│
└── services/                     # [DELETE] 整个目录
    ├── evaluation.ts
    └── metrics.ts                # → 移动到 observability/
```
