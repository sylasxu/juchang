/**
 * User Preference Enricher
 * 
 * 为推荐类查询注入用户偏好信息，
 * 基于用户历史活动参与记录推断偏好类型。
 */

import type { EnrichmentResult } from '../types';
import { db, activities, participants, eq, desc, and, sql } from '@juchang/db';

/**
 * 推荐意图关键词
 */
export const RECOMMENDATION_KEYWORDS = [
  '推荐',
  '有什么',
  '找个',
  '想找',
  '看看',
  '随便',
  '都可以',
];

/**
 * 活动类型关键词（用于检测用户是否已指定类型）
 */
const TYPE_KEYWORDS = [
  '火锅',
  '吃饭',
  '聚餐',
  '烧烤',
  '电影',
  'KTV',
  '唱歌',
  '密室',
  '足球',
  '篮球',
  '羽毛球',
  '健身',
  '麻将',
  '桌游',
  '剧本杀',
  '狼人杀',
];

/**
 * 活动类型标签映射
 */
const TYPE_LABELS: Record<string, string> = {
  food: '美食',
  entertainment: '娱乐',
  sports: '运动',
  boardgame: '桌游',
  other: '其他',
};

/**
 * 查询用户偏好的活动类型
 * 基于用户参与过的活动类型统计
 * 
 * @param userId 用户 ID
 * @returns 最常参与的活动类型
 */
async function getUserPreferredActivityType(
  userId: string
): Promise<string | null> {
  try {
    // 设置 500ms 超时
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), 500);
    });
    
    const queryPromise = db
      .select({
        type: activities.type,
        count: sql<number>`count(*)::int`,
      })
      .from(participants)
      .innerJoin(activities, eq(participants.activityId, activities.id))
      .where(
        and(
          eq(participants.userId, userId),
          eq(participants.status, 'joined')
        )
      )
      .groupBy(activities.type)
      .orderBy(desc(sql`count(*)`))
      .limit(1);
    
    const result = await Promise.race([queryPromise, timeoutPromise]);
    
    if (!result || !Array.isArray(result) || result.length === 0) {
      return null;
    }
    
    return result[0].type;
  } catch (error) {
    // 查询失败时静默返回 null，不影响其他增强器
    console.warn('[UserPreferenceEnricher] Query failed:', error);
    return null;
  }
}

/**
 * XML 转义特殊字符
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * 为推荐类查询注入用户偏好
 * 
 * @param message 用户消息
 * @param userId 用户 ID（可选）
 * @returns 增强结果
 */
export async function enrichWithUserPreference(
  message: string,
  userId: string | null
): Promise<EnrichmentResult> {
  // 未登录用户不注入偏好
  if (!userId) {
    return {
      originalMessage: message,
      enrichedMessage: message,
      appliedEnrichments: [],
    };
  }
  
  // 检测是否有推荐意图
  const hasRecommendationIntent = RECOMMENDATION_KEYWORDS.some(keyword =>
    message.includes(keyword)
  );
  
  if (!hasRecommendationIntent) {
    return {
      originalMessage: message,
      enrichedMessage: message,
      appliedEnrichments: [],
    };
  }
  
  // 检查用户是否已指定类型
  const hasTypeSpecified = TYPE_KEYWORDS.some(keyword =>
    message.includes(keyword)
  );
  
  if (hasTypeSpecified) {
    // 用户已指定类型，不需要注入偏好
    return {
      originalMessage: message,
      enrichedMessage: message,
      appliedEnrichments: [],
    };
  }
  
  // 查询用户偏好
  const preferredType = await getUserPreferredActivityType(userId);
  
  if (!preferredType) {
    return {
      originalMessage: message,
      enrichedMessage: message,
      appliedEnrichments: [],
    };
  }
  
  const typeLabel = TYPE_LABELS[preferredType] || preferredType;
  
  // 生成 XML 格式的用户偏好上下文
  const contextXml = `<user_preference>
  <preferred_type value="${escapeXml(preferredType)}">${escapeXml(typeLabel)}</preferred_type>
  <note>用户历史上最常参与${escapeXml(typeLabel)}类活动</note>
</user_preference>`;
  
  return {
    originalMessage: message,
    enrichedMessage: message, // 偏好不修改原消息，只注入上下文
    appliedEnrichments: ['user_preference'],
    contextInjectionXml: contextXml,
  };
}
