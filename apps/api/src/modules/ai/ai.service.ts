// AI Service - v3.3 Chat-First: AI 解析 + 对话历史管理 + 意图分类 + Tools
import { db, users, conversations, activities, participants, eq, desc, sql } from '@juchang/db';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool, jsonSchema } from 'ai';
import { t, type Static } from 'elysia';
import type { 
  AIParseRequest, 
  AIParseResponse, 
  ConversationsQuery,
  ConversationMessageType,
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

// ==========================================
// Vercel AI SDK Tools (v3.3 新增)
// ==========================================

/**
 * Tool Schema: 创建活动草稿
 * 
 * 当用户意图明确（包含时间 + 地点 + 活动类型）时，
 * AI 调用此 Tool 创建 draft 状态的活动。
 */
const CreateActivityDraftSchema = t.Object({
  title: t.String({ description: '活动标题' }),
  description: t.Optional(t.String({ description: '活动描述' })),
  type: t.Union([
    t.Literal('food'),
    t.Literal('entertainment'),
    t.Literal('sports'),
    t.Literal('boardgame'),
    t.Literal('other'),
  ], { description: '活动类型' }),
  startAt: t.String({ description: 'ISO 8601 格式的开始时间' }),
  location: t.Tuple([t.Number(), t.Number()], { description: '位置坐标 [lng, lat]' }),
  locationName: t.String({ description: '地点名称' }),
  address: t.Optional(t.String({ description: '详细地址' })),
  locationHint: t.String({ description: '重庆地形位置备注（如：负一楼、从解放碑方向入口）' }),
  maxParticipants: t.Number({ description: '最大参与人数', minimum: 2, maximum: 50 }),
});

export type CreateActivityDraftParams = Static<typeof CreateActivityDraftSchema>;

/**
 * Tool Schema: 探索附近活动
 * 
 * 当用户意图模糊（"附近有什么"、"推荐"）时，
 * AI 调用此 Tool 搜索附近活动。
 */
const ExploreNearbySchema = t.Object({
  center: t.Object({
    lat: t.Number({ description: '中心点纬度' }),
    lng: t.Number({ description: '中心点经度' }),
    name: t.String({ description: '地点名称（如：观音桥）' }),
  }, { description: '搜索中心点' }),
  type: t.Optional(t.Union([
    t.Literal('food'),
    t.Literal('entertainment'),
    t.Literal('sports'),
    t.Literal('boardgame'),
    t.Literal('other'),
  ], { description: '活动类型筛选' })),
  radius: t.Optional(t.Number({ description: '搜索半径（米）', default: 5000 })),
});

export type ExploreNearbyParams = Static<typeof ExploreNearbySchema>;

/**
 * 获取 AI Tools 定义
 * 
 * 使用 jsonSchema() 将 TypeBox Schema 转换为 Vercel AI SDK 兼容格式。
 * TypeBox 的 Schema 对象包含 Symbol 属性，需要通过 JSON.parse/stringify 清理。
 * 
 * 这些 Tools 会被 Admin Playground 的 useChat hook 捕获，
 * 自动渲染对应的 Inspector 组件。
 */
export function getAITools(userId: string) {
  return {
    createActivityDraft: tool({
      description: `创建活动草稿。当用户明确表达了创建活动的意图，且包含以下信息时调用：
- 时间（今天、明天、周末、具体日期等）
- 地点（观音桥、解放碑、南坪等重庆地区）
- 活动类型（火锅、麻将、足球、KTV等）

重庆地形复杂，请在 locationHint 中补充楼层、入口等信息。`,
      parameters: jsonSchema<CreateActivityDraftParams>(
        JSON.parse(JSON.stringify(CreateActivityDraftSchema))
      ),
      execute: async (params) => {
        // 创建 draft 活动
        const { location, startAt, ...activityData } = params;
        
        const [newActivity] = await db
          .insert(activities)
          .values({
            ...activityData,
            creatorId: userId,
            location: sql`ST_SetSRID(ST_MakePoint(${location[0]}, ${location[1]}), 4326)`,
            startAt: new Date(startAt),
            currentParticipants: 1,
            status: 'draft',
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
        
        // 创建对话记录
        await db
          .insert(conversations)
          .values({
            userId,
            role: 'assistant',
            messageType: 'widget_draft',
            content: {
              ...params,
              activityId: newActivity.id,
            },
            activityId: newActivity.id,
          });
        
        return {
          success: true,
          activityId: newActivity.id,
          draft: {
            ...params,
            activityId: newActivity.id,
          },
        };
      },
    }),
    
    exploreNearby: tool({
      description: `探索附近活动。当用户表达探索性意图时调用，例如：
- "附近有什么好玩的"
- "推荐一下观音桥的活动"
- "有什么局可以参加"
- "想找点事情做"

返回指定区域内的活动列表。`,
      parameters: jsonSchema<ExploreNearbyParams>(
        JSON.parse(JSON.stringify(ExploreNearbySchema))
      ),
      execute: async (params) => {
        const { center, type, radius = 5000 } = params;
        
        // 查询附近活动
        let query = sql`
          SELECT 
            a.id,
            a.title,
            a.type,
            ST_Y(a.location::geometry) as lat,
            ST_X(a.location::geometry) as lng,
            a.location_name as "locationName",
            ST_Distance(
              a.location::geography,
              ST_SetSRID(ST_MakePoint(${center.lng}, ${center.lat}), 4326)::geography
            ) as distance,
            a.start_at as "startAt",
            a.current_participants as "currentParticipants",
            a.max_participants as "maxParticipants"
          FROM activities a
          WHERE a.status = 'active'
            AND a.start_at > NOW()
            AND ST_DWithin(
              a.location::geography,
              ST_SetSRID(ST_MakePoint(${center.lng}, ${center.lat}), 4326)::geography,
              ${radius}
            )
        `;
        
        if (type) {
          query = sql`${query} AND a.type = ${type}`;
        }
        
        query = sql`${query} ORDER BY distance ASC LIMIT 10`;
        
        const results = await db.execute(query) as unknown as ExploreResult[];
        
        const exploreData = {
          center,
          results: results.map(r => ({
            ...r,
            distance: Math.round(Number(r.distance)),
            startAt: new Date(r.startAt).toISOString(),
          })),
          title: `为你找到${center.name}附近的 ${results.length} 个热门活动`,
        };
        
        // 创建对话记录
        await db
          .insert(conversations)
          .values({
            userId,
            role: 'assistant',
            messageType: 'widget_explore',
            content: exploreData,
          });
        
        return {
          success: true,
          explore: exploreData,
        };
      },
    }),
  };
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
// 意图分类 (v3.3 已迁移到 Tools)
// ==========================================

/**
 * 意图类型
 * 
 * v3.3 更新：意图分类逻辑已迁移到 Vercel AI SDK Tools
 * AI 会自动选择调用 createActivityDraft 或 exploreNearby
 * 
 * - create: 明确创建意图 → AI 调用 createActivityDraft Tool
 * - explore: 模糊探索意图 → AI 调用 exploreNearby Tool  
 * - unknown: 无法识别 → AI 返回文本引导
 */
export type IntentType = 'create' | 'explore' | 'unknown';

// ==========================================
// AI 解析
// ==========================================

/**
 * AI 解析文本 - 返回 streamText 结果 (v3.3 Tools 版本)
 * 
 * 使用 Vercel AI SDK Tools 进行意图分类：
 * - createActivityDraft: 明确创建意图
 * - exploreNearby: 模糊探索意图
 * 
 * Admin Playground 的 useChat hook 会自动捕获 toolInvocations，
 * 渲染对应的 Inspector 组件。
 */
export async function parseTextStream(request: AIParseRequest, userId: string) {
  const { text, location } = request;
  
  // 构建位置上下文
  let locationContext = '';
  if (location) {
    locationContext = `用户当前位置：经度${location[0]}，纬度${location[1]}（重庆地区）。`;
  }

  const result = await streamText({
    model: getAIModel(),
    system: `你是聚场 AI 助手，专门帮助用户组织线下活动。
${locationContext}

你有两个工具可以使用：
1. createActivityDraft - 当用户明确想创建活动时使用（需要时间+地点+活动类型）
2. exploreNearby - 当用户想探索附近活动时使用（"附近有什么"、"推荐"等）

重庆地形复杂，如果涉及位置，请在 locationHint 中补充楼层、入口等信息。

如果用户意图不明确，请用友好的语气引导用户提供更多信息。
语气要接地气，不要太正式。例如：
- ✅ "帮你把局组好了！就在观音桥，离地铁口 200 米"
- ❌ "已为您构建全息活动契约"`,
    prompt: text,
    tools: getAITools(userId),
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
    .insert(conversations)
    .values({
      userId,
      role: 'assistant',
      messageType: 'widget_draft',
      content: {
        ...draft,
        activityId,
      },
      activityId,
    })
    .returning({ id: conversations.id });
  
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
    .insert(conversations)
    .values({
      userId,
      role: 'assistant',
      messageType: 'widget_explore',
      content: exploreData,
    })
    .returning({ id: conversations.id });
  
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
    .insert(conversations)
    .values({
      userId,
      role: 'assistant',
      messageType: 'text',
      content: { text },
    })
    .returning({ id: conversations.id });
  
  return { messageId: message.id };
}

// ==========================================
// 对话历史管理 (v3.3 增强版 - 支持多种筛选)
// ==========================================

/**
 * 对话消息响应项（包含用户信息）
 */
interface ConversationMessageWithUser {
  id: string;
  userId: string;
  userNickname: string | null;
  role: 'user' | 'assistant';
  type: ConversationMessageType;
  content: unknown;
  activityId: string | null;
  createdAt: string;
}

/**
 * 对话历史响应
 */
interface ConversationsResponseEnhanced {
  items: ConversationMessageWithUser[];
  total: number;
  hasMore: boolean;
  cursor: string | null;
}

/**
 * 获取对话历史（增强版 - 支持多种筛选）
 * - 小程序端：不传 userId，查当前用户
 * - Admin 端：传 userId 查指定用户，或不传查所有用户
 */
export async function getConversations(
  currentUserId: string,
  query: ConversationsQuery
): Promise<ConversationsResponseEnhanced> {
  const limit = query.limit || 20;
  
  // 确定查询的用户 ID
  // 如果传了 userId 参数，查指定用户；否则查当前用户
  const targetUserId = query.userId || currentUserId;
  const queryAllUsers = query.userId === undefined && currentUserId === 'admin'; // 特殊标记查所有用户
  
  // 构建 WHERE 条件
  let whereConditions = sql`1=1`;
  
  // 用户筛选
  if (!queryAllUsers && targetUserId) {
    whereConditions = sql`${whereConditions} AND ${conversations.userId} = ${targetUserId}`;
  }
  
  // 活动 ID 筛选
  if (query.activityId) {
    whereConditions = sql`${whereConditions} AND ${conversations.activityId} = ${query.activityId}`;
  }
  
  // 消息类型筛选
  if (query.messageType) {
    whereConditions = sql`${whereConditions} AND ${conversations.messageType} = ${query.messageType}`;
  }
  
  // 角色筛选
  if (query.role) {
    whereConditions = sql`${whereConditions} AND ${conversations.role} = ${query.role}`;
  }
  
  // 游标分页
  if (query.cursor) {
    whereConditions = sql`${whereConditions} AND ${conversations.createdAt} < (SELECT created_at FROM conversations WHERE id = ${query.cursor})`;
  }
  
  // 查询总数
  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(conversations)
    .where(whereConditions);
  
  const total = countResult?.count || 0;
  
  // 查询数据（关联用户表获取昵称）
  const messages = await db
    .select({
      id: conversations.id,
      userId: conversations.userId,
      userNickname: users.nickname,
      role: conversations.role,
      messageType: conversations.messageType,
      content: conversations.content,
      activityId: conversations.activityId,
      createdAt: conversations.createdAt,
    })
    .from(conversations)
    .leftJoin(users, eq(conversations.userId, users.id))
    .where(whereConditions)
    .orderBy(desc(conversations.createdAt))
    .limit(limit + 1);
  
  // 判断是否还有更多
  const hasMore = messages.length > limit;
  const items = messages.slice(0, limit);
  
  // 转换为响应格式
  const conversationMessages: ConversationMessageWithUser[] = items.map(m => ({
    id: m.id,
    userId: m.userId,
    userNickname: m.userNickname,
    role: m.role as 'user' | 'assistant',
    type: m.messageType as ConversationMessageType,
    content: m.content,
    activityId: m.activityId,
    createdAt: m.createdAt.toISOString(),
  }));
  
  return {
    items: conversationMessages,
    total,
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
    .insert(conversations)
    .values({
      userId,
      role: 'user',
      messageType: 'text',
      content: { text: content },
    })
    .returning({ id: conversations.id });
  
  return { id: message.id };
}

/**
 * 添加 AI 消息到对话历史
 */
export async function addAIMessage(
  userId: string,
  type: ConversationMessageType,
  content: Record<string, unknown>,
  activityId?: string
): Promise<{ id: string }> {
  const [message] = await db
    .insert(conversations)
    .values({
      userId,
      role: 'assistant',
      messageType: type,
      content,
      activityId,
    })
    .returning({ id: conversations.id });
  
  return { id: message.id };
}

/**
 * 清空用户对话历史
 */
export async function clearConversations(userId: string): Promise<{ deletedCount: number }> {
  const result = await db
    .delete(conversations)
    .where(eq(conversations.userId, userId))
    .returning({ id: conversations.id });
  
  return { deletedCount: result.length };
}
