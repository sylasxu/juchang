import { pgEnum } from "drizzle-orm/pg-core";

// ==========================================
// 1. 👤 用户与身份 (User & Identity)
// ==========================================

export const genderEnum = pgEnum("gender", ["unknown", "male", "female"]);

/** 
 * 订阅/会员层级
 * 对应 users.membership_tier
 */
export const membershipTierEnum = pgEnum("membership_tier", [
  "none",           // 普通用户
  "plus_monthly",   // 月卡会员
  "plus_yearly",    // 年卡会员
  "plus_permanent"  // 终身会员
]);

/** 
 * 认证提供商
 * 对应 user_auths.provider
 */
export const authProviderEnum = pgEnum("auth_provider", [
  "wechat_miniprogram", // 微信小程序
  "phone_sms",          // 手机验证码
  "apple_signin",       // Apple ID
  "wechat_open"         // 微信开放平台(App)
]);

// ==========================================
// 2. 🎒 资产与经济 (Assets & Economy)
// ==========================================

/**
 * 资产类型 (大类)
 * 对应 user_assets.type
 * 决定了该资产在前端哪个 Tab 展示，以及具备什么基础属性
 */
export const assetTypeEnum = pgEnum("asset_type", [
  "currency",     // 货币 (如 Pal 币) -> 存金额
  "prop",         // 道具 (如 置顶卡) -> 存数量，可消耗
  "skin",         // 外观 (如 地图Pin、头像框) -> 存拥有状态(1/0)
  "badge"         // 徽章 (如 认证标识) -> 存拥有状态(1/0)
]);

/**
 * 账本/流水类型
 * 对应 asset_records.entry_type
 * 记录"钱/物"是因为什么变动的
 */
export const ledgerEntryTypeEnum = pgEnum("ledger_entry_type", [
  // --- Income (增加) ---
  "deposit_recharge",      // 充值存入
  "award_activity",        // 活动/任务奖励
  "award_system",          // 系统/客服补发
  "refund_return",         // 退款退回
  "gift_received",         // 收到礼物

  // --- Outflow (减少) ---
  "payment_purchase",      // 购买商品/服务
  "fee_service",           // AI服务费/手续费
  "deposit_freeze",        // 支付押金 (冻结)
  "penalty_deduction",     // 违约扣除/罚没
  "gift_sent",             // 送出礼物
  "consume_prop"           // 使用道具 (消耗库存)
]);

// ==========================================
// 3. 🛍️ 商业化 (Commerce & Products)
// ==========================================

/**
 * 商品类型
 * 对应 products.type
 * 决定系统如何"发货"
 */
export const productTypeEnum = pgEnum("product_type", [
  "coin_bundle",    // 金币包 (发货：加 currency余额)
  "asset_bundle",   // 资产包 (发货：按 config 列表往 assets 表塞东西)
  "subscription"    // 订阅制 (发货：修改 users.membership_tier & expires_at)
]);

/** 订单状态 */
export const orderStatusEnum = pgEnum("order_status", [
  "pending",    // 待支付
  "paid",       // 已支付 (待发货)
  "delivered",  // 已发货 (完成)
  "failed",     // 支付失败
  "cancelled",  // 取消
  "refunded"    // 已退款
]);

/** 支付方式 */
export const paymentMethodEnum = pgEnum("payment_method", [
  "wechat_pay",   // 微信支付 (RMB)
  "pal_coin",     // 站内 Pal 币 (余额)
  "free_grant"    // 系统赠送/0元购
]);

// ==========================================
// 4. 📍 活动业务 (Activity Domain)
// ==========================================

/** 活动垂直分类 (UI颜色区分) */
export const activityCategoryEnum = pgEnum("activity_category", [
  "eat",            // 吃 (Yellow)
  "sport",          // 动 (Green)
  "play",           // 玩 (Red)
  "learn",          // 学 (Blue)
  "travel",         // 旅 (Purple)
  "official"        // 官方 (Ghost Anchor)
]);

/** 加入模式 */
export const joinModeEnum = pgEnum("join_mode", ["instant", "approval"]);

/** 活动状态 */
export const activityStatusEnum = pgEnum("activity_status", [
  "published", // 报名中
  "full",      // 满员
  "expired",   // 报名截止
  "cancelled", // 发起人取消
  "finished"   // 活动结束
]);

/** 
 * 参与者状态 (State Machine)
 * 核心逻辑：pending -> approved -> checked_in
 */
export const participantStatusEnum = pgEnum("participant_status", [
  "pending",    // 申请中
  "approved",   // 已通过 (待履约)
  "rejected",   // 已拒绝
  "checked_in", // ✅ 已签到 (履约完成 - 信用分+1)
  "quit",       // 主动退出
  "absent"      // ❌ 爽约/未签到 (信用分-20)
]);

/** 风控等级 */
export const riskLevelEnum = pgEnum("risk_level", ["pass", "review", "reject"]);

// ==========================================
// ⚡️ TypeScript Constants (非数据库 Enum)
// 用于代码中引用系统核心 Asset ID，避免 Magic Strings
// ==========================================

export const SYSTEM_ASSETS = {
  // 货币
  COIN: "pal_coin",
  
  // 道具 (对应 user_assets.asset_id)
  PROP: {
    TOP_CARD: "prop_top_card",     // 置顶卡
    NOTIFY_CARD: "prop_notify_card", // 强提醒
    AI_TOKEN: "prop_ai_token"      // AI 次数
  },

  // 徽章/特殊标识
  BADGE: {
    VERIFIED: "badge_verified",    // 实名/官方认证
    EARLY_BIRD: "badge_early_bird" // 早鸟
  }
} as const;