/**
 * exploreNearby Tool
 * 
 * 探索附近活动。当用户表达探索性意图时使用：
 * - "附近有什么好玩的"
 * - "推荐一下观音桥的活动"
 * - "有什么局可以参加"
 */

import { t } from 'elysia';
import { tool, jsonSchema } from 'ai';
import { toJsonSchema } from '@juchang/utils';
import { db, sql } from '@juchang/db';

/**
 * Tool Schema - 使用 TypeBox 语法
 * 处理嵌套对象结构
 */
const exploreNearbySchema = t.Object({
  center: t.Object({
    lat: t.Number({ description: '中心点纬度' }),
    lng: t.Number({ description: '中心点经度' }),
    name: t.String({ description: '地点名称，如"观音桥"' }),
  }, { description: '搜索中心点' }),
  type: t.Optional(t.Union([
    t.Literal('food'),
    t.Literal('entertainment'),
    t.Literal('sports'),
    t.Literal('boardgame'),
    t.Literal('other'),
  ], { description: '活动类型筛选' })),
  radius: t.Optional(t.Number({ default: 5000, description: '搜索半径（米），默认 5000' })),
});

/** 类型自动推导 */
type ExploreNearbyParams = typeof exploreNearbySchema.static;

/**
 * 探索结果项
 */
interface ExploreResult {
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
 * 创建 exploreNearby Tool
 * 
 * @param _userId - 用户 ID（保留参数，与其他 Tool 签名一致）
 */
export function exploreNearbyTool(_userId: string | null) {
  return tool({
    description: `探索附近活动。当用户表达探索性意图时使用，例如：
- "附近有什么好玩的"
- "推荐一下观音桥的活动"
- "有什么局可以参加"
- "想找点事情做"

返回指定区域内的活动列表，渲染为 Widget_Explore 卡片。`,
    
    inputSchema: jsonSchema<ExploreNearbyParams>(toJsonSchema(exploreNearbySchema)),
    
    execute: async ({ center, type, radius = 5000 }: ExploreNearbyParams) => {
      try {
        // 构建查询
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
            AND a.current_participants < a.max_participants
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
          title: results.length > 0 
            ? `为你找到${center.name}附近的 ${results.length} 个热门活动`
            : `${center.name}附近暂时没有活动，要不自己组一个？`,
        };
        
        // v3.8: 对话记录由小程序端统一处理，Tool 只返回结果
        return {
          success: true as const,
          explore: exploreData,
        };
      } catch (error) {
        console.error('[exploreNearby] Error:', error);
        return {
          success: false as const,
          error: '搜索失败，请再试一次',
        };
      }
    },
  });
}
