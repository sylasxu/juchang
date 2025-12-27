import { pgTable, uuid, jsonb, timestamp, index, pgEnum } from "drizzle-orm/pg-core";
import { users } from "./users";
import { activities } from "./activities";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";

/**
 * 首页 AI 对话流表 (v3.2 Chat-First)
 * 
 * 这是 Chat-First 架构的核心表，存储用户与 AI 的交互历史。
 * 
 * 设计说明：
 * - role: 区分用户消息和 AI 回复
 * - type: 决定前端渲染哪种 Widget
 * - content: JSONB 存储灵活的卡片数据
 * - activityId: 如果卡片对应真实活动（如 widget_draft、widget_share）
 */

// 消息角色枚举
export const homeMessageRoleEnum = pgEnum("home_message_role", [
  "user",  // 用户发送的消息
  "ai"     // AI 回复的消息
]);

// 消息类型枚举 (v3.3 含 Generative UI + Composite Widget + Simple Widget)
export const homeMessageTypeEnum = pgEnum("home_message_type", [
  "text",              // 普通文本
  "widget_dashboard",  // 进场欢迎卡片 (简化版)
  "widget_launcher",   // 组局发射台 (复合型卡片 - v3.3 新增)
  "widget_action",     // 快捷操作按钮 (简单跳转 - v3.3 新增)
  "widget_draft",      // 意图解析卡片 (带地图选点)
  "widget_share",      // 创建成功卡片
  "widget_explore",    // 探索卡片 (Generative UI)
  "widget_error"       // 错误提示卡片
]);

export const homeMessages = pgTable("home_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  userId: uuid("user_id").notNull().references(() => users.id),
  
  // 角色：用户说的 or AI 回复的
  role: homeMessageRoleEnum("role").notNull(),
  
  // 类型：Chat-First 的灵魂，决定前端渲染哪种 Widget
  type: homeMessageTypeEnum("type").notNull(),
  
  // 内容：JSONB 存储灵活的卡片数据
  // text: { text: string }
  // widget_dashboard: { greeting: string; activities: Activity[] }
  // widget_launcher: { title: string; badge: string; showTools: boolean }
  // widget_action: { label: string; icon?: string; url?: string; variant?: 'primary'|'secondary'|'ghost' }
  // widget_draft: { title, lat, lng, startAt, type, locationName, ... }
  // widget_share: { activityId, title, shareTitle, ... }
  // widget_explore: { center, results, title }
  // widget_error: { message: string }
  content: jsonb("content").notNull(),
  
  // 关联：如果卡片对应真实活动
  activityId: uuid("activity_id").references(() => activities.id),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("home_messages_user_idx").on(t.userId),
  index("home_messages_created_idx").on(t.createdAt),
  index("home_messages_activity_idx").on(t.activityId),
]);

// TypeBox Schemas
export const insertHomeMessageSchema = createInsertSchema(homeMessages);
export const selectHomeMessageSchema = createSelectSchema(homeMessages);

// TypeScript 类型
export type HomeMessage = typeof homeMessages.$inferSelect;
export type NewHomeMessage = typeof homeMessages.$inferInsert;
