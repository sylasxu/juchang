import { pgTable, uuid, varchar, integer, timestamp, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { geometry } from "drizzle-orm/pg-core";
import { genderEnum, membershipEnum } from "./enums";
import { activities } from "./activities";
import { orders } from "./orders";
import { payments } from "./payments";
import { userAssets } from "./user_assets";
import { assetRecords } from "./asset_records";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  /** 微信OpenID：唯一身份标识 */
  wxOpenId: varchar("wx_openid", { length: 128 }).notNull().unique(),
  phoneNumber: varchar("phone_number", { length: 20 }),
  
  nickname: varchar("nickname", { length: 50 }),
  avatarUrl: varchar("avatar_url", { length: 255 }),
  bio: varchar("bio", { length: 200 }),
  
  /** 性别：用于资料展示及她模式判断 */
  gender: genderEnum("gender").default("unknown").notNull(),

  // --- 权益与信用 ---
  /** 信用分：影响活动报名通过率 */
  creditScore: integer("credit_score").default(100).notNull(),
  
  /** 会员类型：决定折扣逻辑 */
  membershipType: membershipEnum("membership_type").default("none").notNull(),
  /** 会员过期时间：NULL或过去时间为失效 */
  membershipExpiresAt: timestamp("membership_expires_at"),

  // --- LBS ---
  /** 最后位置：用于推荐"附近的人" */
  lastLocation: geometry("last_location", { type: "point", mode: "xy", srid: 4326 }),
  lastActiveAt: timestamp("last_active_at"),

  // --- 扩展 ---
  interestTags: jsonb("interest_tags").$type<string[]>(),
  isRealNameVerified: boolean("is_real_name_verified").default(false),
  isBlocked: boolean("is_blocked").default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  // 空间索引：查找附近的用户
  index("users_location_idx").using("gist", t.lastLocation),
  index("users_phone_idx").on(t.phoneNumber),
]);

export const usersRelations = relations(users, ({ many }) => ({
  activitiesHosted: many(activities),
  orders: many(orders),
  payments: many(payments),
  assets: many(userAssets),
  assetRecords: many(assetRecords),
}));