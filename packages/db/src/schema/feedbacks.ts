import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "./users";
import { activities } from "./activities";
import { feedbackReasonEnum } from "./enums";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";

export const feedbacks = pgTable("feedbacks", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  activityId: uuid("activity_id").notNull().references(() => activities.id),
  reporterId: uuid("reporter_id").notNull().references(() => users.id),
  targetId: uuid("target_id").notNull().references(() => users.id),
  
  reason: feedbackReasonEnum("reason").notNull(),
  description: text("description"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("feedbacks_activity_idx").on(t.activityId),
  index("feedbacks_target_idx").on(t.targetId),
  index("feedbacks_reporter_idx").on(t.reporterId),
]);

export const insertFeedbackSchema = createInsertSchema(feedbacks);
export const selectFeedbackSchema = createSelectSchema(feedbacks);

export type Feedback = typeof feedbacks.$inferSelect;
export type NewFeedback = typeof feedbacks.$inferInsert;
