/**
 * Working Memory - 用户工作记忆
 * 
 * 存储用户画像（偏好、常去地点等）
 * 支持两种格式：
 * 1. Markdown 格式（旧版，便于 LLM 理解）
 * 2. JSON 格式（新版，支持置信度和时效性）
 */

import { db, users, eq } from '@juchang/db';
import type { UserProfile } from './types';
import type { PreferenceExtraction, PreferenceCategory, PreferenceSentiment } from './extractor';

// ============ 类型定义 ============

/**
 * 增强的偏好项（支持置信度和时效性）
 */
export interface EnhancedPreference {
  category: PreferenceCategory;
  value: string;
  sentiment: PreferenceSentiment;
  confidence: number;
  updatedAt: Date;
}

/**
 * 增强的用户画像
 */
export interface EnhancedUserProfile {
  version: 2;
  preferences: EnhancedPreference[];
  frequentLocations: string[];
  lastUpdated: Date;
}

/**
 * 存储格式（JSON 字符串）
 */
interface StoredEnhancedProfile {
  version: 2;
  preferences: Array<{
    category: PreferenceCategory;
    value: string;
    sentiment: PreferenceSentiment;
    confidence: number;
    updatedAt: string;
  }>;
  frequentLocations: string[];
  lastUpdated: string;
}

/**
 * 空的用户画像（旧版）
 */
export const EMPTY_PROFILE: UserProfile = {
  preferences: [],
  dislikes: [],
  frequentLocations: [],
  behaviorPatterns: [],
};

/**
 * 空的增强用户画像
 */
export const EMPTY_ENHANCED_PROFILE: EnhancedUserProfile = {
  version: 2,
  preferences: [],
  frequentLocations: [],
  lastUpdated: new Date(),
};

/**
 * 从 Markdown 解析用户画像
 * 
 * 格式示例：
 * ```markdown
 * ## 喜好
 * - 喜欢火锅
 * - 偏好周末活动
 * 
 * ## 不喜欢
 * - 不吃辣
 * 
 * ## 常去地点
 * - 观音桥
 * - 解放碑
 * 
 * ## 行为模式
 * - 经常组局
 * - 喜欢小规模（4人以下）
 * ```
 */
export function parseUserProfile(markdown: string | null): UserProfile {
  if (!markdown) return EMPTY_PROFILE;

  const profile: UserProfile = {
    preferences: [],
    dislikes: [],
    frequentLocations: [],
    behaviorPatterns: [],
  };

  const sections: Record<string, keyof UserProfile> = {
    '喜好': 'preferences',
    '不喜欢': 'dislikes',
    '常去地点': 'frequentLocations',
    '行为模式': 'behaviorPatterns',
  };

  let currentSection: keyof UserProfile | null = null;

  for (const line of markdown.split('\n')) {
    const trimmed = line.trim();

    // 检查是否是标题行
    if (trimmed.startsWith('## ')) {
      const title = trimmed.slice(3).trim();
      currentSection = sections[title] || null;
      continue;
    }

    // 检查是否是列表项
    if (trimmed.startsWith('- ') && currentSection) {
      const item = trimmed.slice(2).trim();
      if (item) {
        profile[currentSection].push(item);
      }
    }
  }

  return profile;
}

/**
 * 将用户画像序列化为 Markdown
 */
export function serializeUserProfile(profile: UserProfile): string {
  const sections: string[] = [];

  if (profile.preferences.length > 0) {
    sections.push('## 喜好');
    sections.push(...profile.preferences.map(p => `- ${p}`));
    sections.push('');
  }

  if (profile.dislikes.length > 0) {
    sections.push('## 不喜欢');
    sections.push(...profile.dislikes.map(d => `- ${d}`));
    sections.push('');
  }

  if (profile.frequentLocations.length > 0) {
    sections.push('## 常去地点');
    sections.push(...profile.frequentLocations.map(l => `- ${l}`));
    sections.push('');
  }

  if (profile.behaviorPatterns.length > 0) {
    sections.push('## 行为模式');
    sections.push(...profile.behaviorPatterns.map(b => `- ${b}`));
    sections.push('');
  }

  return sections.join('\n');
}

/**
 * 注入工作记忆到 System Prompt
 * 
 * @param prompt - 原始 System Prompt
 * @param memory - 用户工作记忆（Markdown 格式）
 * @returns 注入后的 Prompt
 */
export function injectWorkingMemory(prompt: string, memory: string | null): string {
  if (!memory) return prompt;

  return `${prompt}

<working_memory>
${memory}
</working_memory>`;
}

/**
 * 合并用户画像（新数据覆盖旧数据中的重复项）
 */
export function mergeUserProfile(
  existing: UserProfile,
  updates: Partial<UserProfile>
): UserProfile {
  return {
    preferences: mergeArrayUnique(existing.preferences, updates.preferences || []),
    dislikes: mergeArrayUnique(existing.dislikes, updates.dislikes || []),
    frequentLocations: mergeArrayUnique(existing.frequentLocations, updates.frequentLocations || []),
    behaviorPatterns: mergeArrayUnique(existing.behaviorPatterns, updates.behaviorPatterns || []),
  };
}

/**
 * 合并数组并去重
 */
function mergeArrayUnique(existing: string[], updates: string[]): string[] {
  const set = new Set([...existing, ...updates]);
  return Array.from(set);
}

/**
 * 从对话历史中提取用户偏好（简化版）
 * 
 * TODO: 后续可以用 LLM 来提取更精准的偏好
 */
export function extractPreferencesFromHistory(
  messages: Array<{ role: string; content: string }>
): Partial<UserProfile> {
  const preferences: string[] = [];
  const frequentLocations: string[] = [];

  // 简单的关键词提取
  const locationKeywords = ['观音桥', '解放碑', '南坪', '沙坪坝', '江北', '杨家坪', '大坪', '北碚'];
  const preferenceKeywords = ['喜欢', '爱吃', '想吃', '想玩', '想打'];

  for (const msg of messages) {
    if (msg.role !== 'user') continue;
    const content = msg.content;

    // 提取地点
    for (const loc of locationKeywords) {
      if (content.includes(loc) && !frequentLocations.includes(loc)) {
        frequentLocations.push(loc);
      }
    }

    // 提取偏好（简化版）
    for (const keyword of preferenceKeywords) {
      const idx = content.indexOf(keyword);
      if (idx !== -1) {
        // 提取关键词后的内容（最多 10 个字）
        const after = content.slice(idx, idx + 15);
        if (after && !preferences.includes(after)) {
          preferences.push(after);
        }
      }
    }
  }

  return {
    preferences: preferences.slice(0, 5), // 最多 5 个
    frequentLocations: frequentLocations.slice(0, 3), // 最多 3 个
  };
}

// ============ 数据库操作 ============

/**
 * 获取用户工作记忆
 */
export async function getWorkingMemory(userId: string): Promise<string | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { workingMemory: true },
  });
  return user?.workingMemory ?? null;
}

/**
 * 更新用户工作记忆
 */
export async function updateWorkingMemory(
  userId: string,
  content: string
): Promise<void> {
  await db.update(users)
    .set({ 
      workingMemory: content,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

/**
 * 获取用户画像（解析后的结构）
 */
export async function getUserProfile(userId: string): Promise<UserProfile> {
  const memory = await getWorkingMemory(userId);
  return parseUserProfile(memory);
}

/**
 * 更新用户画像
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<void> {
  const existing = await getUserProfile(userId);
  const merged = mergeUserProfile(existing, updates);
  const markdown = serializeUserProfile(merged);
  await updateWorkingMemory(userId, markdown);
}

/**
 * 清空用户工作记忆
 */
export async function clearWorkingMemory(userId: string): Promise<void> {
  await db.update(users)
    .set({ 
      workingMemory: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}


// ============ 增强版用户画像操作 ============

/**
 * 检测存储格式是否为增强版（JSON）
 * @internal Used by parseEnhancedProfile
 */
export function isEnhancedFormat(content: string | null): boolean {
  if (!content) return false;
  try {
    const parsed = JSON.parse(content);
    return parsed.version === 2;
  } catch {
    return false;
  }
}

/**
 * 解析增强版用户画像
 */
export function parseEnhancedProfile(content: string | null): EnhancedUserProfile {
  if (!content) return { ...EMPTY_ENHANCED_PROFILE, lastUpdated: new Date() };

  try {
    const stored = JSON.parse(content) as StoredEnhancedProfile;
    if (stored.version !== 2) {
      // 旧版格式，转换为增强版
      return convertToEnhancedProfile(parseUserProfile(content));
    }
    return {
      version: 2,
      preferences: stored.preferences.map(p => ({
        ...p,
        updatedAt: new Date(p.updatedAt),
      })),
      frequentLocations: stored.frequentLocations,
      lastUpdated: new Date(stored.lastUpdated),
    };
  } catch {
    // 解析失败，尝试作为 Markdown 解析
    return convertToEnhancedProfile(parseUserProfile(content));
  }
}

/**
 * 序列化增强版用户画像
 */
export function serializeEnhancedProfile(profile: EnhancedUserProfile): string {
  const stored: StoredEnhancedProfile = {
    version: 2,
    preferences: profile.preferences.map(p => ({
      ...p,
      updatedAt: p.updatedAt.toISOString(),
    })),
    frequentLocations: profile.frequentLocations,
    lastUpdated: profile.lastUpdated.toISOString(),
  };
  return JSON.stringify(stored);
}

/**
 * 将旧版用户画像转换为增强版
 */
export function convertToEnhancedProfile(oldProfile: UserProfile): EnhancedUserProfile {
  const now = new Date();
  const preferences: EnhancedPreference[] = [];

  // 转换喜好
  for (const pref of oldProfile.preferences) {
    preferences.push({
      category: 'activity_type',
      value: pref,
      sentiment: 'like',
      confidence: 0.5, // 旧数据置信度较低
      updatedAt: now,
    });
  }

  // 转换不喜欢
  for (const dislike of oldProfile.dislikes) {
    preferences.push({
      category: 'food', // 假设不喜欢的多是食物
      value: dislike,
      sentiment: 'dislike',
      confidence: 0.5,
      updatedAt: now,
    });
  }

  return {
    version: 2,
    preferences,
    frequentLocations: oldProfile.frequentLocations,
    lastUpdated: now,
  };
}

/**
 * 合并增强版偏好（新偏好覆盖旧偏好，保留时效性）
 */
export function mergeEnhancedPreferences(
  existing: EnhancedPreference[],
  newPrefs: EnhancedPreference[]
): EnhancedPreference[] {
  const merged = new Map<string, EnhancedPreference>();
  
  // 先添加现有偏好
  for (const pref of existing) {
    const key = `${pref.category}:${pref.value.toLowerCase()}`;
    merged.set(key, pref);
  }
  
  // 新偏好覆盖旧偏好
  for (const pref of newPrefs) {
    const key = `${pref.category}:${pref.value.toLowerCase()}`;
    const existingPref = merged.get(key);
    
    // 如果新偏好置信度更高，或者旧偏好太旧（超过 7 天），则覆盖
    if (!existingPref || 
        pref.confidence > existingPref.confidence ||
        (Date.now() - existingPref.updatedAt.getTime()) > 7 * 24 * 60 * 60 * 1000) {
      merged.set(key, { ...pref, updatedAt: new Date() });
    }
  }
  
  // 按更新时间排序，最近的在前
  return Array.from(merged.values())
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 20); // 最多保留 20 个偏好
}

/**
 * 从 LLM 提取结果转换为增强偏好
 */
export function extractionToEnhancedPreferences(
  extraction: PreferenceExtraction
): EnhancedPreference[] {
  const now = new Date();
  return extraction.preferences.map(p => ({
    category: p.category,
    value: p.value,
    sentiment: p.sentiment,
    confidence: p.confidence,
    updatedAt: now,
  }));
}

/**
 * 构建用户画像 Prompt 片段
 */
export function buildProfilePrompt(profile: EnhancedUserProfile): string {
  if (profile.preferences.length === 0 && profile.frequentLocations.length === 0) {
    return '';
  }

  const lines: string[] = ['<user_profile>'];
  lines.push('以下是用户的偏好信息，请在回复时参考：');
  lines.push('');
  
  // 喜好（按置信度排序，取前 5 个）
  const likes = profile.preferences
    .filter(p => p.sentiment === 'like')
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);
  
  if (likes.length > 0) {
    lines.push('## 用户喜好');
    for (const pref of likes) {
      const categoryLabel = getCategoryLabel(pref.category);
      lines.push(`- ${pref.value}（${categoryLabel}）`);
    }
    lines.push('');
  }
  
  // 不喜欢/禁忌（这些更重要，要特别注意）
  const dislikes = profile.preferences
    .filter(p => p.sentiment === 'dislike')
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);
  
  if (dislikes.length > 0) {
    lines.push('## ⚠️ 用户禁忌（重要）');
    for (const pref of dislikes) {
      const categoryLabel = getCategoryLabel(pref.category);
      lines.push(`- ${pref.value}（${categoryLabel}）`);
    }
    lines.push('');
  }
  
  // 常去地点
  if (profile.frequentLocations.length > 0) {
    lines.push('## 常去地点');
    lines.push(`- ${profile.frequentLocations.slice(0, 3).join('、')}`);
    lines.push('');
  }
  
  lines.push('</user_profile>');
  lines.push('');
  lines.push('请根据用户画像个性化你的回复：');
  lines.push('- 如果用户有饮食禁忌（如不吃辣），推荐餐厅时要特别提醒');
  lines.push('- 如果用户有常去地点，优先推荐该区域的活动');
  lines.push('- 根据用户喜好推荐相关类型的活动');
  
  return lines.join('\n');
}

/**
 * 获取类别的中文标签
 */
function getCategoryLabel(category: PreferenceCategory): string {
  const labels: Record<PreferenceCategory, string> = {
    activity_type: '活动类型',
    time: '时间偏好',
    location: '地点偏好',
    food: '饮食偏好',
    social: '社交偏好',
  };
  return labels[category] || category;
}

// ============ 增强版数据库操作 ============

/**
 * 获取增强版用户画像
 */
export async function getEnhancedUserProfile(userId: string): Promise<EnhancedUserProfile> {
  const memory = await getWorkingMemory(userId);
  return parseEnhancedProfile(memory);
}

/**
 * 保存增强版用户画像
 */
export async function saveEnhancedUserProfile(
  userId: string,
  profile: EnhancedUserProfile
): Promise<void> {
  const content = serializeEnhancedProfile(profile);
  await updateWorkingMemory(userId, content);
}

/**
 * 更新增强版用户画像（合并新偏好）
 */
export async function updateEnhancedUserProfile(
  userId: string,
  extraction: PreferenceExtraction
): Promise<void> {
  const existing = await getEnhancedUserProfile(userId);
  const newPrefs = extractionToEnhancedPreferences(extraction);
  
  const merged: EnhancedUserProfile = {
    version: 2,
    preferences: mergeEnhancedPreferences(existing.preferences, newPrefs),
    frequentLocations: mergeArrayUnique(existing.frequentLocations, extraction.frequentLocations).slice(0, 5),
    lastUpdated: new Date(),
  };
  
  await saveEnhancedUserProfile(userId, merged);
}

/**
 * 注入增强版用户画像到 System Prompt
 */
export function injectEnhancedWorkingMemory(prompt: string, profile: EnhancedUserProfile): string {
  const profilePrompt = buildProfilePrompt(profile);
  if (!profilePrompt) return prompt;
  
  return `${prompt}

${profilePrompt}`;
}
