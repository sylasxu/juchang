import { pgTable, uuid, varchar, integer, timestamp, boolean, text, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { geometry } from "drizzle-orm/pg-core"; 
import { users } from "./users";
import { activityParticipants } from "./participants";
import { activityTypeEnum, activityStatusEnum, riskLevelEnum } from "./enums";

export const activities = pgTable("activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  /** 发起人 */
  hostId: uuid("host_id").notNull().references(() => users.id),
  
  /** 活动标题 */
  title: varchar("title", { length: 100 }).notNull(),
  description: text("description"),
  type: activityTypeEnum("type").notNull(),
  
  /** [核心] 地理位置：PostGIS 点坐标，用于"附近活动"查询 */
  location: geometry("location", { type: "point", mode: "xy", srid: 4326 }).notNull(),
  addressName: varchar("address_name", { length: 255 }).notNull(), // e.g. "朝阳大悦城"
  addressDetail: varchar("address_detail", { length: 255 }), // e.g. "8层 电影院"
  
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  
  /** 人数限制 */
  minParticipants: integer("min_participants").default(2),
  maxParticipants: integer("max_participants").default(6).notNull(),
  
  /** [缓存] 当前已通过人数：避免每次渲染地图标记都 count(*) */
  currentParticipants: integer("current_participants").default(0).notNull(),
  
  /** 费用(分)：0表示AA或免费，仅做展示 */
  feeAmount: integer("fee_amount").default(0),
  
  /** 状态控制 */
  status: activityStatusEnum("status").default("published").notNull(),
  
  /** 风控等级：High 则需审核 */
  riskLevel: riskLevelEnum("risk_level").default("low"),
  
  /** 她模式：True 则地图仅对女性可见，且限制仅女性报名 */
  isFemaleFriendly: boolean("is_female_friendly").default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  // [关键] 空间索引 (GIST)：ST_DWithin 查询必备
  index("activities_geo_idx").using("gist", t.location),
  // 时间索引：筛选今天/周末
  index("activities_time_idx").on(t.startTime),
  // 宿主索引：查我发起的活动
  index("activities_host_idx").on(t.hostId),
]);

export const activitiesRelations = relations(activities, ({ one, many }) => ({
  host: one(users, {
    fields: [activities.hostId],
    references: [users.id],
  }),
  participants: many(activityParticipants),
}));