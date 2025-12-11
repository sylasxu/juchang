import { relations } from "drizzle-orm";
import { users } from "./users";
import { userAuths } from "./user_auths";
import { activities } from "./activities";
import { participants } from "./participants";
import { feedbacks } from "./feedbacks";
import { notifications } from "./notifications";
import { chatGroups } from "./chat_groups";
import { chatMessages } from "./chat_messages";
import { orders } from "./orders";
import { payments } from "./payments";
import { actionLogs } from "./action_logs";

// ==========================================
// User Relations
// ==========================================
export const usersRelations = relations(users, ({ many }) => ({
  auths: many(userAuths),
  activitiesCreated: many(activities),
  participations: many(participants),
  feedbacksReceived: many(feedbacks, { relationName: "target" }),
  feedbacksGiven: many(feedbacks, { relationName: "reporter" }),
  notifications: many(notifications),
  orders: many(orders),
  actionLogs: many(actionLogs),
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
  chatGroup: one(chatGroups, {
    fields: [activities.id],
    references: [chatGroups.activityId],
  }),
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
// Chat Relations
// ==========================================
export const chatGroupsRelations = relations(chatGroups, ({ one, many }) => ({
  activity: one(activities, {
    fields: [chatGroups.activityId],
    references: [activities.id],
  }),
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  group: one(chatGroups, {
    fields: [chatMessages.groupId],
    references: [chatGroups.id],
  }),
  sender: one(users, {
    fields: [chatMessages.senderId],
    references: [users.id],
  }),
}));

// ==========================================
// Auth Relations
// ==========================================
export const userAuthsRelations = relations(userAuths, ({ one }) => ({
  user: one(users, {
    fields: [userAuths.userId],
    references: [users.id],
  }),
}));

// ==========================================
// Payment Relations
// ==========================================
export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
  user: one(users, {
    fields: [payments.userId],
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
