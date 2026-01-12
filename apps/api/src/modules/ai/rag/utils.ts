/**
 * RAG Utils - 语义检索工具函数
 * 
 * 包含：
 * - enrichActivityText() - 文本富集化
 * - inferVibe() - 氛围推断
 * - generateEmbedding() - 向量生成
 * - 日期格式化函数
 */

import type { Activity } from '@juchang/db';
import type { ActivityVibe, TimeOfDay, DayOfWeek } from './types';
import { getZhipuEmbedding, getZhipuEmbeddings } from '../models/adapters/zhipu';

// ============ 日期格式化 ============

/**
 * 获取星期几 (周一-周日)
 */
export function getDayOfWeek(date: Date): DayOfWeek {
  const days: DayOfWeek[] = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return days[date.getDay()];
}

/**
 * 获取时间段 (早上/下午/晚上/深夜)
 */
export function getTimeOfDay(date: Date): TimeOfDay {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return '早上';
  if (hour >= 12 && hour < 18) return '下午';
  if (hour >= 18 && hour < 23) return '晚上';
  return '深夜';
}

/**
 * 格式化时间为人类可读格式
 * @example "周五 晚上"
 */
export function formatHumanReadableTime(date: Date): string {
  return `${getDayOfWeek(date)} ${getTimeOfDay(date)}`;
}

// ============ 氛围推断 ============

/**
 * 基于活动类型的默认氛围映射
 */
const VIBE_BY_TYPE: Record<string, ActivityVibe> = {
  // 热闹型
  'hotpot': '热闹',
  'mahjong': '热闹',
  'bbq': '热闹',
  'ktv': '热闹',
  'party': '热闹',
  'drinking': '热闹',
  
  // 安静型
  'reading': '安静',
  'coffee': '安静',
  'tea': '安静',
  'study': '安静',
  'meditation': '安静',
  
  // 活力型
  'sports': '活力',
  'gym': '活力',
  'basketball': '活力',
  'badminton': '活力',
  'swimming': '活力',
  'running': '活力',
  
  // 户外型
  'hiking': '户外',
  'camping': '户外',
  'cycling': '户外',
  'fishing': '户外',
  'picnic': '户外',
  
  // 商务型
  'business': '商务',
  'networking': '商务',
  'meeting': '商务',
  
  // 文艺型
  'movie': '文艺',
  'concert': '文艺',
  'exhibition': '文艺',
  'museum': '文艺',
  'theater': '文艺',
  
  // 社交型
  'board_game': '社交',
  'escape_room': '社交',
  'werewolf': '社交',
};

/**
 * 氛围关键词映射
 */
const VIBE_KEYWORDS: Record<ActivityVibe, string[]> = {
  '热闹': ['热闹', '嗨', '派对', '聚会', '狂欢', '欢乐', '嗨皮'],
  '安静': ['安静', '静谧', '放松', '发呆', '冥想', '独处', '清净'],
  '活力': ['活力', '运动', '健身', '出汗', '锻炼', '挑战'],
  '户外': ['户外', '自然', '风景', '阳光', '新鲜空气'],
  '商务': ['商务', '交流', '合作', '洽谈', '专业'],
  '休闲': ['休闲', '轻松', '随意', '慢节奏', '悠闲'],
  '文艺': ['文艺', '艺术', '文化', '欣赏', '品味'],
  '社交': ['社交', '交友', '认识', '互动', '团建'],
};

/**
 * 推断活动氛围
 * 基于活动类型和描述关键词
 */
export function inferVibe(activity: Pick<Activity, 'type' | 'description'>): ActivityVibe {
  // 1. 先检查描述中的关键词
  const description = activity.description?.toLowerCase() || '';
  
  for (const [vibe, keywords] of Object.entries(VIBE_KEYWORDS)) {
    if (keywords.some(kw => description.includes(kw))) {
      return vibe as ActivityVibe;
    }
  }
  
  // 2. 基于类型的默认氛围
  const typeVibe = VIBE_BY_TYPE[activity.type];
  if (typeVibe) {
    return typeVibe;
  }
  
  // 3. 默认返回休闲
  return '休闲';
}

// ============ 文本富集化 ============

/**
 * 将活动数据富集为语义文本
 * 
 * 格式：
 * ```
 * 标题: {title}
 * 描述: {description}
 * 类型: {type}
 * 标签: {tags}
 * 时间: {day_of_week} {time_of_day}
 * 地点: {locationName}
 * 氛围: {implied_vibe}
 * ```
 */
export function enrichActivityText(activity: Activity): string {
  const dayOfWeek = getDayOfWeek(activity.startAt);
  const timeOfDay = getTimeOfDay(activity.startAt);
  const impliedVibe = inferVibe(activity);
  
  // 活动可能没有 tags 字段（MVP 精简版移除了）
  const tags = (activity as any).tags?.join(', ') || '';

  return `
标题: ${activity.title}
描述: ${activity.description || ''}
类型: ${activity.type}
标签: ${tags}
时间: ${dayOfWeek} ${timeOfDay}
地点: ${activity.locationName}
氛围: ${impliedVibe}
  `.trim();
}

// ============ 向量生成 ============

/**
 * 生成单个文本的向量
 * 使用智谱 embedding-3 模型 (1024 维)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  return getZhipuEmbedding(text);
}

/**
 * 批量生成向量
 * 支持速率限制
 */
export async function generateEmbeddings(
  texts: string[],
  options?: { batchSize?: number; delayMs?: number }
): Promise<number[][]> {
  const { batchSize = 100, delayMs = 100 } = options || {};
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const embeddings = await getZhipuEmbeddings(batch);
    results.push(...embeddings);

    // 速率限制延迟
    if (i + batchSize < texts.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

/**
 * 为活动生成向量
 * 先富集文本，再生成向量
 */
export async function generateActivityEmbedding(activity: Activity): Promise<number[]> {
  const enrichedText = enrichActivityText(activity);
  return generateEmbedding(enrichedText);
}
