import { pgTable, bigint, uuid, integer, text, timestamp, index, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { orders } from "./orders";
import { assetTypeEnum } from "./enums";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { Type } from "@sinclair/typebox";

export const assetRecords = pgTable("asset_records", {
  /** 流水ID：使用 BigInt 防止长期运行后溢出 */
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  
  /** 关联用户 */
  userId: uuid("user_id").notNull().references(() => users.id),
  
  /** 变动资产类型 */
  assetId: assetTypeEnum("asset_id").notNull(),
  
  /** 变动数量：正数为获取，负数为消耗 */
  amount: integer("amount").notNull(),
  
  /** [审计核心] 余额快照：记录变动后的 user_assets.balance，用于财务核对 */
  balanceSnapshot: integer("balance_snapshot").notNull(),
  
  /** 关联订单：如果是购买或支付产生的变动，指向 Order (签到等行为可为空) */
  relatedOrderId: uuid("related_order_id").references(() => orders.id),
  
  /** 上下文元数据：记录"用在哪里了" (e.g. { target: 'activity', activity_id: 'xxx' }) */
  metadata: jsonb("metadata"),
  
  /** 人类可读描述：用于前端账单列表展示 (e.g. "购买新手礼包", "使用加速卡") */
  description: text("description"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  // 索引：查某用户的总流水
  index("asset_records_user_idx").on(t.userId),
  // 索引：查某用户特定资产的流水 (e.g. 金币明细)
  index("asset_records_asset_idx").on(t.userId, t.assetId),
  // 索引：财务按时间对账
  index("asset_records_created_idx").on(t.createdAt),
]);

export const assetRecordsRelations = relations(assetRecords, ({ one }) => ({
  user: one(users, { fields: [assetRecords.userId], references: [users.id] }),
  relatedOrder: one(orders, { fields: [assetRecords.relatedOrderId], references: [orders.id] }),
}));

// TypeBox Schemas (使用 drizzle-typebox)
// 使用 Type.Object 重新包装，切断对 drizzle-typebox 内部文件的依赖
// 解决 TypeScript Monorepo 的 TS2742 错误
export const insertAssetRecordSchema = Type.Object({
  ...createInsertSchema(assetRecords).properties
});

export const selectAssetRecordSchema = Type.Object({
  ...createSelectSchema(assetRecords).properties
});

export type AssetRecord = typeof assetRecords.$inferSelect;
export type NewAssetRecord = typeof assetRecords.$inferInsert;