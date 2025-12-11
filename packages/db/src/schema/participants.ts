import { pgTable, uuid, timestamp, text, index, unique, boolean } from "drizzle-orm/pg-core";
import { users } from "./users";
import { activities } from "./activities";
import { participantStatusEnum } from "./enums";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";

export const participants = pgTable("participants", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  activityId: uuid("activity_id").notNull().references(() => activities.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  
  status: participantStatusEnum("status").default("pending").notNull(),
  
  applicationMsg: text("application_msg"),
  isFastPass: boolean("is_fast_pass").default(false).notNull(), // 优先入场券
  
  // --- 履约与申诉 ---
  confirmedAt: timestamp("confirmed_at"),
  isDisputed: boolean("is_disputed").default(false).notNull(),  // 是否申诉
  disputedAt: timestamp("disputed_at"),
  disputeExpiresAt: timestamp("dispute_expires_at"),            // 申诉截止时间
  
  joinedAt: timestamp("joined_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  unique("unique_participant").on(t.activityId, t.userId),
  index("participant_user_idx").on(t.userId),
  index("participant_activity_idx").on(t.activityId),
  index("participant_status_idx").on(t.status),
]);

export const insertParticipantSchema = createInsertSchema(participants);
export const selectParticipantSchema = createSelectSchema(participants);

export type Participant = typeof participants.$inferSelect;
export type NewParticipant = typeof participants.$inferInsert;
