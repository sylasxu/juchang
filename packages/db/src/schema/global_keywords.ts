import { pgTable, uuid, varchar, integer, boolean, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { users } from "./users";
import { matchTypeEnum, keywordResponseTypeEnum } from "./enums";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";

/**
 * 全局关键词表 (Global Keywords System)
 * 
 * 用于 P0 层热词匹配，支持：
 * - 三种匹配方式：exact（完全匹配）、prefix（前缀匹配）、fuzzy（模糊匹配）
 * - 预设响应内容（widget 或文本）
 * - 优先级排序和有效期管理
 * - 命中统计和转化追踪
 * - A/B 测试支持（同名关键词多个变体）
 */
export const globalKeywords = pgTable("global_keywords", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // --- 关键词配置 ---
  keyword: varchar("keyword", { length: 100 }).notNull(),
  matchType: matchTypeEnum("match_type").notNull(),
  responseType: keywordResponseTypeEnum("response_type").notNull(),
  responseContent: jsonb("response_content").notNull(),
  
  // --- 优先级和有效期 ---
  priority: integer("priority").default(0).notNull(),
  validFrom: timestamp("valid_from"),
  validUntil: timestamp("valid_until"),
  
  // --- 状态 ---
  isActive: boolean("is_active").default(true).notNull(),
  
  // --- 统计数据 ---
  hitCount: integer("hit_count").default(0).notNull(),
  conversionCount: integer("conversion_count").default(0).notNull(),
  
  // --- 创建者 ---
  createdBy: uuid("created_by").references(() => users.id),
  
  // --- 系统 ---
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  // 关键词查询索引
  index("idx_global_keywords_keyword").on(t.keyword),
  // 活跃状态和有效期复合索引（用于获取活跃热词）
  index("idx_global_keywords_active").on(t.isActive, t.validFrom, t.validUntil),
  // 优先级排序索引（用于匹配时的优先级排序）
  index("idx_global_keywords_priority").on(t.priority),
]);

// TypeBox Schemas
export const insertGlobalKeywordSchema = createInsertSchema(globalKeywords);
export const selectGlobalKeywordSchema = createSelectSchema(globalKeywords);

export type GlobalKeyword = typeof globalKeywords.$inferSelect;
export type InsertGlobalKeyword = typeof globalKeywords.$inferInsert;
