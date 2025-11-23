
import {
  createUserSchema,
  updateUserSchema,
} from '@juchang/db';


// 添加一些自定义验证逻辑（如果需要）
export const enhancedCreateUserSchema = createUserSchema.refine(
  (data: { phone: string }) => {
    // 自定义验证逻辑
    if (data.phone && !/^1[3-9]\d{9}$/.test(data.phone)) {
      return false;
    }
    return true;
  },
  {
    message: '手机号格式不正确',
    path: ['phone'],
  }
);

