// Participant Controller - 参与者辅助接口 (MVP 简化版)
// 主要逻辑已移到 activities 模块
import { Elysia, t } from 'elysia';
import { basePlugins } from '../../setup';
import { participantModel, type ErrorResponse } from './participant.model';
import { getActivityParticipants } from './participant.service';

export const participantController = new Elysia({ prefix: '/participants' })
  .use(basePlugins)
  .use(participantModel)

  // 获取活动参与者列表
  .get(
    '/activity/:id',
    async ({ params, set }) => {
      try {
        const participantsList = await getActivityParticipants(params.id);
        return participantsList;
      } catch (error: any) {
        set.status = 500;
        return {
          code: 500,
          msg: error.message || '获取参与者列表失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Participants'],
        summary: '获取活动参与者列表',
        description: '获取指定活动的参与者列表',
      },
      params: 'participant.idParams',
      response: {
        200: t.Array(t.Ref('participant.info')),
        500: 'participant.error',
      },
    }
  );
