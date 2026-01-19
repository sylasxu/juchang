import { pgTable, uuid, varchar, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";

/**
 * AI 敏感词表
 * 
 * 存储敏感词库，替代内存硬编码
 * 服务启动时加载到内存缓存，定期刷新
 * 
 * v4.6 新增
 */
export const aiSensitiveWords = pgTable("ai_sensitive_words", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // 敏感词
  word: varchar("word", { length: 100 }).notNull().unique(),
  
  // 分类：general, political, violence, porn, fraud
  category: varchar("category", { length: 50 }).default("general"),
  
  // 严重程度：low, medium, high
  severity: varchar("severity", { length: 20 }).default("medium"),
  
  // 是否启用
  isActive: boolean("is_active").default(true),
  
  // 时间戳
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("ai_sensitive_words_category_idx").on(t.category),
  index("ai_sensitive_words_is_active_idx").on(t.isActive),
]);

// TypeBox Schemas
export const insertAiSensitiveWordsSchema = createInsertSchema(aiSensitiveWords);
export const selectAiSensitiveWordsSchema = createSelectSchema(aiSensitiveWords);

// TypeScript 类型
export type AiSensitiveWord = typeof aiSensitiveWords.$inferSelect;
export type NewAiSensitiveWord = typeof aiSensitiveWords.$inferInsert;
