// ==========================================
// Schema Exports - v4.0 Smart Broker (3表精简版)
// ==========================================

// 1. Enums
export * from "./enums";

// 2. Core Tables
export * from "./users";
export * from "./activities";
export * from "./participants";

// 3. Chat System (v3.3 行业标准命名)
export * from "./activity_messages";  // 活动群聊
export * from "./conversations";      // AI 对话历史

// 4. Notification System
export * from "./notifications";

// 5. Report System (内容审核)
export * from "./reports";

// 6. Partner Intent System (v4.0 Smart Broker - 3表精简版)
export * from "./partner-intents";    // 搭子意向
export * from "./intent-matches";     // 意向匹配 (含 intentIds[], userIds[] 数组)
export * from "./match-messages";     // 匹配消息 (直接关联 matchId)

// 7. Relations (must be last to avoid circular imports)
export * from "./relations";

// ==========================================
// v4.0 变更说明 (3表精简版):
// - partner_intents: 搭子意向 (保持不变)
// - intent_matches: 意向匹配 (新增 intentIds[], userIds[] 数组，移除 liteChatId)
// - match_messages: 匹配消息 (直接关联 matchId，替代 lite_chat_messages)
// 
// 删除的表:
// - intent_match_members (用 uuid[] 数组替代)
// - lite_chats (Match 本身就是群组)
// - lite_chat_messages (改为 match_messages)
// ==========================================
