# Implementation Tasks

## Task 1: 删除 Agent 抽象层和 Orchestrator

- [x] 1.1 删除 `agent/agent.ts`
- [x] 1.2 删除 `agent/executor.ts`
- [x] 1.3 删除 `agent/runtime.ts`
- [x] 1.4 删除 `agent/streaming.ts`
- [x] 1.5 删除 `agent/types.ts`
- [x] 1.6 删除 `agent/` 目录
- [x] 1.7 删除 `orchestrator.ts`
- [x] 1.8 更新 `ai/index.ts` 移除 agent 和 orchestrator 导出
- _Requirements: 1.1, 1.2, 1.3_

---

## Task 2: 删除 RAG 模块和语义检索

- [x] 2.1 删除 `rag/retriever.ts`
- [x] 2.2 删除 `rag/types.ts`
- [x] 2.3 删除 `rag/` 目录
- [x] 2.4 删除 `memory/semantic.ts`
- [x] 2.5 更新 `memory/index.ts` 移除 semantic 导出
- [x] 2.6 在 `prompts/xiaoju-v39.ts` 添加 ACTIVITY_GUIDE 活动引导知识
- _Requirements: 2.1, 2.2, 2.3, 2.4_

---

## Task 3: 精简 Processors 模块

- [x] 3.1 删除 `processors/pipeline.ts`
- [x] 3.2 删除 `processors/types.ts`
- [x] 3.3 删除 `processors/context-injector.ts`
- [x] 3.4 删除 `processors/history-loader.ts`
- [x] 3.5 删除 `processors/token-limiter.ts`
- [x] 3.6 重写 `processors/ai-pipeline.ts` 移除语义检索依赖，简化为纯函数
- [x] 3.7 更新 `processors/index.ts` 只导出 processAIContext
- _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

---

## Task 4: 清理 Workflow 模块（保留核心）

- [x] 4.1 删除 `workflow/preference-flow.ts`（与 broker 重叠）
- [x] 4.2 更新 `workflow/index.ts` 导出 broker, draft-flow, match-flow, workflow
- _Requirements: 3.5_

---

## Task 5: 接入 Broker Mode 到主流程

- [x] 5.1 在 `ai.service.ts` 导入 broker 相关函数
- [x] 5.2 在意图分类后添加 Broker 检查逻辑
- [x] 5.3 实现 `handleBrokerFlow` 函数处理结构化追问
- [x] 5.4 实现追问完成后调用 createPartnerIntent
- _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6_

---

## Task 6: 接入 Evals 实时评估

- [x] 6.1 在 `evals/runner.ts` 添加 `evaluateResponseQuality` 简化评估函数
- [x] 6.2 在 `ai.service.ts` 的 `onFinish` 中异步调用评估
- [x] 6.3 低分响应记录警告日志
- _Requirements: 4.1, 4.2, 4.3, 4.4_

---

## Task 7: 更新导出和编译验证

- [x] 7.1 更新 `ai/index.ts` 清理所有已删除模块的导出
- [x] 7.2 运行 `bun run build` 确保 TypeScript 编译通过
- [x] 7.3 修复编译错误（如有）
- _Requirements: 6.1, 6.2, 6.3_
