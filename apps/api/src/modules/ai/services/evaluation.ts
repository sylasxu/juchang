/**
 * AI Tool 调用评估模块
 * 
 * 基于 Evaluator-Optimizer 模式，在 Tool 执行后进行质量评估
 * 只对高价值操作（createActivityDraft, refineDraft）进行评估
 * 
 * @see https://sdk.vercel.ai/docs/ai-sdk-core/generating-structured-data
 */

import { generateObject } from 'ai';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { t } from 'elysia';
import { toJsonSchema } from '@juchang/utils';

// ==========================================
// 评估 Schema 定义
// ==========================================

/**
 * 草稿评估 Schema
 */
const draftEvaluationSchema = t.Object({
  intentMatch: t.Boolean({ description: '用户意图是否匹配 createActivityDraft Tool' }),
  fieldCompleteness: t.Object({
    hasTitle: t.Boolean({ description: '标题是否存在且包含 Emoji' }),
    hasType: t.Boolean({ description: '活动类型是否正确' }),
    hasLocationHint: t.Boolean({ description: 'locationHint 是否有实际内容（非"待定"）' }),
    hasValidTime: t.Boolean({ description: '时间是否合理（未来时间）' }),
  }),
  qualityScore: t.Number({ minimum: 1, maximum: 10, description: '整体质量评分 1-10' }),
  toneMatch: t.Boolean({ description: '语气是否接地气（非装逼）' }),
  issues: t.Array(t.String(), { description: '发现的问题列表' }),
  suggestions: t.Array(t.String(), { description: '改进建议' }),
});

type DraftEvaluation = typeof draftEvaluationSchema.static;

/**
 * 通用 Tool 评估 Schema
 */
const toolEvaluationSchema = t.Object({
  intentMatch: t.Boolean({ description: '用户意图是否匹配所调用的 Tool' }),
  qualityScore: t.Number({ minimum: 1, maximum: 10, description: '整体质量评分 1-10' }),
  issues: t.Array(t.String(), { description: '发现的问题列表' }),
});

type ToolEvaluation = typeof toolEvaluationSchema.static;

// ==========================================
// 评估器实现
// ==========================================

/**
 * 获取评估用的 AI 模型（低温度，更一致）
 */
function getEvaluationModel() {
  const deepseek = createDeepSeek({
    apiKey: process.env.DEEPSEEK_API_KEY || '',
  });
  return deepseek('deepseek-chat');
}

/**
 * 需要评估的 Tool 列表
 */
const TOOLS_TO_EVALUATE = ['createActivityDraft', 'refineDraft'];

/**
 * 判断是否需要评估
 */
export function shouldEvaluate(toolName: string): boolean {
  return TOOLS_TO_EVALUATE.includes(toolName);
}

/**
 * 评估草稿创建/修改的质量
 */
export async function evaluateDraftTool(
  userInput: string,
  toolName: string,
  toolArgs: unknown,
  toolResult: unknown
): Promise<DraftEvaluation> {
  const { object } = await generateObject({
    model: getEvaluationModel(),
    schema: toJsonSchema(draftEvaluationSchema) as any,
    temperature: 0,
    system: `你是小橘 AI 的质量评估专家。评估 Tool 调用是否正确响应了用户意图。

评估标准：
1. 意图匹配：用户说"想约火锅"应该调用 createActivityDraft，不是 exploreNearby
2. 字段完整：title 必须有 Emoji，locationHint 不能是空的"待定"
3. 时间合理：startAt 必须是未来时间
4. 语气接地气：summary 不能太装逼，要像朋友帮忙约局`,
    prompt: `评估这次 Tool 调用：

用户输入: "${userInput}"
调用的 Tool: ${toolName}
参数: ${JSON.stringify(toolArgs, null, 2)}
结果: ${JSON.stringify(toolResult, null, 2)}

请评估并返回结构化结果。`,
  });

  return object as DraftEvaluation;
}

/**
 * 评估通用 Tool 调用
 */
export async function evaluateToolCall(
  userInput: string,
  toolName: string,
  toolArgs: unknown,
  toolResult: unknown
): Promise<ToolEvaluation> {
  const { object } = await generateObject({
    model: getEvaluationModel(),
    schema: toJsonSchema(toolEvaluationSchema) as any,
    temperature: 0,
    system: `你是小橘 AI 的质量评估专家。评估 Tool 调用是否正确响应了用户意图。`,
    prompt: `评估这次 Tool 调用：

用户输入: "${userInput}"
调用的 Tool: ${toolName}
参数: ${JSON.stringify(toolArgs, null, 2)}
结果: ${JSON.stringify(toolResult, null, 2)}

请评估意图是否匹配，给出质量评分和问题列表。`,
  });

  return object as ToolEvaluation;
}

// ==========================================
// 评估结果类型
// ==========================================

export interface EvaluationResult {
  toolName: string;
  passed: boolean;
  score: number;
  evaluation: DraftEvaluation | ToolEvaluation;
  timestamp: string;
}

/**
 * 执行评估并返回标准化结果
 */
export async function runEvaluation(
  userInput: string,
  toolName: string,
  toolArgs: unknown,
  toolResult: unknown
): Promise<EvaluationResult> {
  const isDraftTool = toolName === 'createActivityDraft' || toolName === 'refineDraft';
  
  const evaluation = isDraftTool
    ? await evaluateDraftTool(userInput, toolName, toolArgs, toolResult)
    : await evaluateToolCall(userInput, toolName, toolArgs, toolResult);
  
  // 通过标准：评分 >= 7 且意图匹配
  const passed = evaluation.qualityScore >= 7 && evaluation.intentMatch;
  
  return {
    toolName,
    passed,
    score: evaluation.qualityScore,
    evaluation,
    timestamp: new Date().toISOString(),
  };
}

// ==========================================
// 评估阈值配置
// ==========================================

export const EVALUATION_CONFIG = {
  /** 质量评分通过阈值 */
  QUALITY_THRESHOLD: 7,
  /** 最大重试次数 */
  MAX_RETRIES: 1,
  /** 是否启用评估（可通过环境变量控制） */
  ENABLED: process.env.AI_EVALUATION_ENABLED !== 'false',
};
