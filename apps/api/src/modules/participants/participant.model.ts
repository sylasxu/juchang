// Participant Model - TypeBox schemas (MVP 简化版)
// 主要逻辑已移到 activities 模块，此模块仅保留辅助功能
import { Elysia, t, type Static } from 'elysia';

/**
 * Participant Model Plugin (MVP 简化版)
 * 
 * MVP 中参与者管理已整合到 activities 模块：
 * - POST /activities/:id/join - 报名
 * - POST /activities/:id/quit - 退出
 * 
 * 此模块仅保留获取参与者列表的辅助接口
 */

// 参与者信息
const ParticipantInfo = t.Object({
  id: t.String(),
  userId: t.String(),
  status: t.String(),
  joinedAt: t.Union([t.String(), t.Null()]),
  user: t.Union([
    t.Object({
      id: t.String(),
      nickname: t.Union([t.String(), t.Null()]),
      avatarUrl: t.Union([t.String(), t.Null()]),
    }),
    t.Null(),
  ]),
});

// 路径参数
const IdParams = t.Object({
  id: t.String({ format: 'uuid', description: '活动ID' }),
});

// 错误响应
const ErrorResponse = t.Object({
  code: t.Number(),
  msg: t.String(),
});

// 注册到 Elysia
export const participantModel = new Elysia({ name: 'participantModel' })
  .model({
    'participant.info': ParticipantInfo,
    'participant.idParams': IdParams,
    'participant.error': ErrorResponse,
  });

// 导出 TS 类型
export type ParticipantInfo = Static<typeof ParticipantInfo>;
export type IdParams = Static<typeof IdParams>;
export type ErrorResponse = Static<typeof ErrorResponse>;
