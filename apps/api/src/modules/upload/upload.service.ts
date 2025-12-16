// Upload Service - 文件上传业务逻辑
import type { 
  UploadTokenResponse, 
  ShareInfoResponse 
} from './upload.model';

/**
 * 生成OSS/COS直传Token
 */
export async function generateUploadToken(fileType: 'image' | 'video' = 'image'): Promise<UploadTokenResponse> {
  // TODO: 集成腾讯云COS或阿里云OSS
  // 这里先返回模拟数据
  
  const timestamp = Date.now();
  const key = `uploads/${fileType}/${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    token: 'mock_upload_token_' + timestamp,
    uploadUrl: 'https://mock-cos.example.com/upload',
    expireTime: timestamp + 3600 * 1000, // 1小时后过期
    maxSize: fileType === 'image' ? 10 * 1024 * 1024 : 100 * 1024 * 1024, // 图片10MB，视频100MB
    allowedTypes: fileType === 'image' 
      ? ['jpg', 'jpeg', 'png', 'gif', 'webp']
      : ['mp4', 'mov', 'avi'],
    key,
  };
}

/**
 * 处理直接上传（备用方案）
 */
export async function handleDirectUpload(file: File): Promise<any> {
  // TODO: 实现直接上传到服务器的逻辑
  // MVP阶段可以先用这个方案
  throw new Error('直接上传功能开发中');
}

/**
 * 生成场景参数ID并存储到Redis
 */
export async function generateSceneId(shareInfo: Omit<ShareInfoResponse, 'source' | 'redirectTo'> & {
  source: string;
  redirectTo: string;
}): Promise<string> {
  // TODO: 集成Redis存储
  // 生成短ID
  const sceneId = Math.random().toString(36).substr(2, 8).toUpperCase();
  
  // TODO: 存储到Redis，设置过期时间（如7天）
  // await redis.setex(`scene:${sceneId}`, 7 * 24 * 3600, JSON.stringify(shareInfo));
  
  console.log(`Generated scene ID: ${sceneId}`, shareInfo);
  
  return sceneId;
}

/**
 * 根据场景ID获取分享信息
 */
export async function getShareInfo(sceneId: string): Promise<ShareInfoResponse | null> {
  // TODO: 从Redis获取数据
  // const data = await redis.get(`scene:${sceneId}`);
  // if (!data) return null;
  // return JSON.parse(data);
  
  // 模拟数据
  if (sceneId === 'TEST1234') {
    return {
      activityId: '123e4567-e89b-12d3-a456-426614174000',
      inviterId: '456e7890-e89b-12d3-a456-426614174000',
      source: 'qr_code',
      redirectTo: 'activity_detail',
      metadata: {
        timestamp: Date.now(),
      },
    };
  }
  
  return null;
}