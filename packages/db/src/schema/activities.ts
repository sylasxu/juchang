import { pgTable, uuid, varchar, text, timestamp, integer, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { geometry } from "drizzle-orm/pg-core";
import { users } from "./users";
import { participants } from "./participants";
import { activityTypeEnum, activityStatusEnum, joinModeEnum, riskLevelEnum } from "./enums";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";

export const activities = pgTable("activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // 发起人 (Creator) - P2P模式：创建者即第一个参与者，无特殊权限
  creatorId: uuid("creator_id").notNull().references(() => users.id),

  // 核心内容
  title: varchar("title", { length: 100 }).notNull(),
  description: text("description"), // 富文本或长文本，AI 分析重点
  images: jsonb("images").$type<string[]>(), // 图片列表
  
  // LBS (核心)
  location: geometry("location", { type: "point", mode: "xy", srid: 4326 }).notNull(),
  locationName: varchar("location_name", { length: 100 }), // 如：观音桥大融城
  address: varchar("address", { length: 255 }), // 详细地址
  
  // 时间
  startAt: timestamp("start_at").notNull(),
  endAt: timestamp("end_at"),

  // 规则与限制
  type: activityTypeEnum("type").notNull(),
  maxParticipants: integer("max_participants").default(4).notNull(),
  // 费用类型：仅作信息展示，用户需在线下自行结算（free=免费, aa=AA制, treat=我请）
  feeType: varchar("fee_type", { length: 20 }).default("free").notNull(), // free, aa, treat
  // 预估费用（仅信息展示，单位：元）：用于信息展示，不涉及交易
  estimatedCost: integer("estimated_cost").default(0), // 预估费用，仅作参考
  // 加入模式：instant=即时加入，approval=需要创建者审核
  joinMode: joinModeEnum("join_mode").default("instant").notNull(),
  // 风险分（RiskScore）：0-100分，基于时间/地点、发起者资料质量、发起者历史综合计算
  riskScore: integer("risk_score").default(0).notNull(), // 风险分，>60分为高风险
  // 风险等级：基于riskScore自动计算（low/medium/high），用于快速筛选
  riskLevel: riskLevelEnum("risk_level").default("low").notNull(), 
  
  // AI 匹配字段 (预留)
  tags: jsonb("tags").$type<string[]>(), // 如 ["羽毛球", "新手友好"]
  genderRequirement: varchar("gender_requirement", { length: 20 }).default("all"), // all, male, female
  
  // 状态
  status: activityStatusEnum("status").default("published").notNull(),
  isFemaleFriendly: boolean("is_female_friendly").default(false), // 她模式标记

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  // LBS 核心索引：GIST 索引用于高效的空间查询 (ST_DWithin)
  index("activities_location_idx").using("gist", t.location),
  index("activities_start_at_idx").on(t.startAt),
]);

export const activitiesRelations = relations(activities, ({ one, many }) => ({
  creator: one(users, {
    fields: [activities.creatorId],
    references: [users.id],
    relationName: "creator",
  }),
  participants: many(participants),
}));

// TypeBox Schemas (使用 drizzle-typebox)
export const insertActivitySchema = createInsertSchema(activities);
export const selectActivitySchema = createSelectSchema(activities);

export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;