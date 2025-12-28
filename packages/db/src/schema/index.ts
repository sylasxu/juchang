// ==========================================
// Schema Exports - v3.3 行业标准命名
// ==========================================

// 1. Enums (v3.3 移除 messageTypeEnum，改为本地定义)
export * from "./enums";

// 2. Core Tables
export * from "./users";
export * from "./activities";
export * from "./participants";

// 3. Chat System (v3.3 行业标准命名)
export * from "./activity_messages";  // 活动群聊 (原 group_messages)
export * from "./conversations";      // AI 对话历史 (原 home_messages)

// 4. Notification System
export * from "./notifications";

// 5. Relations (must be last to avoid circular imports)
export * from "./relations";

// ==========================================
// v3.3 变更说明：
// - home_messages → conversations (行业标准)
// - group_messages → activity_messages (语义化)
// - homeMessageRoleEnum → conversationRoleEnum
// - homeMessageTypeEnum → conversationMessageTypeEnum
// - messageTypeEnum → activityMessageTypeEnum (本地定义)
// - role 枚举值 ai → assistant (符合 OpenAI 标准)
// - type 字段 → messageType (更明确)
// - activities.status 默认值 active → draft
// ==========================================
