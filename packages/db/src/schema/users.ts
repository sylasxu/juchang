import { pgTable, uuid, varchar, integer, timestamp, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { geometry } from "drizzle-orm/pg-core";
import { genderEnum, membershipEnum } from "./enums";
import { activities } from "./activities";
import { orders } from "./orders";
import { payments } from "./payments";
import { userAssets } from "./user_assets";
import { assetRecords } from "./asset_records";
import { userAuths } from "./user_auths"; // 引入新表
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  /** 微信OpenID：作为查询索引，虽然 Auth 表也有，但这里保留用于快速关联 */
  wxOpenId: varchar("wx_openid", { length: 128 }).notNull().unique(),
  
  /** 手机号：从微信解密后存储，属于资料而非凭证 */
  phoneNumber: varchar("phone_number", { length: 20 }),
  
  nickname: varchar("nickname", { length: 50 }),
  avatarUrl: varchar("avatar_url", { length: 500 }),
  bio: varchar("bio", { length: 200 }),
  
  gender: genderEnum("gender").default("unknown").notNull(),

  // --- 权益与信用 ---
  creditScore: integer("credit_score").default(100).notNull(),
  membershipType: membershipEnum("membership_type").default("none").notNull(),
  membershipExpiresAt: timestamp("membership_expires_at"),

  // --- 皮肤资产（会员权益） ---
  /** 地图图标皮肤：会员活动显示为动态/3D/金色图标 */
  skinMapPin: varchar("skin_map_pin", { length: 50 }), // 如 "golden", "dynamic", "3d"
  /** 头像框皮肤：专属头像框 */
  skinFrame: varchar("skin_frame", { length: 50 }), // 如 "member_gold", "member_silver"
  /** 访客历史：记录谁浏览了用户的活动卡片（JSON数组，存储访客ID和时间戳） */
  visitorHistory: jsonb("visitor_history").$type<Array<{ userId: string; activityId: string; viewedAt: string }>>(),

  // --- LBS ---
  lastLocation: geometry("last_location", { type: "point", mode: "xy", srid: 4326 }),
  lastActiveAt: timestamp("last_active_at"),

  // --- 状态与标记 ---
  interestTags: jsonb("interest_tags").$type<string[]>(),
  // 系统自动计算的 Vibe Tags (如 "夜猫子", "AA党")
  vibeTags: jsonb("vibe_tags").$type<string[]>(), 
  /** 冷启动标记：false=仅授权了微信，未完善资料；true=可正常发起活动 */
  isRegistered: boolean("is_registered").default(false).notNull(),
  isRealNameVerified: boolean("is_real_name_verified").default(false),
  isBlocked: boolean("is_blocked").default(false),
  /** 她模式开关：true=启用她模式过滤（隐藏风险分>60的活动），所有用户均可开启/关闭，默认女性为true */
  isHerModeEnabled: boolean("is_her_mode_enabled").default(false).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("users_location_idx").using("gist", t.lastLocation),
  index("users_wx_openid_idx").on(t.wxOpenId),
]);

export const usersRelations = relations(users, ({ many, one }) => ({
  auths: many(userAuths), // 一个用户可能有多种登录方式（未来扩展）
  activitiesCreated: many(activities, { relationName: "creator" }), // 用户创建的活动（P2P模式：创建者即第一个参与者）
  orders: many(orders),
  payments: many(payments),
  assets: many(userAssets),
  assetRecords: many(assetRecords),
}));



// 🔥 自动化 Zod 生成
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users); // 用于 API 响应

// 导出类型
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;