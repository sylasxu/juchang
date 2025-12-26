/**
 * 申诉超时自动处理任务 (MVP 简化版)
 * 
 * MVP 简化：
 * - 移除复杂的申诉机制
 * - 移除靠谱度扣分逻辑
 * 
 * 此任务在 MVP 中暂时保留但不执行实际操作
 */

import { jobLogger } from '../lib/logger';

export async function processExpiredDisputes(): Promise<void> {
  // MVP 简化：申诉机制已移除
  jobLogger.jobStats('申诉超时自动处理', 0, 0);
}
