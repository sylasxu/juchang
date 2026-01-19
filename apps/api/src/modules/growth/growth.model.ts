/**
 * Growth Model - TypeBox schemas
 */

import { Elysia, t, type Static } from 'elysia'

// ==========================================
// 海报工厂
// ==========================================

export const GeneratePosterRequest = t.Object({
  text: t.String({ description: '活动描述' }),
  style: t.Union([
    t.Literal('minimal'),
    t.Literal('cyberpunk'),
    t.Literal('handwritten'),
  ], { description: '风格' }),
})

export const PosterResult = t.Object({
  headline: t.String({ description: '主标题' }),
  subheadline: t.String({ description: '副标题' }),
  body: t.String({ description: '正文' }),
  cta: t.String({ description: '行动号召' }),
  hashtags: t.Array(t.String(), { description: '话题标签' }),
})

// ==========================================
// 热门洞察
// ==========================================

export const TrendWord = t.Object({
  word: t.String({ description: '关键词' }),
  count: t.Number({ description: '出现次数' }),
  trend: t.Union([
    t.Literal('up'),
    t.Literal('down'),
    t.Literal('stable'),
  ], { description: '趋势' }),
})

export const IntentDistribution = t.Object({
  intent: t.String({ description: '意图类型' }),
  count: t.Number({ description: '数量' }),
  percentage: t.Number({ description: '占比' }),
})

export const TrendInsight = t.Object({
  topWords: t.Array(TrendWord),
  intentDistribution: t.Array(IntentDistribution),
  period: t.Union([
    t.Literal('7d'),
    t.Literal('30d'),
  ], { description: '时间范围' }),
})

// ==========================================
// 错误响应
// ==========================================

export const ErrorResponse = t.Object({
  code: t.Number(),
  msg: t.String(),
})

export type ErrorResponse = Static<typeof ErrorResponse>

// ==========================================
// Model Plugin
// ==========================================

export const growthModel = new Elysia({ name: 'growth.model' })
  .model({
    'growth.generatePosterRequest': GeneratePosterRequest,
    'growth.posterResult': PosterResult,
    'growth.trendInsight': TrendInsight,
    'growth.error': ErrorResponse,
  })
