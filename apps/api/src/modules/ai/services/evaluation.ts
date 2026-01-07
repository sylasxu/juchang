/**
 * AI Tool 调用评估模块 (v3.13)
 * 
 * 基于 Evaluator-Optimizer 模式，在 Tool 执行后进行质量评估
 * 只对高价值操作（createActivityDraft, refineDraft）进行评估
 * 
 * v3.13 更新：
 * - 新增 contextScore（上下文利用度）
 * - 优化评估 Prompt，加入 <thinking> 推理步骤提高准确性
 * - 评估结果包含推理过程（可选展示）
 * 
 * @see https://sdk.vercel.ai/docs/ai-sdk-core/generating-structured-data
 */

import { generateObject, jsonSchema } from 'ai';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { t } from 'elysia';
import { toJsonSchema } from '@juchang/utils';

// ==========================================
// 评估 Schema 定义
// ==========================================

/**
 * 草稿评估 Schema（扩展版 v3.13）
 */
const draftEvaluationSchema = t.Object({
  thinking: t.String({ description: '评估推理过程' }),
  intentMatch: t.Boolean({ description: '用户意图是否匹配 createActivityDraft Tool' }),
  fieldCompleteness: t.Object({
    hasTitle: t.Boolean({ description: '标题是否存在且包含 Emoji' }),
    hasType: t.Boolean({ description: '活动类型是否正确' }),
    hasLocationHint: t.Boolean({ description: 'locationHint 是否有实际内容（非"待定"）' }),
    hasValidTime: t.Boolean({ description: '时间是否合理（未来时间）' }),
  }),
  qualityScore: t.Number({ minimum: 1, maximum: 10, description: '整体质量评分 1-10' }),
  toneScore: t.Number({ minimum: 1, maximum: 5, description: '语气接地气程度 1-5' }),
  relevanceScore: t.Number({ minimum: 1, maximum: 5, description: '响应相关性 1-5' }),
  contextScore: t.Number({ minimum: 1, maximum: 5, description: '上下文利用度 1-5' }),
  issues: t.Array(t.String(), { description: '发现的问题列表' }),
  suggestions: t.Array(t.String(), { description: '改进建议' }),
});

type DraftEvaluation = typeof draftEvaluationSchema.static;

/**
 * 通用 Tool 评估 Schema（扩展版 v3.13）
 */
const toolEvaluationSchema = t.Object({
  thinking: t.String({ description: '评估推理过程' }),
  intentMatch: t.Boolean({ description: '用户意图是否匹配所调用的 Tool' }),
  qualityScore: t.Number({ minimum: 1, maximum: 10, description: '整体质量评分 1-10' }),
  toneScore: t.Number({ minimum: 1, maximum: 5, description: '语气接地气程度 1-5' }),
  relevanceScore: t.Number({ minimum: 1, maximum: 5, description: '响应相关性 1-5' }),
  contextScore: t.Number({ minimum: 1, maximum: 5, description: '上下文利用度 1-5' }),
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
 * 需要评估的 Tool 列表（全部 Tool）
 */
const TOOLS_TO_EVALUATE = [
  'createActivityDraft',
  'refineDraft',
  'getDraft',
  'publishActivity',
  'exploreNearby',
  'getActivityDetail',
  'joinActivity',
  'cancelActivity',
  'getMyActivities',
  'askPreference',
];

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
  toolResult: unknown,
  conversationHistory?: Array<{ role: string; content: string }>
): Promise<DraftEvaluation> {
  // 构建对话历史上下文
  const historyContext = conversationHistory && conversationHistory.length > 0
    ? `\n\n对话历史（最近 ${Math.min(conversationHistory.length, 6)} 轮）：\n${conversationHistory.slice(-6).map(m => `${m.role === 'user' ? '用户' : 'AI'}: ${m.content}`).join('\n')}`
    : '';

  const { object } = await generateObject({
    model: getEvaluationModel(),
    schema: jsonSchema<DraftEvaluation>(toJsonSchema(draftEvaluationSchema)),
    temperature: 0,
    system: `你是小橘 AI 的质量评估专家。评估 Tool 调用是否正确响应了用户意图。

## 评估流程
1. 先在 thinking 字段中详细分析，包括：
   - 用户真正想要什么？
   - Tool 选择是否正确？
   - 参数是否完整合理？
   - 语气是否接地气？
   - 是否正确利用了对话历史？
2. 然后基于分析给出各项评分

## 评分标准

### 意图匹配 (intentMatch)
- 用户说"想约火锅"应该调用 createActivityDraft
- 用户说"附近有什么"应该调用 exploreNearby
- 用户在修改草稿时应该调用 refineDraft

### 字段完整性 (fieldCompleteness)
- hasTitle: 标题存在且包含 Emoji
- hasType: 活动类型正确（food/entertainment/sports/boardgame/other）
- hasLocationHint: 有实际内容，不是空的"待定"
- hasValidTime: 是未来时间

### 语气评分 (toneScore 1-5)
- 1分：太装逼，如"已为您构建全息活动契约"
- 2分：偏正式，如"活动已创建完成，请确认"
- 3分：中规中矩，如"好的，帮你创建了活动"
- 4分：比较接地气，如"搞定！帮你把局组好了"
- 5分：很接地气，如"齐活儿！火锅局安排上了🔥"

### 相关性评分 (relevanceScore 1-5)
- 1分：完全跑题
- 2分：部分相关但遗漏关键信息
- 3分：基本切题
- 4分：切题且信息完整
- 5分：切题、完整、有额外有价值的补充

### 上下文利用度 (contextScore 1-5)
- 1分：完全忽略对话历史
- 2分：部分利用，但遗漏重要信息
- 3分：基本利用了上下文
- 4分：很好地利用了上下文，回答连贯
- 5分：完美利用上下文，能引用之前的信息并自然衔接

### 整体质量 (qualityScore 1-10)
综合以上各项，给出整体评分。7分及以上为通过。`,
    prompt: `评估这次 Tool 调用：

用户输入: "${userInput}"
调用的 Tool: ${toolName}
参数: ${JSON.stringify(toolArgs, null, 2)}
结果: ${JSON.stringify(toolResult, null, 2)}${historyContext}

请先在 thinking 中分析，然后给出评估结果。`,
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
  toolResult: unknown,
  conversationHistory?: Array<{ role: string; content: string }>
): Promise<ToolEvaluation> {
  // 构建对话历史上下文
  const historyContext = conversationHistory && conversationHistory.length > 0
    ? `\n\n对话历史（最近 ${Math.min(conversationHistory.length, 6)} 轮）：\n${conversationHistory.slice(-6).map(m => `${m.role === 'user' ? '用户' : 'AI'}: ${m.content}`).join('\n')}`
    : '';

  const { object } = await generateObject({
    model: getEvaluationModel(),
    schema: jsonSchema<ToolEvaluation>(toJsonSchema(toolEvaluationSchema)),
    temperature: 0,
    system: `你是小橘 AI 的质量评估专家。评估 Tool 调用是否正确响应了用户意图。

## 评估流程
1. 先在 thinking 字段中详细分析
2. 然后基于分析给出各项评分

## 评分标准

### 语气评分 (toneScore 1-5)
- 1分：太装逼/太正式
- 3分：中规中矩
- 5分：很接地气，像朋友聊天

### 相关性评分 (relevanceScore 1-5)
- 1分：完全跑题
- 3分：基本切题
- 5分：切题且信息完整

### 上下文利用度 (contextScore 1-5)
- 1分：完全忽略对话历史
- 3分：基本利用了上下文
- 5分：完美利用上下文，自然衔接

### 整体质量 (qualityScore 1-10)
综合评分，7分及以上为通过。`,
    prompt: `评估这次 Tool 调用：

用户输入: "${userInput}"
调用的 Tool: ${toolName}
参数: ${JSON.stringify(toolArgs, null, 2)}
结果: ${JSON.stringify(toolResult, null, 2)}${historyContext}

请先在 thinking 中分析，然后给出评估结果。`,
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
  toolResult: unknown,
  conversationHistory?: Array<{ role: string; content: string }>
): Promise<EvaluationResult> {
  const isDraftTool = toolName === 'createActivityDraft' || toolName === 'refineDraft';
  
  const evaluation = isDraftTool
    ? await evaluateDraftTool(userInput, toolName, toolArgs, toolResult, conversationHistory)
    : await evaluateToolCall(userInput, toolName, toolArgs, toolResult, conversationHistory);
  
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
