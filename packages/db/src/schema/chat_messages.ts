import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { activities } from "./activities";
import { users } from "./users";
import { messageTypeEnum } from "./enums";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";

/**
 * 群聊消息表 (MVP 精简版)
 * 
 * 保留字段：id, activityId, senderId (nullable), type, content, createdAt
 * 
 * 移除字段：metadata, isRevoked
 * 
 * 设计说明：
 * - senderId 可为空：系统消息（如"张三退出了活动"）不需要 sender
 * - 前端渲染时，senderId 为空显示"系统通知"
 */
export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  activityId: uuid("activity_id").notNull().references(() => activities.id),
  senderId: uuid("sender_id").references(() => users.id), // 可为空：系统消息无 sender
  
  type: messageTypeEnum("type").default("text").notNull(),
  content: text("content").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("chat_messages_activity_idx").on(t.activityId),
  index("chat_messages_created_idx").on(t.createdAt),
]);

export const insertChatMessageSchema = createInsertSchema(chatMessages);
export const selectChatMessageSchema = createSelectSchema(chatMessages);

export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;
