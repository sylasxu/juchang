import { relations } from "drizzle-orm";
import { users } from "./users";
import { activities } from "./activities";
import { participants } from "./participants";
import { notifications } from "./notifications";
import { chatMessages } from "./chat_messages";

// ==========================================
// User Relations (MVP 精简版)
// ==========================================
export const usersRelations = relations(users, ({ many }) => ({
  activitiesCreated: many(activities),
  participations: many(participants),
  notifications: many(notifications),
  chatMessages: many(chatMessages),
}));

// ==========================================
// Activity Relations (MVP 精简版)
// ==========================================
export const activitiesRelations = relations(activities, ({ one, many }) => ({
  creator: one(users, {
    fields: [activities.creatorId],
    references: [users.id],
  }),
  participants: many(participants),
  chatMessages: many(chatMessages),
  notifications: many(notifications),
}));

// ==========================================
// Participant Relations
// ==========================================
export const participantsRelations = relations(participants, ({ one }) => ({
  user: one(users, {
    fields: [participants.userId],
    references: [users.id],
  }),
  activity: one(activities, {
    fields: [participants.activityId],
    references: [activities.id],
  }),
}));

// ==========================================
// Notification Relations
// ==========================================
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  activity: one(activities, {
    fields: [notifications.activityId],
    references: [activities.id],
  }),
}));

// ==========================================
// Chat Message Relations
// ==========================================
export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  activity: one(activities, {
    fields: [chatMessages.activityId],
    references: [activities.id],
  }),
  sender: one(users, {
    fields: [chatMessages.senderId],
    references: [users.id],
  }),
}));

// ==========================================
// MVP 移除的关系：
// - feedbacksRelations (复杂反馈系统)
// - transactionsRelations (支付功能)
// - actionLogsRelations (审计日志)
// ==========================================
