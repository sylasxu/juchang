import { pgTable, uuid, jsonb, timestamp, index, pgEnum } from "drizzle-orm/pg-core";
import { users } from "./users";
import { activities } from "./activities";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";

/**
 * AI 对话历史表 (v3.3 行业标准命名)
 * 
 * 这是 Chat-First 架构的核心表，存储用户与 AI 的交互历史。
 * 
 * 命名说明：
 * - 表名 conversations 符合行业标准（对话/会话表通用命名）
 * - role 使用 user/assistant 符合 OpenAI API 标准
 * - messageType 比 type 更明确
 * 
 * 设计说明：
 * - role: 区分用户消息和 AI 回复
 * - messageType: 决定前端渲染哪种 Widget
 * - content: JSONB 存储灵活的卡片数据
 * - activityId: 如果卡片对应真实活动（如 widget_draft、widget_share）
 */

// 对话角色枚举 (行业标准命名，使用 assistant 符合 OpenAI 标准)
export const conversationRoleEnum = pgEnum("conversation_role", [
  "user",       // 用户发送的消息
  "assistant"   // AI 回复的消息 (符合 OpenAI 标准)
]);

// 对话消息类型枚举 (v3.3 含 Generative UI + Composite Widget + Simple Widget)
export const conversationMessageTypeEnum = pgEnum("conversation_message_type", [
  "text",              // 普通文本
  "widget_dashboard",  // 进场欢迎卡片 (简化版)
  "widget_launcher",   // 组局发射台 (复合型卡片 - v3.3 新增)
  "widget_action",     // 快捷操作按钮 (简单跳转 - v3.3 新增)
  "widget_draft",      // 意图解析卡片 (带地图选点)
  "widget_share",      // 创建成功卡片
  "widget_explore",    // 探索卡片 (Generative UI)
  "widget_error"       // 错误提示卡片
]);

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  userId: uuid("user_id").notNull().references(() => users.id),
  
  // 角色：用户说的 or AI 回复的 (使用 assistant 而非 ai，符合 OpenAI 标准)
  role: conversationRoleEnum("role").notNull(),
  
  // 消息类型：Chat-First 的灵魂，决定前端渲染哪种 Widget
  messageType: conversationMessageTypeEnum("message_type").notNull(),
  
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
  index("conversations_user_idx").on(t.userId),
  index("conversations_created_idx").on(t.createdAt),
  index("conversations_activity_idx").on(t.activityId),
]);

// TypeBox Schemas
export const insertConversationSchema = createInsertSchema(conversations);
export const selectConversationSchema = createSelectSchema(conversations);

// TypeScript 类型
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
