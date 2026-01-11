/**
 * 异常检测定时任务
 * 
 * 定期扫描异常用户行为，记录到日志
 * 后续可扩展：发送通知给管理员
 */

import { detectAllAnomalies, getAnomalyStats } from '../modules/ai/anomaly/detector';
import { jobLogger } from '../lib/logger';

/**
 * 执行异常检测扫描
 */
export async function runAnomalyDetection(): Promise<void> {
  try {
    const anomalies = await detectAllAnomalies();
    const stats = await getAnomalyStats();
    
    if (anomalies.length > 0) {
      // 记录异常信息
      console.log(`[异常检测] 发现 ${anomalies.length} 个异常用户`);
      console.log(`[异常检测] 统计: 高风险=${stats.bySeverity.high}, 中风险=${stats.bySeverity.medium}, 低风险=${stats.bySeverity.low}`);
      
      // 记录高风险异常详情
      const highRisk = anomalies.filter(a => a.severity === 'high');
      if (highRisk.length > 0) {
        console.log(`[异常检测] 高风险用户:`);
        for (const a of highRisk) {
          console.log(`  - ${a.userNickname || a.userId}: ${a.anomalyType} (${a.count}次)`);
        }
      }
      
      // TODO: 后续可以发送通知给管理员
      // await sendAdminNotification({
      //   type: 'anomaly_detected',
      //   count: anomalies.length,
      //   highRiskCount: highRisk.length,
      // });
    } else {
      console.log('[异常检测] 未发现异常用户');
    }
  } catch (error) {
    console.error('[异常检测] 执行失败:', error);
    throw error;
  }
}
