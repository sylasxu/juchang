# Requirements Document

## Introduction

精简 AI 模块架构，删除未使用的过度设计模块（RAG、Agent 抽象层），**保留并接入有价值的 Workflow 模块**，让代码更精简、更聚焦于产品价值。

核心原则：
- RAG 是"大海捞针"，我们是"按图索骥"——删除
- Workflow 支持全流程思考（草稿确认、匹配确认、找搭子追问）——保留并接入
- Vercel AI SDK 已足够，自研 Agent 抽象层 ROI 为负——删除

## Glossary

- **AI_Service**: AI 对话核心服务 (`ai.service.ts`)
- **Broker_Mode**: 找搭子结构化追问流程
- **Draft_Flow**: 草稿确认工作流
- **Match_Flow**: 匹配确认工作流
- **Evals**: AI 响应质量评估系统

## Requirements

### Requirement 1: 删除未使用的 Agent 抽象层

**User Story:** As a developer, I want to remove unused agent abstraction, so that the codebase is simpler.

#### Acceptance Criteria

1. WHEN the cleanup is complete, THE System SHALL have removed the `agent/` directory
2. WHEN the cleanup is complete, THE System SHALL have removed `orchestrator.ts`
3. THE System SHALL continue to use Vercel AI SDK directly in `ai.service.ts`

### Requirement 2: 删除 RAG 模块和语义检索

**User Story:** As a developer, I want to remove RAG module because we're doing "按图索骥" not "大海捞针".

#### Acceptance Criteria

1. WHEN the cleanup is complete, THE System SHALL have removed the `rag/` directory
2. WHEN the cleanup is complete, THE System SHALL have removed `memory/semantic.ts`
3. THE `ai-pipeline.ts` SHALL be simplified to remove semantic retriever dependency
4. THE System SHALL use Prompt 内置知识 for activity guidance instead of RAG

### Requirement 3: 保留并接入 Workflow 模块

**User Story:** As a user, I want structured workflows for activity creation and partner matching, so that I have a guided experience.

#### Acceptance Criteria

1. THE System SHALL keep `workflow/workflow.ts` (通用状态机引擎)
2. THE System SHALL keep `workflow/broker.ts` (找搭子追问流程)
3. THE System SHALL keep `workflow/draft-flow.ts` (草稿确认流程)
4. THE System SHALL keep `workflow/match-flow.ts` (匹配确认流程)
5. WHEN the cleanup is complete, THE System SHALL have removed `workflow/preference-flow.ts` (与 broker 重叠)
6. THE `ai.service.ts` SHALL integrate Broker Mode for partner intent

### Requirement 4: 接入 Evals 自我评估

**User Story:** As a user, I want the AI to self-evaluate its responses for quality improvement.

#### Acceptance Criteria

1. WHEN AI generates a response, THE AI_Service SHALL asynchronously evaluate response quality
2. WHEN the score is below threshold (0.6), THE AI_Service SHALL log a warning
3. THE Scorer SHALL evaluate intent match accuracy
4. THE Scorer SHALL evaluate tool call correctness

### Requirement 5: 精简 Processors 模块

**User Story:** As a developer, I want to simplify processors to remove RAG dependency.

#### Acceptance Criteria

1. THE System SHALL keep `processors/ai-pipeline.ts` (简化版，移除语义检索)
2. WHEN the cleanup is complete, THE System SHALL have removed `processors/pipeline.ts`
3. WHEN the cleanup is complete, THE System SHALL have removed `processors/types.ts`
4. WHEN the cleanup is complete, THE System SHALL have removed `processors/context-injector.ts`
5. WHEN the cleanup is complete, THE System SHALL have removed `processors/history-loader.ts`
6. WHEN the cleanup is complete, THE System SHALL have removed `processors/token-limiter.ts`

### Requirement 6: 更新导出和文档

**User Story:** As a developer, I want documentation to reflect the simplified architecture.

#### Acceptance Criteria

1. THE `ai/index.ts` SHALL only export used modules
2. THE `workflow/index.ts` SHALL export broker, draft-flow, match-flow
3. THE System SHALL pass TypeScript compilation
