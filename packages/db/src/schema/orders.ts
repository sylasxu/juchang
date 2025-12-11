import { pgTable, uuid, integer, varchar, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { users } from "./users";
import { orderStatusEnum } from "./enums";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  userId: uuid("user_id").notNull().references(() => users.id),
  
  productType: varchar("product_type", { length: 50 }).notNull(),
  productName: varchar("product_name", { length: 100 }).notNull(),
  
  amount: integer("amount").notNull(),
  
  status: orderStatusEnum("status").default("pending").notNull(),
  
  metadata: jsonb("metadata"),
  
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("orders_user_idx").on(t.userId),
  index("orders_status_idx").on(t.status),
]);

export const insertOrderSchema = createInsertSchema(orders);
export const selectOrderSchema = createSelectSchema(orders);

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
