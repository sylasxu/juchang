import { relations } from "drizzle-orm";
import { users } from "./users";
import { activities } from "./activities";
import { participants } from "./participants";
import { feedbacks } from "./feedbacks";
import { notifications } from "./notifications";
import { chatMessages } from "./chat_messages";
import { transactions } from "./transactions";
import { actionLogs } from "./action_logs";

// ==========================================
// User Relations
// ==========================================
export const usersRelations = relations(users, ({ many }) => ({
  activitiesCreated: many(activities),
  participations: many(participants),
  feedbacksReceived: many(feedbacks, { relationName: "target" }),
  feedbacksGiven: many(feedbacks, { relationName: "reporter" }),
  notifications: many(notifications),
  transactions: many(transactions),
  actionLogs: many(actionLogs),
  chatMessages: many(chatMessages),
}));

// ==========================================
// Activity Relations
// ==========================================
export const activitiesRelations = relations(activities, ({ one, many }) => ({
  creator: one(users, {
    fields: [activities.creatorId],
    references: [users.id],
  }),
  participants: many(participants),
  chatMessages: many(chatMessages), // 直接关联消息
  feedbacks: many(feedbacks),
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
// Feedback Relations
// ==========================================
export const feedbacksRelations = relations(feedbacks, ({ one }) => ({
  activity: one(activities, {
    fields: [feedbacks.activityId],
    references: [activities.id],
  }),
  reporter: one(users, {
    fields: [feedbacks.reporterId],
    references: [users.id],
    relationName: "reporter",
  }),
  target: one(users, {
    fields: [feedbacks.targetId],
    references: [users.id],
    relationName: "target",
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
}));

// ==========================================
// Chat Relations (简化)
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
// Transaction Relations (整合支付)
// ==========================================
export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

// ==========================================
// Action Log Relations
// ==========================================
export const actionLogsRelations = relations(actionLogs, ({ one }) => ({
  user: one(users, {
    fields: [actionLogs.userId],
    references: [users.id],
  }),
}));
