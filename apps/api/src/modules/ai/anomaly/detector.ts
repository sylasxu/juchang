/**
 * Anomaly Detector - 异常检测服务
 * 
 * 实时查询检测异常用户行为
 */

import { db, sql, toTimestamp } from '@juchang/db';

export type AnomalyType = 'bulk_create' | 'frequent_cancel';
export type Severity = 'low' | 'medium' | 'high';

export interface AnomalyUser {
  anomalyId: string;
  userId: string;
  userNickname: string | null;
  anomalyType: AnomalyType;
  severity: Severity;
  count: number;
  detectedAt: string;
}

/**
 * 异常检测阈值
 */
const THRESHOLDS = {
  bulk_create: { count: 10, hours: 24 },
  frequent_cancel: { count: 5, days: 7 },
};

/**
 * 根据数量判断严重程度
 */
function getSeverity(count: number, threshold: number): Severity {
  const ratio = count / threshold;
  if (ratio >= 3) return 'high';
  if (ratio >= 2) return 'medium';
  return 'low';
}

/**
 * 检测批量创建 - 24h 内创建超过 10 个活动
 */
export async function detectBulkCreate(): Promise<AnomalyUser[]> {
  const threshold = THRESHOLDS.bulk_create;
  const since = new Date(Date.now() - threshold.hours * 60 * 60 * 1000);

  const result = await db.execute(sql`
    SELECT 
      a.creator_id as user_id,
      u.nickname as user_nickname,
      COUNT(*) as count
    FROM activities a
    LEFT JOIN users u ON a.creator_id = u.id
    WHERE a.created_at >= ${toTimestamp(since)}
    GROUP BY a.creator_id, u.nickname
    HAVING COUNT(*) > ${threshold.count}
    ORDER BY count DESC
  `);

  return (result as unknown as any[]).map((row, index) => ({
    anomalyId: `bulk_create_${row.user_id}_${Date.now()}`,
    userId: row.user_id,
    userNickname: row.user_nickname,
    anomalyType: 'bulk_create' as AnomalyType,
    severity: getSeverity(Number(row.count), threshold.count),
    count: Number(row.count),
    detectedAt: new Date().toISOString(),
  }));
}

/**
 * 检测频繁取消 - 7d 内取消超过 5 次报名
 */
export async function detectFrequentCancel(): Promise<AnomalyUser[]> {
  const threshold = THRESHOLDS.frequent_cancel;
  const since = new Date(Date.now() - threshold.days * 24 * 60 * 60 * 1000);

  const result = await db.execute(sql`
    SELECT 
      p.user_id,
      u.nickname as user_nickname,
      COUNT(*) as count
    FROM participants p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.status = 'cancelled'
      AND p.updated_at >= ${toTimestamp(since)}
    GROUP BY p.user_id, u.nickname
    HAVING COUNT(*) > ${threshold.count}
    ORDER BY count DESC
  `);

  return (result as unknown as any[]).map((row, index) => ({
    anomalyId: `frequent_cancel_${row.user_id}_${Date.now()}`,
    userId: row.user_id,
    userNickname: row.user_nickname,
    anomalyType: 'frequent_cancel' as AnomalyType,
    severity: getSeverity(Number(row.count), threshold.count),
    count: Number(row.count),
    detectedAt: new Date().toISOString(),
  }));
}

/**
 * 检测所有异常
 */
export async function detectAllAnomalies(): Promise<AnomalyUser[]> {
  const [bulkCreate, frequentCancel] = await Promise.all([
    detectBulkCreate(),
    detectFrequentCancel(),
  ]);

  // 合并并按严重程度排序
  const all = [...bulkCreate, ...frequentCancel];
  const severityOrder: Record<Severity, number> = { high: 0, medium: 1, low: 2 };
  
  return all.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

/**
 * 获取异常统计
 */
export async function getAnomalyStats(): Promise<{
  total: number;
  byType: Record<AnomalyType, number>;
  bySeverity: Record<Severity, number>;
}> {
  const anomalies = await detectAllAnomalies();
  
  const byType: Record<AnomalyType, number> = {
    bulk_create: 0,
    frequent_cancel: 0,
  };
  
  const bySeverity: Record<Severity, number> = {
    high: 0,
    medium: 0,
    low: 0,
  };

  for (const a of anomalies) {
    byType[a.anomalyType]++;
    bySeverity[a.severity]++;
  }

  return {
    total: anomalies.length,
    byType,
    bySeverity,
  };
}
