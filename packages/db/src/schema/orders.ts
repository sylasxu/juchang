import { pgTable, uuid, integer, varchar, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { products } from "./products";
import { assetRecords } from "./asset_records";
import { payments } from "./payments";
import { orderStatusEnum, paymentMethodEnum } from "./enums";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  /** 买家ID */
  userId: uuid("user_id").notNull().references(() => users.id),
  
  /** 关联商品ID */
  productId: uuid("product_id").references(() => products.id),
  
  /** 商品快照名称：防止商品改名后订单历史显示错误 */
  snapshotName: varchar("snapshot_name", { length: 100 }).notNull(),
  
  /** 商品快照配置：防止商品内容调整后无法追溯当时买了什么 */
  snapshotConfig: jsonb("snapshot_config"),
  
  /** 支付方式：记录意图 (wechat, asset) */
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  
  /** 实际需支付法币(分) */
  totalAmountCny: integer("total_amount_cny").default(0),
  
  /** 实际需支付资产类型 (e.g. 'coin') */
  payAssetId: varchar("pay_asset_id", { length: 50 }),
  
  /** 实际需支付资产数量 */
  payAssetAmount: integer("pay_asset_amount").default(0),
  
  /** 订单状态 */
  status: orderStatusEnum("status").default("pending").notNull(),
  
  /** 业务元数据：记录送礼对象、充值来源等 (e.g. { recipient_id: "..." }) */
  metadata: jsonb("metadata"),
  
  /** 业务完成时间 */
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  // 索引：查我的订单
  index("orders_user_idx").on(t.userId),
]);

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  product: one(products, { fields: [orders.productId], references: [products.id] }),
  payments: many(payments),
  assetRecords: many(assetRecords),
}));

// TypeBox Schemas (使用 drizzle-typebox)
export const insertOrderSchema = createInsertSchema(orders);
export const selectOrderSchema = createSelectSchema(orders);

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;