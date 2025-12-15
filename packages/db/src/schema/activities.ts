import { pgTable, uuid, varchar, text, timestamp, integer, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { geometry } from "drizzle-orm/pg-core";
import { users } from "./users";
import { activityTypeEnum, activityStatusEnum, joinModeEnum, feeTypeEnum, riskLevelEnum } from "./enums";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";

export const activities = pgTable("activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  creatorId: uuid("creator_id").notNull().references(() => users.id),

  title: varchar("title", { length: 100 }).notNull(),
  description: text("description"),
  images: jsonb("images").$type<string[]>(),
  
  location: geometry("location", { type: "point", mode: "xy", srid: 4326 }).notNull(),
  locationName: varchar("location_name", { length: 100 }).notNull(),
  address: varchar("address", { length: 255 }),
  locationHint: varchar("location_hint", { length: 100 }), // 重庆地形位置备注
  
  startAt: timestamp("start_at").notNull(),
  endAt: timestamp("end_at"),

  type: activityTypeEnum("type").notNull(),
  maxParticipants: integer("max_participants").default(4).notNull(),
  currentParticipants: integer("current_participants").default(1).notNull(),
  
  feeType: feeTypeEnum("fee_type").default("free").notNull(),
  estimatedCost: integer("estimated_cost").default(0),
  
  joinMode: joinModeEnum("join_mode").default("instant").notNull(),
  
  riskScore: integer("risk_score").default(0).notNull(),
  riskLevel: riskLevelEnum("risk_level").default("low").notNull(),
  
  tags: jsonb("tags").$type<string[]>(),
  genderRequirement: varchar("gender_requirement", { length: 20 }).default("all"),
  minReliabilityRate: integer("min_reliability_rate").default(0),
  
  status: activityStatusEnum("status").default("published").notNull(),
  
  isConfirmed: boolean("is_confirmed").default(false).notNull(),
  confirmedAt: timestamp("confirmed_at"),
  
  // --- 隐私设置 ---
  isLocationBlurred: boolean("is_location_blurred").default(false).notNull(),
  
  // --- 增值服务 ---
  isBoosted: boolean("is_boosted").default(false).notNull(),
  boostExpiresAt: timestamp("boost_expires_at"),
  boostCount: integer("boost_count").default(0).notNull(),
  isPinPlus: boolean("is_pin_plus").default(false).notNull(),
  pinPlusExpiresAt: timestamp("pin_plus_expires_at"),
  
  // --- 运营标记 ---
  isGhost: boolean("is_ghost").default(false).notNull(),
  ghostAnchorType: varchar("ghost_anchor_type", { length: 20 }), // 锚点类型：demand, promotion
  ghostSuggestedType: activityTypeEnum("ghost_suggested_type"), // 建议的活动类型
  
  // --- 群聊状态 (整合 chat_groups) ---
  chatStatus: varchar("chat_status", { length: 20 }).default("active").notNull(), // active, archived
  chatArchivedAt: timestamp("chat_archived_at"), // 群聊归档时间

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("activities_location_idx").using("gist", t.location),
  index("activities_start_at_idx").on(t.startAt),
  index("activities_status_idx").on(t.status),
  index("activities_type_idx").on(t.type),
]);

export const insertActivitySchema = createInsertSchema(activities);
export const selectActivitySchema = createSelectSchema(activities);

export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;
