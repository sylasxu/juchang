import { pgTable, uuid, varchar, text, timestamp, boolean, index, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users";
import { notificationTypeEnum } from "./enums";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  userId: uuid("user_id").notNull().references(() => users.id),
  
  type: notificationTypeEnum("type").notNull(),
  
  title: varchar("title", { length: 100 }).notNull(),
  content: text("content"),
  
  metadata: jsonb("metadata").$type<{
    activityId?: string;
    applicantId?: string;
  }>(),
  
  isRead: boolean("is_read").default(false).notNull(),
  readAt: timestamp("read_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("notifications_user_idx").on(t.userId),
  index("notifications_unread_idx").on(t.userId, t.isRead),
]);

export const insertNotificationSchema = createInsertSchema(notifications);
export const selectNotificationSchema = createSelectSchema(notifications);

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
