import { pgTable, uuid, varchar, text, timestamp, integer, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { geometry } from "drizzle-orm/pg-core";
import { users } from "./users";
import { participants } from "./participants";
import { activityTypeEnum, activityStatusEnum } from "./enums";

export const activities = pgTable("activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // 发起人 (Host)
  hostId: uuid("host_id").notNull().references(() => users.id),

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
  // 费用 (0为免费，大于0为付费活动)，后续 Order 模块会用到
  price: integer("price").default(0).notNull(), 
  
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
  host: one(users, {
    fields: [activities.hostId],
    references: [users.id],
  }),
  participants: many(participants),
}));