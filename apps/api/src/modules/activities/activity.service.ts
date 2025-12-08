// Activity Service - 纯业务逻辑，无 HTTP 依赖
import { db, activities, eq } from '@juchang/db';
import type { ActivityDetailResponse } from './activity.model';

/**
 * 根据 ID 获取活动详情（包含创建者和参与者信息）
 */
export async function getActivityById(id: string): Promise<ActivityDetailResponse | null> {
  const activity = await db.query.activities.findFirst({
    where: eq(activities.id, id),
    with: {
      creator: {
        columns: {
          id: true,
          nickname: true,
          avatarUrl: true,
          creditScore: true,
          gender: true,
          vibeTags: true,
        },
      },
      participants: {
        with: {
          user: {
            columns: {
              id: true,
              nickname: true,
              avatarUrl: true,
              creditScore: true,
            },
          },
        },
      },
    },
  });

  if (!activity) {
    return null;
  }

  // 转换 location geometry 为 [lng, lat] 数组
  const location: [number, number] | null = activity.location
    ? [activity.location.x, activity.location.y]
    : null;

  // 构建响应对象
  // 使用展开运算符包含所有 activity 字段，然后覆盖 location 并添加关联字段
  return {
    ...activity, // 包含所有 selectActivitySchema 的字段
    location, // 覆盖为 [lng, lat] 数组格式
    creator: activity.creator
      ? {
          id: activity.creator.id,
          nickname: activity.creator.nickname,
          avatarUrl: activity.creator.avatarUrl,
          creditScore: activity.creator.creditScore,
          gender: activity.creator.gender,
          vibeTags: activity.creator.vibeTags,
        }
      : null,
    participants: activity.participants.map((p) => ({
      ...p, // 包含所有 selectParticipantSchema 的字段
      user: p.user
        ? {
            id: p.user.id,
            nickname: p.user.nickname,
            avatarUrl: p.user.avatarUrl,
            creditScore: p.user.creditScore,
          }
        : null,
    })),
  };
}

