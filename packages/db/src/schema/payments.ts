import { pgTable, uuid, integer, varchar, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { orders } from "./orders";
import { users } from "./users";
import { paymentMethodEnum, paymentStatusEnum } from "./enums";

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  /** 关联业务订单 */
  orderId: uuid("order_id").notNull().references(() => orders.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  
  /** 支付金额(分) */
  amount: integer("amount").notNull(),
  
  /** 支付渠道 (微信/支付宝) */
  gateway: paymentMethodEnum("gateway").default("wechat_pay").notNull(),
  
  /** 支付状态 */
  status: paymentStatusEnum("status").default("pending").notNull(),
  
  /** [关键] 商户侧单号 (OutTradeNo)：每次重试都会生成新的，用于网关去重 */
  outTradeNo: varchar("out_trade_no", { length: 64 }).unique().notNull(),
  
  /** 渠道流水号：微信/支付宝返回的 Transaction ID */
  gatewayTransactionId: varchar("gateway_transaction_id", { length: 64 }),
  
  /** 调试数据：存储网关回调的原始 JSON，用于纠纷取证 */
  gatewayResponse: jsonb("gateway_response"),
  
  /** 错误信息：记录支付失败原因 */
  errorMessage: varchar("error_message", { length: 255 }),
  
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  // 索引：回调时根据 out_trade_no 快速找到记录
  index("payments_trade_no_idx").on(t.outTradeNo),
  index("payments_order_idx").on(t.orderId),
]);

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, { fields: [payments.orderId], references: [orders.id] }),
  user: one(users, { fields: [payments.userId], references: [users.id] }),
}));