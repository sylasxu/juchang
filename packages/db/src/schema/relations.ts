import { relations } from "drizzle-orm";
import { users } from "./users";
import { activities } from "./activities";
import { participants } from "./participants";
import { notifications } from "./notifications";
import { activityMessages } from "./activity_messages";
import { conversations } from "./conversations";

// ==========================================
// User Relations (v3.3 行业标准命名)
// ==========================================
export const usersRelations = relations(users, ({ many }) => ({
  activitiesCreated: many(activities),
  participations: many(participants),
  notifications: many(notifications),
  activityMessages: many(activityMessages),
  conversations: many(conversations),
}));

// ==========================================
// Activity Relations (v3.3 行业标准命名)
// ==========================================
export const activitiesRelations = relations(activities, ({ one, many }) => ({
  creator: one(users, {
    fields: [activities.creatorId],
    references: [users.id],
  }),
  participants: many(participants),
  activityMessages: many(activityMessages),
  notifications: many(notifications),
  conversations: many(conversations),
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
// Activity Message Relations (v3.3 语义化命名)
// ==========================================
export const activityMessagesRelations = relations(activityMessages, ({ one }) => ({
  activity: one(activities, {
    fields: [activityMessages.activityId],
    references: [activities.id],
  }),
  sender: one(users, {
    fields: [activityMessages.senderId],
    references: [users.id],
  }),
}));

// ==========================================
// Conversation Relations (v3.3 行业标准命名)
// ==========================================
export const conversationsRelations = relations(conversations, ({ one }) => ({
  user: one(users, {
    fields: [conversations.userId],
    references: [users.id],
  }),
  activity: one(activities, {
    fields: [conversations.activityId],
    references: [activities.id],
  }),
}));

// ==========================================
// MVP 移除的关系：
// - feedbacksRelations (复杂反馈系统)
// - transactionsRelations (支付功能)
// - actionLogsRelations (审计日志)
// ==========================================
