import { pgTable, uuid, text, timestamp, index, jsonb } from "drizzle-orm/pg-core";
import { chatGroups } from "./chat_groups";
import { users } from "./users";
import { messageTypeEnum } from "./enums";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  groupId: uuid("group_id").notNull().references(() => chatGroups.id),
  senderId: uuid("sender_id").references(() => users.id),
  
  type: messageTypeEnum("type").default("text").notNull(),
  content: text("content").notNull(),
  
  metadata: jsonb("metadata"),
  
  isRevoked: timestamp("is_revoked"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("chat_messages_group_idx").on(t.groupId),
  index("chat_messages_created_idx").on(t.createdAt),
]);

export const insertChatMessageSchema = createInsertSchema(chatMessages);
export const selectChatMessageSchema = createSelectSchema(chatMessages);

export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;
