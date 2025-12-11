import { pgEnum } from "drizzle-orm/pg-core";

// ==========================================
// 1. 👤 用户与身份 (User & Identity)
// ==========================================

export const genderEnum = pgEnum("gender", ["unknown", "male", "female"]);

export const authProviderEnum = pgEnum("auth_provider", [
  "wechat_miniprogram",
  "phone_sms",
]);

// 会员类型
export const membershipTypeEnum = pgEnum("membership_type", [
  "free",
  "pro"
]);

// ==========================================
// 2. 📍 活动业务 (Activity Domain)
// ==========================================

export const activityTypeEnum = pgEnum("activity_type", [
  "food",
  "entertainment",
  "sports",
  "study",
  "other"
]);

export const joinModeEnum = pgEnum("join_mode", ["instant", "approval"]);

export const activityStatusEnum = pgEnum("activity_status", [
  "published",
  "full",
  "ongoing",
  "finished",
  "cancelled"
]);

export const feeTypeEnum = pgEnum("fee_type", ["free", "aa", "treat"]);

export const riskLevelEnum = pgEnum("risk_level", ["low", "medium", "high"]);

// ==========================================
// 3. 👥 参与者 (Participant Domain)
// ==========================================

export const participantStatusEnum = pgEnum("participant_status", [
  "pending",
  "approved",
  "rejected",
  "fulfilled",   // 履约成功
  "absent",      // 违约（未到场）
  "quit"         // 主动退出
]);

// ==========================================
// 4. 💬 群聊与消息 (Chat Domain)
// ==========================================

export const chatGroupStatusEnum = pgEnum("chat_group_status", [
  "active",
  "archived"
]);

export const messageTypeEnum = pgEnum("message_type", [
  "text",
  "image",
  "system",
  "location"
]);

// ==========================================
// 5. 🔔 通知 (Notification Domain)
// ==========================================

export const notificationTypeEnum = pgEnum("notification_type", [
  "application",
  "approved",
  "rejected",
  "activity_remind",
  "feedback_received",
  "system"
]);

// ==========================================
// 6. 👎 差评反馈 (Feedback Domain)
// ==========================================

export const feedbackReasonEnum = pgEnum("feedback_reason", [
  "late",           // 迟到
  "no_show",        // 放鸽子
  "bad_attitude",   // 态度不好
  "not_as_described", // 与描述不符
  "other"           // 其他
]);

// ==========================================
// 7. 💸 支付 (Payment Domain)
// ==========================================

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "paid",
  "failed",
  "refunded"
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "success",
  "failed",
  "refunded"
]);

// ==========================================
// 8. 📊 申诉 (Dispute Domain)
// ==========================================

export const disputeStatusEnum = pgEnum("dispute_status", [
  "pending",      // 待处理（24h内）
  "accepted",     // 申诉成功
  "expired"       // 超时未申诉
]);

// ==========================================
// 9. 💎 增值服务 (Premium Services)
// ==========================================

export const premiumServiceTypeEnum = pgEnum("premium_service_type", [
  "boost",        // 强力召唤
  "pin_plus",     // 黄金置顶
  "fast_pass",    // 优先入场券
  "ai_report",    // AI深度报告
  "ai_pack",      // AI额度包
  "pro_monthly"   // Pro月费会员
]);
