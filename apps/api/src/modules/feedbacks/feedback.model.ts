// Feedback Model - TypeBox schemas 派生自 DB Schema
import { Elysia, t, type Static } from 'elysia';
import { selectFeedbackSchema } from '@juchang/db';

/**
 * Feedback Model Plugin
 * 遵循 Single Source of Truth 原则
 */

// 差评原因枚举
const FeedbackReason = t.Union([
  t.Literal('late'),           // 迟到
  t.Literal('no_show'),        // 放鸽子
  t.Literal('bad_attitude'),   // 态度不好
  t.Literal('not_as_described'), // 与描述不符
  t.Literal('other'),          // 其他
]);

// 提交反馈请求
const CreateFeedbackRequest = t.Object({
  activityId: t.String({ format: 'uuid', description: '活动ID' }),
  targetId: t.String({ format: 'uuid', description: '被反馈用户ID' }),
  reason: FeedbackReason,
  description: t.Optional(t.String({ maxLength: 500, description: '详细描述' })),
});

// 反馈列表查询参数
const FeedbackListQuery = t.Object({
  page: t.Optional(t.Number({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 20 })),
  activityId: t.Optional(t.String({ format: 'uuid' })),
  targetId: t.Optional(t.String({ format: 'uuid' })),
  reason: t.Optional(FeedbackReason),
});

// 用户差评统计
const UserFeedbackStats = t.Object({
  totalCount: t.Number({ description: '总差评数' }),
  byReason: t.Record(t.String(), t.Number(), { description: '按原因分类统计' }),
});

// 反馈详情（扩展基础 schema）
const FeedbackDetail = t.Intersect([
  selectFeedbackSchema,
  t.Object({
    activityTitle: t.Optional(t.String()),
    reporterNickname: t.Optional(t.String()),
    targetNickname: t.Optional(t.String()),
  }),
]);

// 反馈列表响应
const FeedbackListResponse = t.Object({
  data: t.Array(FeedbackDetail),
  total: t.Number(),
  page: t.Number(),
  totalPages: t.Number(),
});

// 路径参数
const IdParams = t.Object({
  id: t.String({ format: 'uuid' }),
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

// 注册到 Elysia Model Plugin
export const feedbackModel = new Elysia({ name: 'feedbackModel' })
  .model({
    'feedback.create': CreateFeedbackRequest,
    'feedback.listQuery': FeedbackListQuery,
    'feedback.userStats': UserFeedbackStats,
    'feedback.detail': FeedbackDetail,
    'feedback.listResponse': FeedbackListResponse,
    'feedback.idParams': IdParams,
    'feedback.error': ErrorResponse,
    'feedback.success': SuccessResponse,
  });

// 导出 TS 类型
export type FeedbackReason = Static<typeof FeedbackReason>;
export type CreateFeedbackRequest = Static<typeof CreateFeedbackRequest>;
export type FeedbackListQuery = Static<typeof FeedbackListQuery>;
export type UserFeedbackStats = Static<typeof UserFeedbackStats>;
export type FeedbackDetail = Static<typeof FeedbackDetail>;
export type FeedbackListResponse = Static<typeof FeedbackListResponse>;
export type ErrorResponse = Static<typeof ErrorResponse>;
