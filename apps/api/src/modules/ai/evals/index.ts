/**
 * Evals Module - 评估系统
 * 
 * 提供 AI 系统的评估和质量保证功能
 * 
 * 使用示例：
 * ```typescript
 * import { 
 *   runEval, 
 *   createDataset, 
 *   defaultScorers,
 *   printEvalReport 
 * } from './evals';
 * 
 * // 创建数据集
 * const dataset = createDataset('my_test', [
 *   { input: '帮我组个火锅局', expectedIntent: 'create' },
 *   { input: '附近有什么活动', expectedIntent: 'explore' },
 * ]);
 * 
 * // 运行评估
 * const result = await runEval(
 *   { dataset, scorers: defaultScorers },
 *   async (input) => {
 *     // 调用 AI 系统
 *     return { output: '...', intent: 'create' };
 *   }
 * );
 * 
 * // 打印报告
 * printEvalReport(result);
 * ```
 */

// Types
export type {
  EvalSample,
  EvalResult,
  Scorer,
  Dataset,
  EvalRunConfig,
  EvalRunResult,
} from './types';

export { DEFAULT_EVAL_CONFIG } from './types';

// Scorers
export {
  intentScorer,
  toolCallScorer,
  relevanceScorer,
  toneScorer,
  contextScorer,
  lengthScorer,
  defaultScorers,
  getScorer,
  getScorerNames,
} from './scorers';

// Runner
export {
  runEval,
  createDataset,
  xiaojuEvalDataset,
  printEvalReport,
} from './runner';

