import { pgTable, uuid, varchar, integer, boolean, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import { productTypeEnum } from "./enums";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  /** 商品名称 (e.g. "100金币包", "新手大礼包") */
  name: varchar("name", { length: 100 }).notNull(),
  
  /** 商品描述 */
  description: varchar("description", { length: 255 }),
  
  /** 商品图标/封面URL */
  iconUrl: varchar("icon_url", { length: 255 }),
  
  /** 商品类型：决定系统如何交付 (e.g. 是直接加币，还是发道具) */
  type: productTypeEnum("type").notNull(),
  
  // --- 价格体系 ---
  /** 法币价格(分)：不为空则支持微信支付 */
  priceCny: integer("price_cny"),
  /** 资产支付类型：不为空则支持用该资产购买 (e.g. 'coin') */
  priceAssetId: varchar("price_asset_id", { length: 50 }),
  /** 资产支付数量 */
  priceAssetAmount: integer("price_asset_amount"),
  
  /** [核心] 交付配置 (Config Payload) */
  /** 定义该商品包含的具体资产列表。e.g. { assets: [{id:'coin', amount:100}, {id:'card', amount:1}] } */
  config: jsonb("config").notNull(),
  
  /** 上下架状态 */
  isActive: boolean("is_active").default(true).notNull(),
  
  /** 排序权重：数字越大越靠前 */
  sortOrder: integer("sort_order").default(0).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  // 索引：按类型查询上架商品
  index("products_type_active_idx").on(t.type, t.isActive),
]);

// TypeBox Schemas (使用 drizzle-typebox)
export const insertProductSchema = createInsertSchema(products);
export const selectProductSchema = createSelectSchema(products);

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;