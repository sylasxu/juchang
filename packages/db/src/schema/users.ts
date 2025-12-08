import { pgTable, uuid, varchar, integer, timestamp, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { geometry } from "drizzle-orm/pg-core";
// 确保你的 enums.ts 里定义了 membershipEnum，例如: pgEnum("membership_type", ["none", "monthly", "yearly", "permanent"])
import { genderEnum, membershipTierEnum } from "./enums"; 
import { activities } from "./activities";
import { orders } from "./orders";
import { payments } from "./payments";
import { userAssets } from "./user_assets";
import { assetRecords } from "./asset_records";
import { userAuths } from "./user_auths";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { Type } from "@sinclair/typebox";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // --- 核心索引字段 ---
  wxOpenId: varchar("wx_openid", { length: 128 }).notNull().unique(),
  phoneNumber: varchar("phone_number", { length: 20 }),
  
  // --- 基础资料 ---
  nickname: varchar("nickname", { length: 50 }),
  avatarUrl: varchar("avatar_url", { length: 500 }),
  bio: varchar("bio", { length: 200 }),
  gender: genderEnum("gender").default("unknown").notNull(),

  // --- 信用体系 (PRD 1.2) ---
  creditScore: integer("credit_score").default(100).notNull(),

  // --- 👑 VIP 会员体系 (恢复) ---
  // 用于判断用户是否有全局权益（如免广告、高亮昵称、创建活动免审核等）
  membershipType: membershipTierEnum("membership_type").default("none").notNull(),
  // 过期时间：后端需定期检查或在 API 层校验是否 > now()
  membershipExpiresAt: timestamp("membership_expires_at"),

  // --- 🎒 装备/皮肤 (PRD 1.1) ---
  // 这里存的是“当前佩戴”的物品 ID。
  // 注意：如果皮肤本身有有效期（如限时皮肤），逻辑层需要检查是否过期，过期则自动卸下
  skinMapPin: varchar("skin_map_pin", { length: 50 }), // 地图 Pin 皮肤 ID
  skinFrame: varchar("skin_frame", { length: 50 }),    // 头像框 ID

  // --- 勋章墙 (PRD 3.4) ---
  // 建议用 JSONB 数组存已解锁的勋章 ID，比关联表查询更快
  unlockedBadges: jsonb("unlocked_badges").$type<string[]>().default([]),

  // --- 访客统计 ---
  // ❌ 移除 visitorHistory JSONB (防卡顿)
  // ✅ 改为只存总数，详情去 user_visitors 表查
  viewCount: integer("view_count").default(0),

  // --- LBS & 状态 (PRD 3.1 & 4.3) ---
  lastLocation: geometry("last_location", { type: "point", mode: "xy", srid: 4326 }),
  lastActiveAt: timestamp("last_active_at"),

  // --- 标签与画像 (PRD 4.4) ---
  interestTags: jsonb("interest_tags").$type<string[]>(),
  vibeTags: jsonb("vibe_tags").$type<string[]>(), // 评价生成的标签

  // --- 系统开关 ---
  isRegistered: boolean("is_registered").default(false).notNull(),
  isRealNameVerified: boolean("is_real_name_verified").default(false),
  isBlocked: boolean("is_blocked").default(false),
  isHerModeEnabled: boolean("is_her_mode_enabled").default(false).notNull(), // 她模式
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("users_location_idx").using("gist", t.lastLocation),
  index("users_wx_openid_idx").on(t.wxOpenId),
  index("users_credit_score_idx").on(t.creditScore), // 方便筛选 "靠谱分 > 90"
  index("users_membership_idx").on(t.membershipType), // 方便运营统计 VIP 用户
]);

export const usersRelations = relations(users, ({ many }) => ({
  auths: many(userAuths),
  activitiesCreated: many(activities, { relationName: "creator" }),
  orders: many(orders),
  payments: many(payments),
  assets: many(userAssets),
  assetRecords: many(assetRecords),
}));

// TypeBox Schemas (使用 drizzle-typebox)
// 使用 Type.Object 重新包装，切断对 drizzle-typebox 内部文件的依赖
// 解决 TypeScript Monorepo 的 TS2742 错误
export const insertUserSchema = Type.Object({
  ...createInsertSchema(users).properties
});

export const selectUserSchema = Type.Object({
  ...createSelectSchema(users).properties
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;