// AI Service - v3.2 Chat-First: AI 解析 + 对话历史管理 + 意图分类
import { db, users, homeMessages, activities, participants, eq, lt, desc, sql } from '@juchang/db';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import type { 
  AIParseRequest, 
  AIParseResponse, 
  ConversationMessage,
  ConversationsQuery,
  ConversationsResponse,
  HomeMessageType,
} from './ai.model';

/**
 * 获取 AI 模型配置
 */
function getAIModel() {
  const provider = process.env.AI_PROVIDER || 'dashscope';
  
  switch (provider) {
    case 'openai':
      const openaiClient = createOpenAI({
        baseURL: process.env.OPENAI_BASE_URL,
        apiKey: process.env.OPENAI_API_KEY || '',
      });
      return openaiClient('gpt-4o-mini');
      
    case 'dashscope':
    default:
      // 通义千问 - 使用 OpenAI 兼容接口
      const dashscopeClient = createOpenAI({
        baseURL: process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        apiKey: process.env.DASHSCOPE_API_KEY || '',
      });
      return dashscopeClient('qwen-turbo');
  }
}

// ==========================================
// AI 额度管理
// ==========================================

/**
 * 检查用户 AI 额度
 */
export async function checkAIQuota(userId: string): Promise<{ hasQuota: boolean; remaining: number }> {
  const [user] = await db
    .select({
      aiCreateQuotaToday: users.aiCreateQuotaToday,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return { hasQuota: false, remaining: 0 };
  }

  return {
    hasQuota: user.aiCreateQuotaToday > 0,
    remaining: user.aiCreateQuotaToday,
  };
}

/**
 * 消耗 AI 额度
 */
export async function consumeAIQuota(userId: string): Promise<boolean> {
  const [user] = await db
    .select({
      aiCreateQuotaToday: users.aiCreateQuotaToday,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user || user.aiCreateQuotaToday <= 0) {
    return false;
  }

  await db
    .update(users)
    .set({
      aiCreateQuotaToday: user.aiCreateQuotaToday - 1,
    })
    .where(eq(users.id, userId));

  return true;
}

// ==========================================
// 意图分类 (v3.2 新增)
// ==========================================

/**
 * 意图类型
 */
export type IntentType = 'create' | 'explore' | 'unknown';

/**
 * 探索关键词
 */
const EXPLORE_KEYWORDS = [
  '附近', '推荐', '��什么', '好玩', '找', '搜索', '看看',
  '周边', '哪里', '什么活动', '有没有', '想玩', '想去',
];

/**
 * 分类用户意图
 * - 明确创建意图：包含时间 + 地点 + 活动类型
 * - 模糊探索意图：包含探索关键词
 * - 无法识别：其他情况
 */
export function classifyIntent(text: string): IntentType {
  const lowerText = text.toLowerCase();
  
  // 检查是否包含探索关键词
  const hasExploreKeyword = EXPLORE_KEYWORDS.some(keyword => 
    text.includes(keyword)
  );
  
  if (hasExploreKeyword) {
    return 'explore';
  }
  
  // 检查是否包含创建活动的关键信息
  // 时间关键词
  const timeKeywords = [
    '今天', '明天', '后天', '今晚', '明晚', '周末', '周六', '周日',
    '下午', '晚上', '上午', '中午', '点', '号', '日',
  ];
  const hasTime = timeKeywords.some(keyword => text.includes(keyword));
  
  // 地点关键词（重庆地区）
  const locationKeywords = [
    '观音桥', '解放碑', '南坪', '沙坪坝', '江北', '杨家坪', '大坪', '北碚',
    '渝北', '九龙坡', '渝中', '巴南', '两江', '龙头寺', '三峡广场',
  ];
  const hasLocation = locationKeywords.some(keyword => text.includes(keyword));
  
  // 活动类型关键词
  const activityKeywords = [
    '火锅', '烧烤', '吃饭', '聚餐', '美食', // food
    '麻将', '桌游', '剧本杀', '狼人杀', '三国杀', // boardgame
    '足球', '篮球', '羽毛球', '乒乓球', '跑步', '健身', // sports
    '唱歌', 'KTV', '电影', '看电影', '逛街', '游戏', // entertainment
  ];
  const hasActivity = activityKeywords.some(keyword => text.includes(keyword));
  
  // 如果包含时间和地点，或者时间和活动类型，认为是创建意图
  if ((hasTime && hasLocation) || (hasTime && hasActivity) || (hasLocation && hasActivity)) {
    return 'create';
  }
  
  // 如果只有活动类型，可能是创建意图
  if (hasActivity && text.length > 5) {
    return 'create';
  }
  
  return 'unknown';
}

/**
 * 从文本中提取地点信息
 */
function extractLocation(text: string): { name: string; lat: number; lng: number } | null {
  const locationKeywords: Record<string, { lat: number; lng: number }> = {
    '观音桥': { lat: 29.5630, lng: 106.5516 },
    '解放碑': { lat: 29.5647, lng: 106.5770 },
    '南坪': { lat: 29.5230, lng: 106.5516 },
    '沙坪坝': { lat: 29.5410, lng: 106.4550 },
    '江北': { lat: 29.6060, lng: 106.5740 },
    '杨家坪': { lat: 29.5030, lng: 106.5100 },
    '大坪': { lat: 29.5380, lng: 106.5230 },
    '北碚': { lat: 29.8260, lng: 106.4370 },
    '渝北': { lat: 29.7180, lng: 106.6310 },
    '九龙坡': { lat: 29.5020, lng: 106.5110 },
    '渝中': { lat: 29.5530, lng: 106.5690 },
    '龙头寺': { lat: 29.5850, lng: 106.5350 },
    '三峡广场': { lat: 29.5410, lng: 106.4550 },
  };
  
  for (const [name, coords] of Object.entries(locationKeywords)) {
    if (text.includes(name)) {
      return { name, ...coords };
    }
  }
  
  return null;
}

// ==========================================
// AI 解析
// ==========================================

/**
 * AI 解析文本 - 返回 streamText 结果
 */
export async function parseTextStream(request: AIParseRequest) {
  const { text, location } = request;
  
  // 构建位置上下文
  let locationContext = '';
  if (location) {
    locationContext = `用户当前位置：经度${location[0]}，纬度${location[1]}（重庆地区）。`;
  }

  const result = await streamText({
    model: getAIModel(),
    system: `你是聚场 AI 助手，专门帮助用户解析活动信息。
${locationContext}

请解析用户输入，提取活动相关信息。
重庆地形复杂，如果涉及位置，请在 locationHint 中补充楼层、入口等信息。

返回 JSON 格式：
{
  "parsed": {
    "title": "活动标题",
    "description": "活动描述",
    "type": "food/entertainment/sports/boardgame/other",
    "startAt": "ISO时间格式",
    "endAt": "ISO时间格式或null",
    "location": [经度, 纬度] 或 null,
    "locationName": "地点名称",
    "address": "详细地址",
    "locationHint": "位置备注（如：负一楼、从解放碑方向入口）",
    "maxParticipants": 人数,
    "feeType": "free/aa/treat",
    "estimatedCost": 预估费用
  },
  "confidence": 0.8,
  "suggestions": ["建议1", "建议2"]
}

只返回 JSON，不要其他文字。`,
    prompt: text,
    maxTokens: 500,
  });

  return result;
}

/**
 * 解析 AI 返回的 JSON 文本
 */
export function parseAIResponse(text: string): AIParseResponse {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // 处理重庆地理位置
      if (parsed.parsed?.locationName && !parsed.parsed?.location) {
        const locationKeywords: Record<string, [number, number]> = {
          '观音桥': [106.5516, 29.5630],
          '解放碑': [106.5770, 29.5647],
          '南坪': [106.5516, 29.5230],
          '沙坪坝': [106.4550, 29.5410],
          '江北': [106.5740, 29.6060],
          '杨家坪': [106.5100, 29.5030],
          '大坪': [106.5230, 29.5380],
          '北碚': [106.4370, 29.8260],
        };
        
        for (const [keyword, coords] of Object.entries(locationKeywords)) {
          if (parsed.parsed.locationName.includes(keyword)) {
            parsed.parsed.location = coords;
            break;
          }
        }
      }
      
      return {
        parsed: parsed.parsed || {},
        confidence: parsed.confidence || 0.5,
        suggestions: parsed.suggestions || [],
      };
    }
  } catch (error) {
    console.error('AI 响应解析失败:', error);
  }
  
  // 回退响应
  return {
    parsed: {},
    confidence: 0.3,
    suggestions: ['请提供更详细的活动信息'],
  };
}

// ==========================================
// 创建 Draft 活动 (v3.2 新增)
// ==========================================

/**
 * 活动草稿数据
 */
export interface ActivityDraft {
  title: string;
  description?: string;
  type: 'food' | 'entertainment' | 'sports' | 'boardgame' | 'other';
  startAt: string;
  location: [number, number]; // [lng, lat]
  locationName: string;
  address?: string;
  locationHint: string;
  maxParticipants: number;
}

/**
 * 从 AI 解析结果创建 draft 状态的活动
 */
export async function createDraftActivity(
  userId: string,
  draft: ActivityDraft
): Promise<{ activityId: string }> {
  const { location, startAt, ...activityData } = draft;
  
  // 创建 draft 状态的活动
  const [newActivity] = await db
    .insert(activities)
    .values({
      ...activityData,
      creatorId: userId,
      location: sql`ST_SetSRID(ST_MakePoint(${location[0]}, ${location[1]}), 4326)`,
      startAt: new Date(startAt),
      currentParticipants: 1,
      status: 'draft', // 草稿状态
    })
    .returning({ id: activities.id });
  
  // 将创建者加入参与者列表
  await db
    .insert(participants)
    .values({
      activityId: newActivity.id,
      userId,
      status: 'joined',
    });
  
  return { activityId: newActivity.id };
}

/**
 * 创建 Widget_Draft 对话记录
 */
export async function createDraftMessage(
  userId: string,
  draft: ActivityDraft,
  activityId: string
): Promise<{ messageId: string }> {
  const [message] = await db
    .insert(homeMessages)
    .values({
      userId,
      role: 'ai',
      type: 'widget_draft',
      content: {
        ...draft,
        activityId,
      },
      activityId,
    })
    .returning({ id: homeMessages.id });
  
  return { messageId: message.id };
}

// ==========================================
// 探索场景 (v3.2 新增)
// ==========================================

/**
 * 探索结果项
 */
export interface ExploreResult {
  id: string;
  title: string;
  type: string;
  lat: number;
  lng: number;
  locationName: string;
  distance: number;
  startAt: string;
  currentParticipants: number;
  maxParticipants: number;
}

/**
 * 探索响应
 */
export interface ExploreResponse {
  center: { lat: number; lng: number; name: string };
  results: ExploreResult[];
  title: string;
}

/**
 * 创建 Widget_Explore 对话记录
 */
export async function createExploreMessage(
  userId: string,
  exploreData: ExploreResponse
): Promise<{ messageId: string }> {
  const [message] = await db
    .insert(homeMessages)
    .values({
      userId,
      role: 'ai',
      type: 'widget_explore',
      content: exploreData,
    })
    .returning({ id: homeMessages.id });
  
  return { messageId: message.id };
}

/**
 * 创建文本引导消息
 */
export async function createTextMessage(
  userId: string,
  text: string
): Promise<{ messageId: string }> {
  const [message] = await db
    .insert(homeMessages)
    .values({
      userId,
      role: 'ai',
      type: 'text',
      content: { text },
    })
    .returning({ id: homeMessages.id });
  
  return { messageId: message.id };
}

// ==========================================
// 对话历史管理 (v3.2 新增)
// ==========================================

/**
 * 获取用户对话历史（分页）
 */
export async function getConversations(
  userId: string,
  query: ConversationsQuery
): Promise<ConversationsResponse> {
  const limit = query.limit || 20;
  
  // 构建查询条件
  let conditions = [eq(homeMessages.userId, userId)];
  
  // 如果有游标，获取游标消息的创建时间
  if (query.cursor) {
    const [cursorMessage] = await db
      .select({ createdAt: homeMessages.createdAt })
      .from(homeMessages)
      .where(eq(homeMessages.id, query.cursor))
      .limit(1);
    
    if (cursorMessage) {
      conditions.push(lt(homeMessages.createdAt, cursorMessage.createdAt));
    }
  }
  
  // 查询消息（多取一条用于判断 hasMore）
  const messages = await db
    .select()
    .from(homeMessages)
    .where(sql`${homeMessages.userId} = ${userId}${query.cursor ? sql` AND ${homeMessages.createdAt} < (SELECT created_at FROM home_messages WHERE id = ${query.cursor})` : sql``}`)
    .orderBy(desc(homeMessages.createdAt))
    .limit(limit + 1);
  
  // 判断是否还有更多
  const hasMore = messages.length > limit;
  const items = messages.slice(0, limit);
  
  // 转换为响应格式
  const conversationMessages: ConversationMessage[] = items.map(m => ({
    id: m.id,
    userId: m.userId,
    role: m.role,
    type: m.type as HomeMessageType,
    content: m.content,
    activityId: m.activityId,
    createdAt: m.createdAt.toISOString(),
  }));
  
  return {
    items: conversationMessages,
    hasMore,
    cursor: items.length > 0 ? items[items.length - 1].id : null,
  };
}

/**
 * 添加用户消息到对话历史
 */
export async function addUserMessage(
  userId: string,
  content: string
): Promise<{ id: string }> {
  const [message] = await db
    .insert(homeMessages)
    .values({
      userId,
      role: 'user',
      type: 'text',
      content: { text: content },
    })
    .returning({ id: homeMessages.id });
  
  return { id: message.id };
}

/**
 * 添加 AI 消息到对话历史
 */
export async function addAIMessage(
  userId: string,
  type: HomeMessageType,
  content: Record<string, unknown>,
  activityId?: string
): Promise<{ id: string }> {
  const [message] = await db
    .insert(homeMessages)
    .values({
      userId,
      role: 'ai',
      type,
      content,
      activityId,
    })
    .returning({ id: homeMessages.id });
  
  return { id: message.id };
}

/**
 * 清空用户对话历史
 */
export async function clearConversations(userId: string): Promise<{ deletedCount: number }> {
  const result = await db
    .delete(homeMessages)
    .where(eq(homeMessages.userId, userId))
    .returning({ id: homeMessages.id });
  
  return { deletedCount: result.length };
}
