import { relations } from "drizzle-orm";
import { users } from "./users";
import { activities } from "./activities";
import { participants } from "./participants";
import { notifications } from "./notifications";
import { groupMessages } from "./group_messages";
import { homeMessages } from "./home_messages";

// ==========================================
// User Relations (v3.2 Chat-First)
// ==========================================
export const usersRelations = relations(users, ({ many }) => ({
  activitiesCreated: many(activities),
  participations: many(participants),
  notifications: many(notifications),
  groupMessages: many(groupMessages),
  homeMessages: many(homeMessages),
}));

// ==========================================
// Activity Relations (v3.2 Chat-First)
// ==========================================
export const activitiesRelations = relations(activities, ({ one, many }) => ({
  creator: one(users, {
    fields: [activities.creatorId],
    references: [users.id],
  }),
  participants: many(participants),
  groupMessages: many(groupMessages),
  notifications: many(notifications),
  homeMessages: many(homeMessages),
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
// Group Message Relations (v3.2 重命名自 Chat Message)
// ==========================================
export const groupMessagesRelations = relations(groupMessages, ({ one }) => ({
  activity: one(activities, {
    fields: [groupMessages.activityId],
    references: [activities.id],
  }),
  sender: one(users, {
    fields: [groupMessages.senderId],
    references: [users.id],
  }),
}));

// ==========================================
// Home Message Relations (v3.2 新增)
// ==========================================
export const homeMessagesRelations = relations(homeMessages, ({ one }) => ({
  user: one(users, {
    fields: [homeMessages.userId],
    references: [users.id],
  }),
  activity: one(activities, {
    fields: [homeMessages.activityId],
    references: [activities.id],
  }),
}));

// ==========================================
// MVP 移除的关系：
// - feedbacksRelations (复杂反馈系统)
// - transactionsRelations (支付功能)
// - actionLogsRelations (审计日志)
// ==========================================
