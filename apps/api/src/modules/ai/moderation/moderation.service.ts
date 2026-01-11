/**
 * Moderation Service - 内容审核服务
 * 
 * 复用 input-guard 检测敏感词，用简单规则计算风险评分
 */

import { db, eq, activities } from '@juchang/db';
import { checkInput } from '../guardrails/input-guard';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface ModerationResult {
  activityId: string;
  riskScore: number;
  riskLevel: RiskLevel;
  reasons: string[];
  suggestedAction: 'approve' | 'review' | 'reject';
}

/**
 * 风险评分规则
 */
const RISK_RULES = {
  sensitiveWord: 30,
  contactInfo: 20,
  shortContent: 10,
  suspiciousPattern: 15,
};

/**
 * 联系方式正则
 */
const CONTACT_PATTERNS = [
  /1[3-9]\d{9}/,           // 手机号
  /微信|wx|weixin/i,       // 微信
  /QQ|扣扣/i,              // QQ
  /加我|私聊|联系我/,       // 引导私聊
];

/**
 * 可疑模式
 */
const SUSPICIOUS_PATTERNS = [
  /免费|赚钱|兼职|日结/,
  /高薪|月入|躺赚/,
  /代理|招商|加盟/,
];

/**
 * 计算风险评分
 */
export function calculateRiskScore(title: string, description?: string | null): {
  score: number;
  reasons: string[];
} {
  let score = 0;
  const reasons: string[] = [];
  const content = `${title} ${description || ''}`;

  // 1. 复用 input-guard 检测敏感词
  const guardResult = checkInput(content);
  if (guardResult.blocked) {
    score += RISK_RULES.sensitiveWord;
    reasons.push('包含敏感词');
  }

  // 2. 联系方式检测
  for (const pattern of CONTACT_PATTERNS) {
    if (pattern.test(content)) {
      score += RISK_RULES.contactInfo;
      reasons.push('包含联系方式');
      break;
    }
  }

  // 3. 可疑模式检测
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(content)) {
      score += RISK_RULES.suspiciousPattern;
      reasons.push('疑似广告/诈骗');
      break;
    }
  }

  // 4. 内容过短
  if (content.trim().length < 10) {
    score += RISK_RULES.shortContent;
    reasons.push('内容过短');
  }

  return {
    score: Math.min(score, 100),
    reasons,
  };
}

/**
 * 根据分数判断风险等级
 */
function getRiskLevel(score: number): RiskLevel {
  if (score >= 50) return 'high';
  if (score >= 25) return 'medium';
  return 'low';
}

/**
 * 根据风险等级建议操作
 */
function getSuggestedAction(level: RiskLevel): 'approve' | 'review' | 'reject' {
  switch (level) {
    case 'high': return 'reject';
    case 'medium': return 'review';
    default: return 'approve';
  }
}

/**
 * 分析活动内容
 */
export async function analyzeActivity(activityId: string): Promise<ModerationResult | null> {
  const activity = await db.query.activities.findFirst({
    where: eq(activities.id, activityId),
  });

  if (!activity) return null;

  const { score, reasons } = calculateRiskScore(activity.title, activity.description);
  const riskLevel = getRiskLevel(score);

  return {
    activityId,
    riskScore: score,
    riskLevel,
    reasons,
    suggestedAction: getSuggestedAction(riskLevel),
  };
}

/**
 * 直接分析文本内容（不需要 activityId）
 */
export function analyzeContent(title: string, description?: string | null): Omit<ModerationResult, 'activityId'> {
  const { score, reasons } = calculateRiskScore(title, description);
  const riskLevel = getRiskLevel(score);

  return {
    riskScore: score,
    riskLevel,
    reasons,
    suggestedAction: getSuggestedAction(riskLevel),
  };
}
