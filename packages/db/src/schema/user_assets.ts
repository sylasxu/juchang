import { pgTable, uuid, varchar, integer, timestamp, primaryKey, index, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
// 注意：assetTypeEnum 替代了原来的 category/id enum，只定义大类
import { assetTypeEnum } from "./enums"; 

export const userAssets = pgTable("user_assets", {
  /** 关联用户ID */
  userId: uuid("user_id").notNull().references(() => users.id),
  
  /** 
   * 资产大类 (Type)
   * 用于前端分类显示 (Wallet, Bag, Skins)
   * Enum: ["currency", "prop", "skin", "badge"]
   */
  type: assetTypeEnum("type").notNull(),

  /** 
   * 资产唯一标识 (SKU ID)
   * ⚠️ 必须是 String，不能是 Enum，以支持无限扩展
   * e.g., "pal_coin", "card_top_priority", "skin_frame_golden_v1"
   */
  assetId: varchar("asset_id", { length: 100 }).notNull(),
  
  /** 
   * 余额/数量
   * - 货币：存金额 (如 100)
   * - 道具：存数量 (如 5)
   * - 皮肤：通常是 1 (拥有) 或 0 (未拥有)
   */
  balance: integer("balance").notNull().default(0),
  
  /** 
   * 扩展属性 (Metadata)
   * 解决复杂业务场景，例如：
   * - 皮肤：{ "equipped": true } (是否佩戴中)
   * - 道具：{ "expires_at": "2025-12-31" } (有效期)
   */
  metadata: jsonb("metadata"),

  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  // 复合主键：确保一个用户对同一个 assetId 只有一条记录
  // 相比 user_inventory，这大大简化了去重逻辑
  primaryKey({ columns: [t.userId, t.assetId] }),
  
  // 索引：加速"查看我的道具包" (e.g. SELECT * FROM assets WHERE type = 'prop')
  index("user_assets_type_idx").on(t.userId, t.type),
]);

export const userAssetsRelations = relations(userAssets, ({ one }) => ({
  user: one(users, {
    fields: [userAssets.userId],
    references: [users.id],
  }),
}));