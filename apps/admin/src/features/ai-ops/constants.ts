/**
 * AI Ops Advanced 常量定义
 */

// 拦截原因标签
export const REASON_LABELS: Record<string, string> = {
  sensitive_word: '敏感词',
  injection: '注入攻击',
  length: '长度超限',
  rate_limit: '频率限制',
}

// 内容类型标签
export const CONTENT_TYPE_LABELS: Record<string, string> = {
  activity: '活动',
  message: '消息',
  profile: '个人资料',
}

// 标记原因标签
export const FLAG_REASON_LABELS: Record<string, string> = {
  sensitive_word: '敏感词',
  user_report: '用户举报',
  auto_detect: '自动检测',
}

// 违规类型标签
export const CATEGORY_LABELS: Record<string, string> = {
  sensitive_word: '敏感词',
  spam: '垃圾信息',
  harassment: '骚扰',
  other: '其他',
}

// 偏好类别标签
export const PREFERENCE_CATEGORY_LABELS: Record<string, string> = {
  activity_type: '活动类型',
  time: '时间偏好',
  location: '地点偏好',
  social: '社交偏好',
  food: '餐饮偏好',
}

// 情感标签
export const SENTIMENT_LABELS: Record<string, string> = {
  like: '喜欢',
  dislike: '不喜欢',
  neutral: '中立',
}

// 反馈标签
export const FEEDBACK_LABELS: Record<string, string> = {
  positive: '正面',
  neutral: '中立',
  negative: '负面',
}

// 审核状态标签
export const MODERATION_STATUS_LABELS: Record<string, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
}

// 回填状态标签
export const BACKFILL_STATUS_LABELS: Record<string, string> = {
  idle: '空闲',
  running: '运行中',
  completed: '已完成',
  failed: '失败',
}

// 图表颜色
export const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00C49F', '#FFBB28']

// 默认分页配置
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100
