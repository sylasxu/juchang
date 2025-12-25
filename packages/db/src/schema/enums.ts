import { pgEnum } from "drizzle-orm/pg-core";

// ==========================================
// MVP 精简版枚举定义
// ==========================================

// ==========================================
// 1. 📍 活动业务 (Activity Domain)
// ==========================================

// 活动类型 (保持不变，但移除 study)
export const activityTypeEnum = pgEnum("activity_type", [
  "food",
  "entertainment",
  "sports",
  "boardgame",
  "other"
]);

// 活动状态 (MVP 简化为 3 种)
export const activityStatusEnum = pgEnum("activity_status", [
  "active",     // 进行中
  "completed",  // 已成局
  "cancelled"   // 已取消
]);

// ==========================================
// 2. 👥 参与者 (Participant Domain)
// ==========================================

// 参与者状态 (MVP 简化为 2 种)
export const participantStatusEnum = pgEnum("participant_status", [
  "joined",  // 已加入
  "quit"     // 已退出
]);

// ==========================================
// 3. 💬 消息 (Chat Domain)
// ==========================================

// 消息类型 (MVP 简化为 2 种)
export const messageTypeEnum = pgEnum("message_type", [
  "text",    // 文本消息
  "system"   // 系统消息
]);

// ==========================================
// 4. 🔔 通知 (Notification Domain)
// ==========================================

// 通知类型 (MVP 简化为 5 种)
export const notificationTypeEnum = pgEnum("notification_type", [
  "join",           // 有人报名
  "quit",           // 有人退出
  "activity_start", // 活动即将开始
  "completed",      // 活动成局
  "cancelled"       // 活动取消
]);
