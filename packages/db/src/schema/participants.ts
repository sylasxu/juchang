import { pgTable, uuid, timestamp, text, index, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { activities } from "./activities";
import { participantStatusEnum } from "./enums";

export const participants = pgTable("participants", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  activityId: uuid("activity_id").notNull().references(() => activities.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  
  status: participantStatusEnum("status").default("pending").notNull(),
  
  // 申请理由 (AI 可以分析这个来辅助 Host 审核)
  message: text("message"), 
  
  joinedAt: timestamp("joined_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  // 复合唯一约束：防止重复报名
  unique("unique_participant").on(t.activityId, t.userId),
  index("participant_user_idx").on(t.userId),
]);

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