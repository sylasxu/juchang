import { pgTable, pgEnum, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "./users";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";

// ==========================================
// 举报相关枚举定义
// ==========================================

// 举报类型
export const reportTypeEnum = pgEnum("report_type", [
  "activity",  // 活动举报
  "message",   // 消息举报
  "user"       // 用户举报
]);

// 举报原因
export const reportReasonEnum = pgEnum("report_reason", [
  "inappropriate",  // 违规内容
  "fake",           // 虚假信息
  "harassment",     // 骚扰行为
  "other"           // 其他
]);

// 举报处理状态
export const reportStatusEnum = pgEnum("report_status", [
  "pending",   // 待处理
  "resolved",  // 已处理
  "ignored"    // 已忽略
]);

/**
 * 举报表
 * 
 * 用于存储用户举报的不良内容，支持活动、消息、用户三种举报类型。
 * 运营人员可在 Admin 后台处理举报队列。
 */
export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // --- 举报类型和原因 ---
  type: reportTypeEnum("type").notNull(),
  reason: reportReasonEnum("reason").notNull(),
  description: text("description"),  // 举报说明（可选）
  
  // --- 被举报目标 ---
  targetId: uuid("target_id").notNull(),  // 被举报的活动/消息/用户 ID
  targetContent: text("target_content").notNull(),  // 被举报内容快照
  
  // --- 举报人 ---
  reporterId: uuid("reporter_id").notNull().references(() => users.id),
  
  // --- 处理状态 ---
  status: reportStatusEnum("status").default("pending").notNull(),
  adminNote: text("admin_note"),  // 处理备注
  
  // --- 时间戳 ---
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: uuid("resolved_by").references(() => users.id),
}, (t) => [
  index("reports_status_idx").on(t.status),
  index("reports_type_idx").on(t.type),
  index("reports_created_at_idx").on(t.createdAt),
  index("reports_reporter_idx").on(t.reporterId),
]);

// TypeBox Schemas
export const insertReportSchema = createInsertSchema(reports);
export const selectReportSchema = createSelectSchema(reports);

// TypeScript Types
export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
