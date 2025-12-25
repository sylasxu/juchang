// User Service - 纯业务逻辑 (MVP 简化版)
import { db, users, eq } from '@juchang/db';
import type { UpdateProfileBody, QuotaResponse } from './user.model';

/**
 * 根据 ID 获取用户详情
 */
export async function getUserById(id: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return user || null;
}

/**
 * 更新用户资料 (MVP 简化版)
 * 只支持更新 nickname 和 avatarUrl
 */
export async function updateProfile(id: string, data: UpdateProfileBody) {
  const updateData: Record<string, any> = {
    updatedAt: new Date(),
  };

  if (data.nickname !== undefined) {
    updateData.nickname = data.nickname;
  }
  if (data.avatarUrl !== undefined) {
    updateData.avatarUrl = data.avatarUrl;
  }

  const [updated] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, id))
    .returning();

  return updated || null;
}

/**
 * 获取用户今日额度
 */
export async function getQuota(id: string): Promise<QuotaResponse | null> {
  const user = await getUserById(id);
  if (!user) return null;

  // 检查是否需要重置额度（跨天重置）
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  let aiCreateQuota = user.aiCreateQuotaToday;
  let resetAt = user.aiQuotaResetAt?.toISOString() || null;

  // 如果上次重置时间不是今天，重置额度
  if (!user.aiQuotaResetAt || user.aiQuotaResetAt < today) {
    aiCreateQuota = 3; // 默认每日 3 次
    resetAt = today.toISOString();
    
    // 更新数据库
    await db
      .update(users)
      .set({
        aiCreateQuotaToday: 3,
        aiQuotaResetAt: today,
        updatedAt: now,
      })
      .where(eq(users.id, id));
  }

  return {
    aiCreateQuota,
    resetAt,
  };
}

/**
 * 扣减 AI 创建额度
 * 返回 true 表示扣减成功，false 表示额度不足
 */
export async function deductAiCreateQuota(id: string): Promise<boolean> {
  const quota = await getQuota(id);
  if (!quota || quota.aiCreateQuota <= 0) {
    return false;
  }

  await db
    .update(users)
    .set({
      aiCreateQuotaToday: quota.aiCreateQuota - 1,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id));

  return true;
}
