import { pgTable, uuid, varchar, text, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { users } from "./users";

/**
 * AI 安全事件表
 * 
 * 记录所有安全拦截事件，用于：
 * - 违规统计
 * - 趋势分析
 * - 用户行为追踪
 * 
 * v4.6 新增
 */
export const aiSecurityEvents = pgTable("ai_security_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // 关联用户（可为空，匿名用户）
  userId: uuid("user_id").references(() => users.id),
  
  // 事件类型：input_blocked, output_blocked, rate_limited
  eventType: varchar("event_type", { length: 50 }).notNull(),
  
  // 触发词（敏感词拦截时记录）
  triggerWord: varchar("trigger_word", { length: 100 }),
  
  // 原始输入（脱敏后存储）
  inputText: text("input_text"),
  
  // 严重程度：low, medium, high
  severity: varchar("severity", { length: 20 }).default("medium"),
  
  // 扩展元数据
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  
  // 时间戳
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("ai_security_events_user_id_idx").on(t.userId),
  index("ai_security_events_created_at_idx").on(t.createdAt),
  index("ai_security_events_event_type_idx").on(t.eventType),
]);

// TypeBox Schemas
export const insertAiSecurityEventsSchema = createInsertSchema(aiSecurityEvents);
export const selectAiSecurityEventsSchema = createSelectSchema(aiSecurityEvents);

// TypeScript 类型
export type AiSecurityEvent = typeof aiSecurityEvents.$inferSelect;
export type NewAiSecurityEvent = typeof aiSecurityEvents.$inferInsert;
