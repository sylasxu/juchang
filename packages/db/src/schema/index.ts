// ==========================================
// Schema Exports - MVP V9.2 Integrated
// ==========================================

// 1. Enums
export * from "./enums";

// 2. Core Tables (整合后)
export * from "./users";           // 整合了 user_auths
export * from "./activities";      // 整合了 chat_groups
export * from "./participants";

// 3. Chat System (简化)
export * from "./chat_messages";   // 直接关联 activities

// 4. Feedback System
export * from "./feedbacks";

// 5. Notification System
export * from "./notifications";

// 6. Payment System (整合)
export * from "./transactions";    // 整合了 orders + payments

// 7. Action Logs (审计日志)
export * from "./action_logs";

// 8. Relations (must be last to avoid circular imports)
export * from "./relations";
