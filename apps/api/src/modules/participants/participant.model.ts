// Participant Model - 参与者相关的 TypeBox Schema
import { Elysia, t, type Static } from 'elysia';
import { selectParticipantSchema, insertParticipantSchema, selectUserSchema } from '@juchang/db';

/**
 * Participant Model Plugin
 * 处理活动参与相关的请求和响应模型
 */

// 报名请求（从 insertParticipantSchema 派生）
const JoinActivityRequest = t.Intersect([
  t.Pick(insertParticipantSchema, ['applicationMsg']),
  t.Object({
    activityId: t.String({ format: 'uuid', description: '活动ID' }),
    useFastPass: t.Optional(t.Boolean({ description: '是否使用优先入场券' })),
  }),
]);

// 审批请求
const ApprovalRequest = t.Object({
  participantId: t.String({ format: 'uuid', description: '参与者ID' }),
  action: t.Union([
    t.Literal('approve'),
    t.Literal('reject'),
  ]),
  reason: t.Optional(t.String({ description: '拒绝原因' })),
});

// 参与者详情（包含用户信息）
const ParticipantDetail = t.Intersect([
  selectParticipantSchema,
  t.Object({
    user: t.Pick(selectUserSchema, [
      'id',
      'nickname',
      'avatarUrl',
      'participationCount',
      'fulfillmentCount',
      'gender',
      'interestTags',
    ]),
  }),
]);

// 履约确认请求
const FulfillmentRequest = t.Object({
  activityId: t.String({ format: 'uuid', description: '活动ID' }),
  participants: t.Array(t.Object({
    userId: t.String({ format: 'uuid' }),
    fulfilled: t.Boolean({ description: '是否履约' }),
  })),
});

// 申诉请求
const DisputeRequest = t.Object({
  participantId: t.String({ format: 'uuid', description: '参与者记录ID' }),
  reason: t.Optional(t.String({ description: '申诉理由' })),
});

// 路径参数
const IdParams = t.Object({
  id: t.String({ format: 'uuid', description: 'ID' }),
});

// 错误响应
const ErrorResponse = t.Object({
  code: t.Number(),
  msg: t.String(),
});

// 成功响应
const SuccessResponse = t.Object({
  msg: t.String(),
});

// 注册到 Elysia
export const participantModel = new Elysia({ name: 'participantModel' })
  .model({
    'participant.joinRequest': JoinActivityRequest,
    'participant.approvalRequest': ApprovalRequest,
    'participant.detail': ParticipantDetail,
    'participant.fulfillmentRequest': FulfillmentRequest,
    'participant.disputeRequest': DisputeRequest,
    'participant.idParams': IdParams,
    'participant.error': ErrorResponse,
    'participant.success': SuccessResponse,
  });

// 导出 Schema 对象和 TS 类型
export {
  JoinActivityRequest,
  ApprovalRequest,
  ParticipantDetail,
  FulfillmentRequest,
  DisputeRequest,
  IdParams,
  ErrorResponse,
  SuccessResponse
};

// 导出 TS 类型
export type JoinActivityRequest = Static<typeof JoinActivityRequest>;
export type ApprovalRequest = Static<typeof ApprovalRequest>;
export type ParticipantDetail = Static<typeof ParticipantDetail>;
export type FulfillmentRequest = Static<typeof FulfillmentRequest>;
export type DisputeRequest = Static<typeof DisputeRequest>;
export type IdParams = Static<typeof IdParams>;
export type ErrorResponse = Static<typeof ErrorResponse>;
export type SuccessResponse = Static<typeof SuccessResponse>;