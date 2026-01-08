import { pgTable, uuid, varchar, text, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "./users";
import { intentMatches } from "./intent-matches";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";

/**
 * 匹配消息表 (v4.0 Smart Broker - 3表精简版)
 * 
 * 直接关联到 Match ID，Match 本身就是"隐形群组"
 * 用于 Broker Agent 破冰和用户协商
 */
export const matchMessages = pgTable("match_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // 直接关联到 Match ID (Match = Group)
  matchId: uuid("match_id").notNull().references(() => intentMatches.id, { onDelete: 'cascade' }),
  
  // 发送者 (null = 系统/Agent 消息)
  senderId: uuid("sender_id").references(() => users.id),
  
  // 消息类型: text, system, icebreaker
  messageType: varchar("message_type", { length: 20 }).default("text").notNull(),
  
  // 消息内容
  content: text("content").notNull(),
  
  // 时间戳
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("match_messages_match_idx").on(t.matchId),
  index("match_messages_created_idx").on(t.createdAt),
]);

export const insertMatchMessageSchema = createInsertSchema(matchMessages);
export const selectMatchMessageSchema = createSelectSchema(matchMessages);

export type MatchMessage = typeof matchMessages.$inferSelect;
export type NewMatchMessage = typeof matchMessages.$inferInsert;
