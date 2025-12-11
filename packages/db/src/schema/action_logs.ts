import { pgTable, uuid, varchar, timestamp, index, jsonb, bigint } from "drizzle-orm/pg-core";
import { users } from "./users";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";

/**
 * 操作日志表
 * 记录所有关键操作用于审计和模型训练
 */
export const actionLogs = pgTable("action_logs", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  
  userId: uuid("user_id").notNull().references(() => users.id),
  
  // 操作类型：fulfillment_confirm, dispute_submit, payment_success, ai_usage
  actionType: varchar("action_type", { length: 50 }).notNull(),
  
  // 操作详情
  metadata: jsonb("metadata").$type<{
    activityId?: string;
    targetUserId?: string;
    amount?: number;
    serviceType?: string;
    [key: string]: unknown;
  }>(),
  
  // 设备信息
  deviceId: varchar("device_id", { length: 64 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("action_logs_user_idx").on(t.userId),
  index("action_logs_type_idx").on(t.actionType),
  index("action_logs_created_idx").on(t.createdAt),
]);

export const insertActionLogSchema = createInsertSchema(actionLogs);
export const selectActionLogSchema = createSelectSchema(actionLogs);

export type ActionLog = typeof actionLogs.$inferSelect;
export type NewActionLog = typeof actionLogs.$inferInsert;
