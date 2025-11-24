import { pgTable, uuid, varchar, timestamp, primaryKey, boolean, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { activities } from "./activities";
import { participantStatusEnum } from "./enums";

export const activityParticipants = pgTable("activity_participants", {
  activityId: uuid("activity_id").notNull().references(() => activities.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  
  /** 状态流转：pending -> approved -> checked_in */
  status: participantStatusEnum("status").default("pending").notNull(),
  
  /** 申请理由：用于主办方审核参考 */
  signupMessage: varchar("signup_message", { length: 100 }),
  
  /** 签到时间：基于LBS或二维码验证后填入 */
  checkedInAt: timestamp("checked_in_at"),
  
  /** 是否已评价：防止重复评价 */
  hasReviewed: boolean("has_reviewed").default(false),
  
  joinedAt: timestamp("joined_at").defaultNow(),
}, (t) => [
  // 复合主键：防止重复报名
  primaryKey({ columns: [t.activityId, t.userId] }),
  // 索引：查我参与的活动
  index("participants_user_idx").on(t.userId),
]);

export const participantsRelations = relations(activityParticipants, ({ one }) => ({
  activity: one(activities, {
    fields: [activityParticipants.activityId],
    references: [activities.id],
  }),
  user: one(users, {
    fields: [activityParticipants.userId],
    references: [users.id],
  }),
}));