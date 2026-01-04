import { relations } from "drizzle-orm";
import { users } from "./users";
import { activities } from "./activities";
import { participants } from "./participants";
import { notifications } from "./notifications";
import { activityMessages } from "./activity_messages";
import { conversations, conversationMessages } from "./conversations";
import { reports } from "./reports";

// ==========================================
// User Relations (v3.3 行业标准命名)
// ==========================================
export const usersRelations = relations(users, ({ many }) => ({
  activitiesCreated: many(activities),
  participations: many(participants),
  notifications: many(notifications),
  activityMessages: many(activityMessages),
  conversations: many(conversations),
  conversationMessages: many(conversationMessages),
  reportsSubmitted: many(reports, { relationName: "reporter" }),
  reportsResolved: many(reports, { relationName: "resolver" }),
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
  conversationMessages: many(conversationMessages),
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
// Conversation Relations (会话)
// ==========================================
export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(users, {
    fields: [conversations.userId],
    references: [users.id],
  }),
  messages: many(conversationMessages),
}));

// ==========================================
// ConversationMessage Relations (消息)
// ==========================================
export const conversationMessagesRelations = relations(conversationMessages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [conversationMessages.conversationId],
    references: [conversations.id],
  }),
  user: one(users, {
    fields: [conversationMessages.userId],
    references: [users.id],
  }),
  activity: one(activities, {
    fields: [conversationMessages.activityId],
    references: [activities.id],
  }),
}));

// ==========================================
// Report Relations (内容审核)
// ==========================================
export const reportsRelations = relations(reports, ({ one }) => ({
  reporter: one(users, {
    fields: [reports.reporterId],
    references: [users.id],
    relationName: "reporter",
  }),
  resolver: one(users, {
    fields: [reports.resolvedBy],
    references: [users.id],
    relationName: "resolver",
  }),
}));

// ==========================================
// MVP 移除的关系：
// - feedbacksRelations (复杂反馈系统)
// - transactionsRelations (支付功能)
// - actionLogsRelations (审计日志)
// ==========================================
