/**
 * Widget Types and Builders - Widget 类型定义和构建函数
 * 
 * Widget 是 Tool 返回的结构化 UI 数据，前端根据 messageType 渲染不同组件
 * Schema 从 @juchang/db 派生
 */

import { t } from 'elysia';
import type { WidgetChunk } from './types';

/**
 * Widget 类型枚举（对应 conversationMessageTypeEnum）
 */
export const WidgetType = {
  TEXT: 'text',
  DRAFT: 'widget_draft',
  EXPLORE: 'widget_explore',
  DETAIL: 'widget_detail',
  SHARE: 'widget_share',
  ACTION: 'widget_action',
  ASK_PREFERENCE: 'widget_ask_preference',
  DASHBOARD: 'widget_dashboard',
  LAUNCHER: 'widget_launcher',
  ERROR: 'widget_error',
} as const;

export type WidgetTypeValue = typeof WidgetType[keyof typeof WidgetType];

// ==========================================
// Widget Payload Schemas（从 @juchang/db 派生）
// ==========================================

/**
 * 草稿 Widget Payload
 */
export const WidgetDraftPayloadSchema = t.Object({
  activityId: t.String(),
  draft: t.Object({
    title: t.String(),
    type: t.String(),
    locationName: t.String(),
    locationHint: t.String(),
    location: t.Tuple([t.Number(), t.Number()]),
    startAt: t.String(),
    maxParticipants: t.Number(),
    summary: t.Optional(t.String()),
  }),
  message: t.String(),
});

export type WidgetDraftPayload = typeof WidgetDraftPayloadSchema.static;

/**
 * 探索 Widget Payload
 */
export const WidgetExplorePayloadSchema = t.Object({
  activities: t.Array(t.Object({
    id: t.String(),
    title: t.String(),
    type: t.String(),
    locationName: t.String(),
    distance: t.Number(),
    startAt: t.String(),
    currentParticipants: t.Number(),
    maxParticipants: t.Number(),
  })),
  center: t.Object({
    lat: t.Number(),
    lng: t.Number(),
    name: t.Optional(t.String()),
  }),
  radius: t.Number(),
  total: t.Number(),
});

export type WidgetExplorePayload = typeof WidgetExplorePayloadSchema.static;

/**
 * 询问偏好 Widget Payload
 */
export const WidgetAskPreferencePayloadSchema = t.Object({
  questionType: t.Union([
    t.Literal('location'),
    t.Literal('time'),
    t.Literal('action'),
    t.Literal('type'),
  ]),
  question: t.String(),
  options: t.Array(t.Object({
    label: t.String(),
    value: t.String(),
  })),
});

export type WidgetAskPreferencePayload = typeof WidgetAskPreferencePayloadSchema.static;

/**
 * 分享 Widget Payload
 */
export const WidgetSharePayloadSchema = t.Object({
  activityId: t.String(),
  title: t.String(),
  message: t.String(),
});

export type WidgetSharePayload = typeof WidgetSharePayloadSchema.static;

/**
 * 错误 Widget Payload
 */
export const WidgetErrorPayloadSchema = t.Object({
  code: t.String(),
  message: t.String(),
  suggestion: t.Optional(t.String()),
});

export type WidgetErrorPayload = typeof WidgetErrorPayloadSchema.static;

// ==========================================
// Widget 构建函数
// ==========================================

/**
 * 构建草稿 Widget
 */
export function buildDraftWidget(
  activityId: string,
  draft: WidgetDraftPayload['draft'],
  message: string
): WidgetChunk {
  return {
    messageType: WidgetType.DRAFT,
    payload: { activityId, draft, message },
  };
}

/**
 * 构建探索 Widget
 */
export function buildExploreWidget(
  activities: WidgetExplorePayload['activities'],
  center: WidgetExplorePayload['center'],
  radius: number,
  total: number
): WidgetChunk {
  return {
    messageType: WidgetType.EXPLORE,
    payload: { activities, center, radius, total },
  };
}

/**
 * 构建询问偏好 Widget
 */
export function buildAskPreferenceWidget(
  questionType: WidgetAskPreferencePayload['questionType'],
  question: string,
  options: WidgetAskPreferencePayload['options']
): WidgetChunk {
  return {
    messageType: WidgetType.ASK_PREFERENCE,
    payload: { questionType, question, options },
  };
}

/**
 * 构建分享 Widget
 */
export function buildShareWidget(
  activityId: string,
  title: string,
  message: string
): WidgetChunk {
  return {
    messageType: WidgetType.SHARE,
    payload: { activityId, title, message },
  };
}

/**
 * 构建错误 Widget
 */
export function buildErrorWidget(
  code: string,
  message: string,
  suggestion?: string
): WidgetChunk {
  return {
    messageType: WidgetType.ERROR,
    payload: { code, message, suggestion },
  };
}
