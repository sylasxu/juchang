// Upload Controller - 文件上传控制器
import { Elysia, t } from 'elysia';
import { basePlugins, verifyAuth } from '../../setup';
import { uploadModel, type ErrorResponse } from './upload.model';
import { 
  generateUploadToken, 
  generateSceneId,
  getShareInfo 
} from './upload.service';

export const uploadController = new Elysia({ prefix: '/upload' })
  .use(basePlugins)
  .use(uploadModel)
  
  // 获取上传Token（推荐方案）
  .post(
    '/token',
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
        const fileType = (body as any)?.type || 'image';
        const token = await generateUploadToken(fileType);
        return token;
      } catch (error) {
        set.status = 500;
        return {
          code: 500,
          msg: '生成上传Token失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Upload'],
        summary: '获取上传Token',
        description: '获取OSS/COS直传签名，推荐使用此方式上传文件',
      },
      body: t.Object({
        type: t.Optional(t.Union([
          t.Literal('image'),
          t.Literal('video'),
        ], { default: 'image' })),
      }),
      response: {
        200: 'upload.tokenResponse',
        401: 'upload.error',
        500: 'upload.error',
      },
    }
  )

  // 直接上传文件（备用方案）
  .post(
    '/image',
    async ({ set, jwt, headers }) => {
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
        // TODO: 处理文件上传
        set.status = 501;
        return {
          code: 501,
          msg: '直接上传功能开发中，请使用Token上传方式',
        } satisfies ErrorResponse;
      } catch (error) {
        set.status = 500;
        return {
          code: 500,
          msg: '上传失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Upload'],
        summary: '直接上传图片',
        description: '直接上传图片到服务器（备用方案）',
      },
      response: {
        200: 'upload.uploadResponse',
        401: 'upload.error',
        500: 'upload.error',
        501: 'upload.error',
      },
    }
  )

  // 生成场景参数（用于微信小程序二维码）
  .post(
    '/scene',
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
        const shareInfo = body as any;
        const sceneId = await generateSceneId(shareInfo);
        
        return {
          sceneId,
          expireTime: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7天后过期
        };
      } catch (error) {
        set.status = 500;
        return {
          code: 500,
          msg: '生成场景参数失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Upload'],
        summary: '生成场景参数',
        description: '为微信小程序二维码生成场景参数ID',
      },
      body: t.Object({
        activityId: t.Optional(t.String()),
        inviterId: t.Optional(t.String()),
        source: t.String(),
        redirectTo: t.String(),
        metadata: t.Optional(t.Record(t.String(), t.Any())),
      }),
      response: {
        200: t.Object({
          sceneId: t.String(),
          expireTime: t.Number(),
        }),
        401: 'upload.error',
        500: 'upload.error',
      },
    }
  )

  // 解析场景参数
  .get(
    '/scene/:sceneId',
    async ({ params, set }) => {
      try {
        const shareInfo = await getShareInfo(params.sceneId);
        
        if (!shareInfo) {
          set.status = 404;
          return {
            code: 404,
            msg: '场景参数不存在或已过期',
          } satisfies ErrorResponse;
        }

        return shareInfo;
      } catch (error) {
        set.status = 500;
        return {
          code: 500,
          msg: '解析场景参数失败',
        } satisfies ErrorResponse;
      }
    },
    {
      detail: {
        tags: ['Upload'],
        summary: '解析场景参数',
        description: '根据场景ID获取分享信息，用于小程序扫码跳转',
      },
      params: 'upload.sceneIdParams',
      response: {
        200: 'upload.shareInfoResponse',
        404: 'upload.error',
        500: 'upload.error',
      },
    }
  );