import { pgTable, uuid, integer, varchar, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { orders } from "./orders";
import { users } from "./users";
import { paymentStatusEnum } from "./enums";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  orderId: uuid("order_id").notNull().references(() => orders.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  
  amount: integer("amount").notNull(),
  
  status: paymentStatusEnum("status").default("pending").notNull(),
  
  outTradeNo: varchar("out_trade_no", { length: 64 }).unique().notNull(),
  transactionId: varchar("transaction_id", { length: 64 }),
  
  callbackData: jsonb("callback_data"),
  
  errorMessage: varchar("error_message", { length: 255 }),
  
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("payments_trade_no_idx").on(t.outTradeNo),
  index("payments_order_idx").on(t.orderId),
]);

export const insertPaymentSchema = createInsertSchema(payments);
export const selectPaymentSchema = createSelectSchema(payments);

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
