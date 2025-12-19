// Activity Controller - Elysia 实例作为控制器
import { Elysia, t } from 'elysia';
import { basePlugins, verifyAuth } from '../../setup';
import { 
  activityModel, 
  MapActivityItem,
  type ErrorResponse 
} from './activity.model';
import { 
  getActivitiesNearby, 
  getActivitiesNearbyWithClustering,
  getActivitiesList,
  createActivity, 
  getActivityById,
  updateActivity,
  deleteActivity,
  joinActivity,
  cancelJoin,
  confirmActivity,
  getActivityParticipants,
  createGhostAnchor
} from './activity.service';

export const activityController = new Elysia({ prefix: '/activities' })
  .use(basePlugins) // 引入基础插件（包含 JWT）
  .use(activityModel) // 引入 Model Plugin
  
  // 地图查询 - 获取附近活动
  .get(
    '/map',
    async ({ query }) => {
      const result = await getActivitiesNearby(query);
      return result;
    },
    {
      detail: {
        tags: ['Activities'],
        summary: '地图查询活动',
        description: '根据地理位置查询附近的活动，支持类型和状态筛选',
      },
      query: 'activity.mapQuery',
      response: {
        200: t.Array(MapActivityItem),
      },
    }
  )

  // 创建活动（需要认证）
  .post(
    '/',
    async ({ body, set, jwt, headers }) => {
      // JWT 认证
      const user = await verifyAuth(jwt, headers);
      if (!user) {
        set.status = 401;
        return {
          code: 401,
          msg: '未授权',
        } satisfies ErrorResponse;
      }

      try {
        const newActivity = await createActivity(body, user.id);

        return {
          id: newActivity.id,
          msg: '活动创建成功',
        };
      } catch (error) {
        set.status = 500;
        return {
          code: 500,
          msg: '创建活动失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Activities'],
        summary: '创建活动',
        description: '创建新活动，支持增值服务选项',
      },
      body: 'activity.createRequest',
      response: {
        200: t.Object({
          id: t.String(),
          msg: t.String(),
        }),
        401: 'activity.error',
        500: 'activity.error',
      },
    }
  )

  // 获取活动列表（支持筛选）
  .get(
    '/',
    async ({ query }) => {
      const result = await getActivitiesList(query);
      return {
        data: result,
        total: result.length,
        page: query.page || 1,
        limit: query.limit || 20,
        hasMore: false,
      };
    },
    {
      detail: {
        tags: ['Activities'],
        summary: '获取活动列表',
        description: '获取活动列表，支持地理位置、类型、时间等筛选条件',
      },
      query: 'activity.listQuery',
      response: {
        200: 'activity.listResponse',
      },
    }
  )

  // 🔥 获取附近活动（支持聚合+幽灵标记）
  .get(
    '/nearby',
    async ({ query }) => {
      // 根据 zoom_level 决定是否使用聚合
      const useCluster = (query.zoom_level || 12) < 15;
      
      if (useCluster) {
        const result = await getActivitiesNearbyWithClustering(query);
        return result;
      } else {
        // 高缩放级别时返回详细的活动列表
        const activities = await getActivitiesNearby(query);
        return {
          items: activities.map(activity => ({
            type: 'activity' as const,
            id: activity.id,
            lat: activity.location[1],
            lng: activity.location[0],
            title: activity.title,
            isBoosted: activity.isBoosted,
            isPinPlus: activity.isPinPlus,
            locationHint: activity.locationHint,
          })),
          total: activities.length,
          hasMore: false,
        };
      }
    },
    {
      detail: {
        tags: ['Activities'],
        summary: '获取附近活动（聚合优化）',
        description: '根据地理位置和缩放级别查询附近活动，支持聚合显示和幽灵锚点',
      },
      query: 'activity.mapQuery',
      response: {
        200: 'activity.nearbyResponse',
      },
    }
  )

  // 获取活动详情
  .get(
    '/:id',
    async ({ params, set }) => {
      const activity = await getActivityById(params.id);

      if (!activity) {
        set.status = 404;
        return {
          code: 404,
          msg: '活动不存在',
        } satisfies ErrorResponse;
      }

      return activity;
    },
    {
      detail: {
        tags: ['Activities'],
        summary: '获取活动详情',
        description: '根据活动ID获取活动详情，包含创建者和参与者信息',
      },
      params: 'activity.idParams',
      response: {
        200: 'activity.detailResponse',
        404: 'activity.error',
      },
    }
  )

  // 更新活动信息（创建者操作）
  .put(
    '/:id',
    async ({ params, body, set, jwt, headers }) => {
      // JWT 认证
      const user = await verifyAuth(jwt, headers);
      if (!user) {
        set.status = 401;
        return {
          code: 401,
          msg: '未授权',
        } satisfies ErrorResponse;
      }

      try {
        const updated = await updateActivity(params.id, body, user.id);
        return {
          msg: '活动更新成功',
          activity: updated,
        };
      } catch (error) {
        set.status = 400;
        return {
          code: 400,
          msg: error instanceof Error ? error.message : '更新活动失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Activities'],
        summary: '更新活动信息',
        description: '活动创建者更新活动信息',
      },
      params: 'activity.idParams',
      body: 'activity.updateRequest',
      response: {
        200: t.Object({
          msg: t.String(),
          activity: t.Any(),
        }),
        400: 'activity.error',
        401: 'activity.error',
      },
    }
  )

  // 删除活动（创建者操作）
  .delete(
    '/:id',
    async ({ params, set, jwt, headers }) => {
      // JWT 认证
      const user = await verifyAuth(jwt, headers);
      if (!user) {
        set.status = 401;
        return {
          code: 401,
          msg: '未授权',
        } satisfies ErrorResponse;
      }

      try {
        await deleteActivity(params.id, user.id);
        return {
          msg: '活动删除成功',
        };
      } catch (error) {
        set.status = 400;
        return {
          code: 400,
          msg: error instanceof Error ? error.message : '删除活动失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Activities'],
        summary: '删除活动',
        description: '活动创建者删除活动',
      },
      params: 'activity.idParams',
      response: {
        200: t.Object({
          msg: t.String(),
        }),
        400: 'activity.error',
        401: 'activity.error',
      },
    }
  )

  // 报名参加活动
  .post(
    '/:id/join',
    async ({ params, body, set, jwt, headers }) => {
      // JWT 认证
      const user = await verifyAuth(jwt, headers);
      if (!user) {
        set.status = 401;
        return {
          code: 401,
          msg: '未授权',
        } satisfies ErrorResponse;
      }

      try {
        const result = await joinActivity(params.id, user.id, body);
        return {
          msg: '报名成功',
          participantId: result?.id || 'temp_id',
        };
      } catch (error) {
        set.status = 400;
        return {
          code: 400,
          msg: error instanceof Error ? error.message : '报名失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Activities'],
        summary: '报名参加活动',
        description: '用户报名参加活动',
      },
      params: 'activity.idParams',
      body: 'activity.joinRequest',
      response: {
        200: t.Object({
          msg: t.String(),
          participantId: t.String(),
        }),
        400: 'activity.error',
        401: 'activity.error',
      },
    }
  )

  // 取消报名
  .delete(
    '/:id/join',
    async ({ params, set, jwt, headers }) => {
      // JWT 认证
      const user = await verifyAuth(jwt, headers);
      if (!user) {
        set.status = 401;
        return {
          code: 401,
          msg: '未授权',
        } satisfies ErrorResponse;
      }

      try {
        await cancelJoin(params.id, user.id);
        return {
          msg: '取消报名成功',
        };
      } catch (error) {
        set.status = 400;
        return {
          code: 400,
          msg: error instanceof Error ? error.message : '取消报名失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Activities'],
        summary: '取消报名',
        description: '用户取消活动报名',
      },
      params: 'activity.idParams',
      response: {
        200: t.Object({
          msg: t.String(),
        }),
        400: 'activity.error',
        401: 'activity.error',
      },
    }
  )

  // 确认活动完成（发起人操作）
  .post(
    '/:id/confirm',
    async ({ params, body, set, jwt, headers }) => {
      // JWT 认证
      const user = await verifyAuth(jwt, headers);
      if (!user) {
        set.status = 401;
        return {
          code: 401,
          msg: '未授权',
        } satisfies ErrorResponse;
      }

      try {
        await confirmActivity(params.id, user.id, body);
        return {
          msg: '活动确认成功',
        };
      } catch (error) {
        set.status = 400;
        return {
          code: 400,
          msg: error instanceof Error ? error.message : '活动确认失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Activities'],
        summary: '确认活动完成',
        description: '活动发起人确认活动完成并标记参与者履约情况',
      },
      params: 'activity.idParams',
      body: 'activity.confirmRequest',
      response: {
        200: t.Object({
          msg: t.String(),
        }),
        400: 'activity.error',
        401: 'activity.error',
      },
    }
  )

  // 获取活动参与者列表
  .get(
    '/:id/participants',
    async ({ params, set }) => {
      try {
        const participants = await getActivityParticipants(params.id);
        return participants;
      } catch (error) {
        set.status = 500;
        return {
          code: 500,
          msg: '获取参与者列表失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Activities'],
        summary: '获取活动参与者列表',
        description: '获取指定活动的参与者列表',
      },
      params: 'activity.idParams',
      response: {
        200: t.Array(t.Any()), // 使用participants模块的类型
        500: 'activity.error',
      },
    }
  )

  // 🔥 创建幽灵锚点（运营功能）
  .post(
    '/ghost',
    async ({ body, set, jwt, headers }) => {
      // JWT 认证
      const user = await verifyAuth(jwt, headers);
      if (!user) {
        set.status = 401;
        return {
          code: 401,
          msg: '未授权',
        } satisfies ErrorResponse;
      }

      // TODO: 检查用户是否有运营权限（admin角色）

      try {
        const ghost = await createGhostAnchor(body);
        return {
          id: ghost.id,
          msg: '幽灵锚点创建成功',
        };
      } catch (error) {
        set.status = 500;
        return {
          code: 500,
          msg: error instanceof Error ? error.message : '创建幽灵锚点失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Activities'],
        summary: '创建幽灵锚点',
        description: '运营功能：在地图上创建幽灵锚点，引导用户在特定区域创建活动',
      },
      body: 'activity.createGhostRequest',
      response: {
        200: t.Object({
          id: t.String(),
          msg: t.String(),
        }),
        401: 'activity.error',
        500: 'activity.error',
      },
    }
  );

