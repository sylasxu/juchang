// ==========================================
// Schema Exports - MVP 精简版
// ==========================================

// 1. Enums (MVP 简化)
export * from "./enums";

// 2. Core Tables (MVP 保留)
export * from "./users";
export * from "./activities";
export * from "./participants";

// 3. Chat System (MVP 简化)
export * from "./chat_messages";

// 4. Notification System (MVP 简化)
export * from "./notifications";

// 5. Relations (must be last to avoid circular imports)
export * from "./relations";

// ==========================================
// MVP 移除的表：
// - feedbacks (复杂反馈系统)
// - transactions (支付功能)
// - action_logs (审计日志)
// ==========================================
