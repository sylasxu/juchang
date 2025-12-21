/**
 * 活动状态自动更新任务
 * 
 * PRD 7.3: 根据活动时间自动更新状态
 * 
 * 状态流转：
 * - published/full -> ongoing: 当 startAt <= now
 * - ongoing -> finished: 当 endAt <= now
 */

import { db, activities, eq, and, lt, lte, or } from '@juchang/db';

export async function updateActivityStatuses(): Promise<void> {
  const now = new Date();

  // 1. 更新已开始的活动为 ongoing
  const startedCount = await updateToOngoing(now);

  // 2. 更新已结束的活动为 finished
  const finishedCount = await updateToFinished(now);

  if (startedCount > 0 || finishedCount > 0) {
    console.log(`[ActivityStatus] 状态更新完成: ${startedCount} 个活动开始, ${finishedCount} 个活动结束`);
  }
}

async function updateToOngoing(now: Date): Promise<number> {
  // 查找应该变为 ongoing 的活动
  // 条件：(status = published OR status = full) AND startAt <= now
  const result = await db
    .update(activities)
    .set({
      status: 'ongoing',
      updatedAt: now,
    })
    .where(
      and(
        or(
          eq(activities.status, 'published'),
          eq(activities.status, 'full')
        ),
        lte(activities.startAt, now)
      )
    )
    .returning({ id: activities.id });

  return result.length;
}

async function updateToFinished(now: Date): Promise<number> {
  // 查找应该变为 finished 的活动
  // 条件：status = ongoing AND endAt <= now AND endAt IS NOT NULL
  const result = await db
    .update(activities)
    .set({
      status: 'finished',
      updatedAt: now,
    })
    .where(
      and(
        eq(activities.status, 'ongoing'),
        lt(activities.endAt, now)
      )
    )
    .returning({ id: activities.id });

  return result.length;
}
