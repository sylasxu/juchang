import { pgTable, uuid, integer, timestamp, primaryKey, index, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { assetIdEnum, assetCategoryEnum } from "./enums";

export const userAssets = pgTable("user_assets", {
  /** 关联用户ID */
  userId: uuid("user_id").notNull().references(() => users.id),
  
  /** 资产ID (SKU)：区分是金币、积分还是某种道具 */
  assetId: assetIdEnum("asset_id").notNull(),
  
  /** 资产大类：冗余字段，用于快速筛选 (e.g. 显示"我的所有道具") */
  category: assetCategoryEnum("category").notNull(),
  
  /** 余额/数量：货币存金额，道具存数量 */
  balance: integer("balance").notNull().default(0),
  
  /** 属性元数据：用于存储道具的有效期、特定属性等 (e.g. { expire_at: '2025-12-31' }) */
  metadata: jsonb("metadata"),

  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  // 复合主键：确保一个用户对一种资产只有一条记录
  primaryKey({ columns: [t.userId, t.assetId] }),
  
  // 索引：加速"查看我的道具包"查询
  index("user_assets_category_idx").on(t.userId, t.category),
]);

export const userAssetsRelations = relations(userAssets, ({ one }) => ({
  user: one(users, {
    fields: [userAssets.userId],
    references: [users.id],
  }),
}));