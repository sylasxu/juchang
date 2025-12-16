// Upload Model - 文件上传相关模型
import { Elysia, t, type Static } from 'elysia';

// 上传Token响应
const UploadTokenResponse = t.Object({
  token: t.String({ description: 'OSS/COS上传凭证' }),
  uploadUrl: t.String({ description: '上传地址' }),
  expireTime: t.Number({ description: '过期时间戳' }),
  maxSize: t.Number({ description: '最大文件大小(字节)' }),
  allowedTypes: t.Array(t.String(), { description: '允许的文件类型' }),
  key: t.String({ description: '文件存储路径' }),
});

// 上传结果响应
const UploadResponse = t.Object({
  url: t.String({ description: '文件访问URL' }),
  key: t.String({ description: '文件存储路径' }),
  size: t.Number({ description: '文件大小' }),
  type: t.String({ description: '文件类型' }),
});

// 场景参数信息
const ShareInfoResponse = t.Object({
  activityId: t.Optional(t.String()),
  inviterId: t.Optional(t.String()),
  source: t.Union([
    t.Literal('qr_code'),
    t.Literal('share_card'),
    t.Literal('wechat_group'),
  ]),
  redirectTo: t.Union([
    t.Literal('activity_detail'),
    t.Literal('nearby_list'),
    t.Literal('user_profile'),
  ]),
  metadata: t.Optional(t.Record(t.String(), t.Any())),
});

// 场景ID参数
const SceneIdParams = t.Object({
  sceneId: t.String({ 
    minLength: 1, 
    maxLength: 32,
    description: '微信小程序场景参数ID' 
  }),
});

// 错误响应
const ErrorResponse = t.Object({
  code: t.Number(),
  msg: t.String(),
});

// 注册到 Elysia Model Plugin
export const uploadModel = new Elysia({ name: 'uploadModel' })
  .model({
    'upload.tokenResponse': UploadTokenResponse,
    'upload.uploadResponse': UploadResponse,
    'upload.shareInfoResponse': ShareInfoResponse,
    'upload.sceneIdParams': SceneIdParams,
    'upload.error': ErrorResponse,
  });

// 导出 Schema 对象
export {
  UploadTokenResponse,
  UploadResponse,
  ShareInfoResponse,
  SceneIdParams,
  ErrorResponse,
};

// 导出 TS 类型
export type UploadTokenResponse = Static<typeof UploadTokenResponse>;
export type UploadResponse = Static<typeof UploadResponse>;
export type ShareInfoResponse = Static<typeof ShareInfoResponse>;
export type SceneIdParams = Static<typeof SceneIdParams>;
export type ErrorResponse = Static<typeof ErrorResponse>;