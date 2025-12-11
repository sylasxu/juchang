import { pgTable, uuid, timestamp, index } from "drizzle-orm/pg-core";
import { activities } from "./activities";
import { chatGroupStatusEnum } from "./enums";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";

export const chatGroups = pgTable("chat_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  activityId: uuid("activity_id").notNull().references(() => activities.id).unique(),
  
  status: chatGroupStatusEnum("status").default("active").notNull(),
  
  archivedAt: timestamp("archived_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("chat_groups_activity_idx").on(t.activityId),
  index("chat_groups_status_idx").on(t.status),
]);

export const insertChatGroupSchema = createInsertSchema(chatGroups);
export const selectChatGroupSchema = createSelectSchema(chatGroups);

export type ChatGroup = typeof chatGroups.$inferSelect;
export type NewChatGroup = typeof chatGroups.$inferInsert;
