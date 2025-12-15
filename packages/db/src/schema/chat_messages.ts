import { pgTable, uuid, text, timestamp, index, jsonb } from "drizzle-orm/pg-core";
import { activities } from "./activities";
import { users } from "./users";
import { messageTypeEnum } from "./enums";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  activityId: uuid("activity_id").notNull().references(() => activities.id), // 直接关联活动
  senderId: uuid("sender_id").references(() => users.id),
  
  type: messageTypeEnum("type").default("text").notNull(),
  content: text("content").notNull(),
  
  metadata: jsonb("metadata"),
  
  isRevoked: timestamp("is_revoked"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("chat_messages_activity_idx").on(t.activityId),
  index("chat_messages_created_idx").on(t.createdAt),
]);

export const insertChatMessageSchema = createInsertSchema(chatMessages);
export const selectChatMessageSchema = createSelectSchema(chatMessages);

export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;
