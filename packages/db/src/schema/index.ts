// ==========================================
// Schema Exports - v3.2 Chat-First
// ==========================================

// 1. Enums (v3.2 新增 home_message 相关枚举)
export * from "./enums";

// 2. Core Tables
export * from "./users";
export * from "./activities";
export * from "./participants";

// 3. Chat System (v3.2 重构)
export * from "./group_messages";  // 活动群聊 (原 chat_messages)
export * from "./home_messages";   // 首页 AI 对话流 (新增)

// 4. Notification System
export * from "./notifications";

// 5. Relations (must be last to avoid circular imports)
export * from "./relations";

// ==========================================
// v3.2 变更说明：
// - 新增 home_messages 表 (Chat-First 核心)
// - chat_messages 重命名为 group_messages
// - activityStatusEnum 新增 draft 状态
// ==========================================
