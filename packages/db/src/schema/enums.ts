import { pgEnum } from "drizzle-orm/pg-core";

// ================= 用户相关 =================
/** 用户性别：用于"她模式"筛选和资料展示 */
export const genderEnum = pgEnum("gender", ["unknown", "male", "female"]);

/** 会员等级：决定AI服务折扣率（月度8折/年度7折）及每月赠送资产数量 */
export const membershipEnum = pgEnum("membership_type", ["none", "monthly", "yearly"]);

/** 登录身份类型：统一管理 user_auths.identity_type 的可选值 */
export const authIdentityEnum = pgEnum("auth_identity_type", [
  "wechat_miniprogram",
  "phone_sms",
  "wechat_open_platform",
  "apple_signin",
  "email_password",
]);

// ================= 资产与道具 (Inventory Domain) =================
/** 资产大类：用于前端背包页面的分类展示 (钱包 vs 道具包) */
export const assetCategoryEnum = pgEnum("asset_category", ["currency", "consumable", "badge"]);

/** 资产唯一标识 (SKU Code)：系统中所有"可拥有"的物品定义 */
export const assetIdEnum = pgEnum("asset_id", [
  // 货币类
  "coin",            // 基础金币 (充值获得，通用货币)
  "point",           // 活跃积分 (行为获得，兑换商城)
  
  // 道具类
  "speed_match_card", // 加速匹配卡 (提升推荐权重)
  "super_like",       // 超级喜欢 (强提醒)
  "activity_top_card",// 活动置顶卡 (增加曝光)
  "rename_card",      // 改名卡
  
  // 权益类
  "early_bird_badge", // 早鸟徽章 (绝版)
  "verified_badge"    // 认证标识
]);

/** 资产变动原因：用于财务对账和用户账单展示 */
export const assetChangeReasonEnum = pgEnum("asset_change_reason", [
  // --- 获取 (+) ---
  "recharge",            // 充值购买
  "activity_reward",     // 活动掉落/奖励
  "check_in",            // 每日签到
  "system_grant",        // 系统/客服发放
  "exchange_in",         // 兑换获得
  "gift_received",       // 收到礼物
  "refund",              // 退款返还

  // --- 消耗 (-) ---
  "payment_use",         // 支付消耗 (如金币买服务)
  "feature_consume",     // 功能消耗 (如使用加速卡)
  "gift_sent",           // 送礼消耗
  "expired",             // 过期销毁
  "exchange_out"         // 兑换消耗
]);

// ================= 商业化 =================
/** 商品类型：决定购买成功后系统执行什么逻辑 */
export const productTypeEnum = pgEnum("product_type", [
  "coin_bundle",    // 金币包 -> 加余额
  "membership",     // 会员卡 -> 延期会员时间
  "ai_service",     // AI服务 -> 消耗/放行
  "virtual_gift",   // 虚拟礼物 -> 触发赠送逻辑
  "activity_ticket" // 活动门票 -> 触发报名逻辑
]);

/** 订单状态：业务层面的最终结果 */
export const orderStatusEnum = pgEnum("order_status", ["pending", "paid", "failed", "cancelled", "refunded"]);

/** 支付方式：用户是用什么"钱"买的 */
export const paymentMethodEnum = pgEnum("payment_method", [
  "wechat", // 微信支付 (RMB)
  "asset",  // 站内资产 (如金币支付)
  "free",   // 0元购/系统赠送
  "hybrid"  // 混合支付 (预留)
]);

/** 外部支付网关渠道 */
export const paymentGatewayEnum = pgEnum("payment_gateway", ["wechat_pay", "alipay", "apple_iap"]);

/** 网关交互状态 */
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "success", "failed", "cancelled", "refunded"]);

// ================= 活动与风控 =================
/** 活动类型：决定地图图标和推荐策略 */
export const activityTypeEnum = pgEnum("activity_type", ["food", "sports", "entertainment", "culture", "travel", "study"]);

/** 活动生命周期状态 */
export const activityStatusEnum = pgEnum("activity_status", ["published", "full", "cancelled", "completed"]);

/** 参与者状态：报名审核流 */
export const participantStatusEnum = pgEnum("participant_status", ["pending", "approved", "rejected", "quit", "checked_in"]);

/** 风险等级：高风险会自动拦截或人工审核 */
export const riskLevelEnum = pgEnum("risk_level", ["low", "medium", "high"]);