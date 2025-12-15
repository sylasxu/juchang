import { pgTable, uuid, integer, varchar, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { users } from "./users";
import { transactionStatusEnum } from "./enums";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";

/**
 * 交易表 (整合 orders + payments)
 * MVP 阶段简化支付逻辑，一个交易对应一次支付
 */
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  userId: uuid("user_id").notNull().references(() => users.id),
  
  // 产品信息
  productType: varchar("product_type", { length: 50 }).notNull(), // boost, pin_plus, fast_pass, ai_report, ai_pack, pro_monthly
  productName: varchar("product_name", { length: 100 }).notNull(),
  amount: integer("amount").notNull(), // 金额（分）
  
  // 支付状态
  status: transactionStatusEnum("status").default("pending").notNull(),
  
  // 微信支付
  outTradeNo: varchar("out_trade_no", { length: 64 }).unique().notNull(), // 商户订单号（幂等键）
  transactionId: varchar("transaction_id", { length: 64 }), // 微信交易号
  
  // 业务关联
  relatedId: uuid("related_id"), // 关联的活动ID或用户ID
  metadata: jsonb("metadata").$type<{
    activityId?: string;
    boostCount?: number;
    validUntil?: string;
    [key: string]: unknown;
  }>(),
  
  // 回调数据
  callbackData: jsonb("callback_data"),
  errorMessage: varchar("error_message", { length: 255 }),
  
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("transactions_user_idx").on(t.userId),
  index("transactions_trade_no_idx").on(t.outTradeNo),
  index("transactions_status_idx").on(t.status),
  index("transactions_product_idx").on(t.productType),
]);

export const insertTransactionSchema = createInsertSchema(transactions);
export const selectTransactionSchema = createSelectSchema(transactions);

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;