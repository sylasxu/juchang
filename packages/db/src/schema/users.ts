import { pgTable, uuid, varchar, integer, timestamp, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { geometry } from "drizzle-orm/pg-core";
import { genderEnum, membershipTypeEnum } from "./enums"; 
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // --- 核心索引字段 ---
  wxOpenId: varchar("wx_openid", { length: 128 }).notNull().unique(),
  phoneNumber: varchar("phone_number", { length: 20 }),
  
  // --- 认证信息 (整合 user_auths) ---
  lastLoginIp: varchar("last_login_ip", { length: 45 }),
  lastLoginAt: timestamp("last_login_at"),
  
  // --- 基础资料 ---
  nickname: varchar("nickname", { length: 50 }),
  avatarUrl: varchar("avatar_url", { length: 500 }),
  bio: varchar("bio", { length: 200 }),
  gender: genderEnum("gender").default("unknown").notNull(),

  // --- 靠谱度 ---
  participationCount: integer("participation_count").default(0).notNull(),
  fulfillmentCount: integer("fulfillment_count").default(0).notNull(),
  disputeCount: integer("dispute_count").default(0).notNull(), // 争议次数（申诉次数）
  
  // --- 统计数据 ---
  activitiesCreatedCount: integer("activities_created_count").default(0).notNull(),
  feedbackReceivedCount: integer("feedback_received_count").default(0).notNull(),

  // --- 会员与额度 ---
  membershipType: membershipTypeEnum("membership_type").default("free").notNull(),
  membershipExpiresAt: timestamp("membership_expires_at"),
  aiCreateQuotaToday: integer("ai_create_quota_today").default(3).notNull(), // 今日AI建局剩余
  aiSearchQuotaToday: integer("ai_search_quota_today").default(10).notNull(), // 今日AI搜索剩余
  aiQuotaResetAt: timestamp("ai_quota_reset_at"),                            // 额度重置时间

  // --- LBS ---
  lastLocation: geometry("last_location", { type: "point", mode: "xy", srid: 4326 }),
  lastActiveAt: timestamp("last_active_at"),

  // --- 标签 ---
  interestTags: jsonb("interest_tags").$type<string[]>(),

  // --- 系统状态 ---
  isRegistered: boolean("is_registered").default(false).notNull(),
  isRealNameVerified: boolean("is_real_name_verified").default(false).notNull(),
  isBlocked: boolean("is_blocked").default(false).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("users_location_idx").using("gist", t.lastLocation),
  index("users_wx_openid_idx").on(t.wxOpenId),
]);

// Relations defined in separate file to avoid circular imports

// TypeBox Schemas
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
