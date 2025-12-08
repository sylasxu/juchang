import { pgTable, uuid, timestamp, text, index, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { activities } from "./activities";
import { participantStatusEnum } from "./enums";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { Type } from "@sinclair/typebox";

export const participants = pgTable("participants", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  activityId: uuid("activity_id").notNull().references(() => activities.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  
  status: participantStatusEnum("status").default("pending").notNull(),
  
  // 申请理由：用户申请加入活动时的说明（仅当 joinMode=approval 时使用）
  applicationMsg: text("application_msg"), 
  
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

// TypeBox Schemas (使用 drizzle-typebox)
// 使用 Type.Object 重新包装，切断对 drizzle-typebox 内部文件的依赖
// 解决 TypeScript Monorepo 的 TS2742 错误
const _insertParticipantSchema = createInsertSchema(participants);
export const insertParticipantSchema = Type.Object(_insertParticipantSchema.properties as any);

const _selectParticipantSchema = createSelectSchema(participants);
export const selectParticipantSchema = Type.Object(_selectParticipantSchema.properties as any);

export type Participant = typeof participants.$inferSelect;
export type NewParticipant = typeof participants.$inferInsert;