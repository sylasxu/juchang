import { pgTable, uuid, varchar, real, boolean, integer, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { users } from "./users";
import { conversations } from "./conversations";
import { activities } from "./activities";

/**
 * AI 对话质量指标表
 * 
 * 记录每次 AI 对话的质量指标，用于：
 * - 对话质量监控（意图识别率、Tool 成功率）
 * - 转化率追踪（对话 → 活动创建/报名）
 * - 历史趋势分析
 * 
 * v4.6 新增
 */
export const aiConversationMetrics = pgTable("ai_conversation_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // 关联
  conversationId: uuid("conversation_id").references(() => conversations.id),
  userId: uuid("user_id").references(() => users.id),
  
  // 意图识别
  intent: varchar("intent", { length: 50 }),           // create, explore, partner, chitchat
  intentConfidence: real("intent_confidence"),          // 0-1 置信度
  intentRecognized: boolean("intent_recognized").default(true),
  
  // Tool 调用
  toolsCalled: jsonb("tools_called").$type<string[]>().default([]),
  toolsSucceeded: integer("tools_succeeded").default(0),
  toolsFailed: integer("tools_failed").default(0),
  
  // 质量评分
  qualityScore: real("quality_score"),                  // 0-1 综合质量评分
  
  // Token 用量
  inputTokens: integer("input_tokens").default(0),
  outputTokens: integer("output_tokens").default(0),
  totalTokens: integer("total_tokens").default(0),
  
  // 性能
  latencyMs: integer("latency_ms"),                     // 响应延迟
  
  // 转化追踪
  activityCreated: boolean("activity_created").default(false),
  activityJoined: boolean("activity_joined").default(false),
  activityId: uuid("activity_id").references(() => activities.id),
  
  // 元数据
  source: varchar("source", { length: 20 }).default("miniprogram"), // miniprogram, admin
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("ai_conversation_metrics_created_at_idx").on(t.createdAt),
  index("ai_conversation_metrics_user_id_idx").on(t.userId),
  index("ai_conversation_metrics_intent_idx").on(t.intent),
]);

// TypeBox Schemas
export const insertAiConversationMetricsSchema = createInsertSchema(aiConversationMetrics);
export const selectAiConversationMetricsSchema = createSelectSchema(aiConversationMetrics);

// TypeScript 类型
export type AiConversationMetrics = typeof aiConversationMetrics.$inferSelect;
export type NewAiConversationMetrics = typeof aiConversationMetrics.$inferInsert;
