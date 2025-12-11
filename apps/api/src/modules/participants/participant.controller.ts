// Participant Controller - 参与者功能控制器
import { Elysia, t } from 'elysia';
import { basePlugins, verifyAuth } from '../../setup';
import { 
  participantModel, 
  ParticipantDetail,
  type ErrorResponse 
} from './participant.model';
import { 
  joinActivity, 
  approveParticipant,
  getActivityParticipants,
  confirmFulfillment,
  disputeAbsence 
} from './participant.service';

export const participantController = new Elysia({ prefix: '/participants' })
  .use(basePlugins) // 引入基础插件（包含 JWT）
  .use(participantModel) // 引入 Model Plugin
  
  // 报名参加活动
  .post(
    '/join',
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
        const result = await joinActivity(user.id, body);
        return {
          msg: '报名成功',
          participantId: result.id,
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
        tags: ['Participants'],
        summary: '报名参加活动',
        description: '用户报名参加活动，支持优先入场券',
      },
      body: 'participant.joinRequest',
      response: {
        200: 'participant.success',
        400: 'participant.error',
      },
    }
  )
  
  // 审批参与申请（发起人操作）
  .post(
    '/approve',
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
        await approveParticipant(user.id, body);
        return {
          msg: '审批成功',
        };
      } catch (error) {
        set.status = 400;
        return {
          code: 400,
          msg: error instanceof Error ? error.message : '审批失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Participants'],
        summary: '审批参与申请',
        description: '活动发起人审批用户的参与申请',
      },
      body: 'participant.approvalRequest',
      response: {
        200: 'participant.success',
        400: 'participant.error',
      },
    }
  )
  
  // 获取活动参与者列表（允许匿名查看）
  .get(
    '/activity/:id',
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
        tags: ['Participants'],
        summary: '获取活动参与者',
        description: '获取指定活动的参与者列表',
      },
      params: 'participant.idParams',
      response: {
        200: t.Array(ParticipantDetail),
        500: 'participant.error',
      },
    }
  )
  
  // 履约确认（发起人操作）
  .post(
    '/confirm-fulfillment',
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
        await confirmFulfillment(user.id, body);
        return {
          msg: '履约确认成功',
        };
      } catch (error) {
        set.status = 400;
        return {
          code: 400,
          msg: error instanceof Error ? error.message : '履约确认失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Participants'],
        summary: '履约确认',
        description: '活动发起人确认参与者的履约情况',
      },
      body: 'participant.fulfillmentRequest',
      response: {
        200: 'participant.success',
        400: 'participant.error',
      },
    }
  )
  
  // 申诉未到场标记
  .post(
    '/dispute',
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
        await disputeAbsence(user.id, body);
        return {
          msg: '申诉提交成功',
        };
      } catch (error) {
        set.status = 400;
        return {
          code: 400,
          msg: error instanceof Error ? error.message : '申诉失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Participants'],
        summary: '申诉未到场',
        description: '用户对"未到场"标记进行申诉',
      },
      body: 'participant.disputeRequest',
      response: {
        200: 'participant.success',
        400: 'participant.error',
      },
    }
  );