import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { activities } from "./activities";
import { users } from "./users";
import { messageTypeEnum } from "./enums";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";

/**
 * 活动群聊消息表 (v3.2 重命名自 chat_messages)
 * 
 * 为了区分"两个聊天"场景：
 * - Home Chat: 用户 vs AI (独角戏，存 home_messages)
 * - Group Chat: 用户 vs 用户 (活动群聊，存 group_messages)
 * 
 * 保留字段：id, activityId, senderId (nullable), type, content, createdAt
 * 
 * 设计说明：
 * - senderId 可为空：系统消息（如"张三退出了活动"）不需要 sender
 * - 前端渲染时，senderId 为空显示"系统通知"
 */
export const groupMessages = pgTable("group_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  activityId: uuid("activity_id").notNull().references(() => activities.id),
  senderId: uuid("sender_id").references(() => users.id), // 可为空：系统消息无 sender
  
  type: messageTypeEnum("type").default("text").notNull(),
  content: text("content").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("group_messages_activity_idx").on(t.activityId),
  index("group_messages_created_idx").on(t.createdAt),
]);

// TypeBox Schemas
export const insertGroupMessageSchema = createInsertSchema(groupMessages);
export const selectGroupMessageSchema = createSelectSchema(groupMessages);

// TypeScript 类型
export type GroupMessage = typeof groupMessages.$inferSelect;
export type NewGroupMessage = typeof groupMessages.$inferInsert;

// 向后兼容别名 (deprecated, 将在未来版本移除)
/** @deprecated Use groupMessages instead */
export const chatMessages = groupMessages;
/** @deprecated Use insertGroupMessageSchema instead */
export const insertChatMessageSchema = insertGroupMessageSchema;
/** @deprecated Use selectGroupMessageSchema instead */
export const selectChatMessageSchema = selectGroupMessageSchema;
/** @deprecated Use GroupMessage instead */
export type ChatMessage = GroupMessage;
/** @deprecated Use NewGroupMessage instead */
export type NewChatMessage = NewGroupMessage;
