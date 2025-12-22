/**
 * AI 额度管理服务
 * Requirements: 19.1, 19.2, 19.3, 19.4
 *
 * 管理用户的 AI 使用额度和活动发布额度
 * - AI 搜索/解析：50次/天
 * - 活动发布：3次/天
 */

// 额度配置
const QUOTA_CONFIG = {
  AI_SEARCH_DAILY_LIMIT: 50,
  ACTIVITY_CREATE_DAILY_LIMIT: 3,
};

// 存储键
const STORAGE_KEY = 'aiQuota';

// 额度数据结构
interface QuotaData {
  aiSearchUsed: number;
  activityCreateUsed: number;
  date: string; // YYYY-MM-DD 格式
}

/**
 * 获取今天的日期字符串
 */
function getTodayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * 获取当前额度数据
 */
function getQuotaData(): QuotaData {
  const today = getTodayString();
  const stored = wx.getStorageSync(STORAGE_KEY) as QuotaData | undefined;

  // 如果没有数据或日期不是今天，重置额度
  if (!stored || stored.date !== today) {
    const newData: QuotaData = {
      aiSearchUsed: 0,
      activityCreateUsed: 0,
      date: today,
    };
    wx.setStorageSync(STORAGE_KEY, newData);
    return newData;
  }

  return stored;
}

/**
 * 保存额度数据
 */
function saveQuotaData(data: QuotaData): void {
  wx.setStorageSync(STORAGE_KEY, data);
}

/**
 * 检查 AI 搜索额度是否充足 - Requirements: 19.1
 */
export function checkAISearchQuota(): boolean {
  const data = getQuotaData();
  return data.aiSearchUsed < QUOTA_CONFIG.AI_SEARCH_DAILY_LIMIT;
}

/**
 * 消耗 AI 搜索额度 - Requirements: 19.1
 * @returns 是否消耗成功
 */
export function consumeAISearchQuota(): boolean {
  const data = getQuotaData();

  if (data.aiSearchUsed >= QUOTA_CONFIG.AI_SEARCH_DAILY_LIMIT) {
    return false;
  }

  data.aiSearchUsed += 1;
  saveQuotaData(data);
  return true;
}

/**
 * 获取 AI 搜索剩余额度
 */
export function getAISearchRemaining(): number {
  const data = getQuotaData();
  return Math.max(0, QUOTA_CONFIG.AI_SEARCH_DAILY_LIMIT - data.aiSearchUsed);
}

/**
 * 检查活动发布额度是否充足 - Requirements: 19.3
 */
export function checkActivityCreateQuota(): boolean {
  const data = getQuotaData();
  return data.activityCreateUsed < QUOTA_CONFIG.ACTIVITY_CREATE_DAILY_LIMIT;
}

/**
 * 消耗活动发布额度 - Requirements: 19.3
 * @returns 是否消耗成功
 */
export function consumeActivityCreateQuota(): boolean {
  const data = getQuotaData();

  if (data.activityCreateUsed >= QUOTA_CONFIG.ACTIVITY_CREATE_DAILY_LIMIT) {
    return false;
  }

  data.activityCreateUsed += 1;
  saveQuotaData(data);
  return true;
}

/**
 * 获取活动发布剩余额度
 */
export function getActivityCreateRemaining(): number {
  const data = getQuotaData();
  return Math.max(0, QUOTA_CONFIG.ACTIVITY_CREATE_DAILY_LIMIT - data.activityCreateUsed);
}

/**
 * 显示 AI 额度用完提示 - Requirements: 19.2
 */
export function showAIQuotaExhaustedTip(): void {
  wx.showModal({
    title: 'AI 额度已用完',
    content: `今日 AI 搜索额度（${QUOTA_CONFIG.AI_SEARCH_DAILY_LIMIT}次）已用完，明天再来吧！`,
    showCancel: false,
    confirmText: '知道了',
  });
}

/**
 * 显示活动发布额度用完提示 - Requirements: 19.4
 */
export function showActivityCreateQuotaExhaustedTip(): void {
  wx.showModal({
    title: '发布额度已用完',
    content: `今日活动发布额度（${QUOTA_CONFIG.ACTIVITY_CREATE_DAILY_LIMIT}次）已用完，明天再来吧！`,
    showCancel: false,
    confirmText: '知道了',
  });
}

/**
 * 获取完整的额度信息
 */
export function getQuotaInfo(): {
  aiSearch: { used: number; limit: number; remaining: number };
  activityCreate: { used: number; limit: number; remaining: number };
} {
  const data = getQuotaData();
  return {
    aiSearch: {
      used: data.aiSearchUsed,
      limit: QUOTA_CONFIG.AI_SEARCH_DAILY_LIMIT,
      remaining: Math.max(0, QUOTA_CONFIG.AI_SEARCH_DAILY_LIMIT - data.aiSearchUsed),
    },
    activityCreate: {
      used: data.activityCreateUsed,
      limit: QUOTA_CONFIG.ACTIVITY_CREATE_DAILY_LIMIT,
      remaining: Math.max(0, QUOTA_CONFIG.ACTIVITY_CREATE_DAILY_LIMIT - data.activityCreateUsed),
    },
  };
}
