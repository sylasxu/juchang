// 清理过期群聊 (每天凌晨)
import cron from 'node-cron';
// import { GroupService } from '@juchang/services'; // 假设你有这个 Service

// const groupService = new GroupService();

// export const setupCleanupSchedule = () => {
//   // 每天凌晨 3 点执行 '0 3 * * *'
//   cron.schedule('0 3 * * *', async () => {
//     console.log('[Schedule] 开始执行群聊清理...');
//     try {
//       await groupService.cleanupExpiredGroups();
//       console.log('[Schedule] 群聊清理完成');
//     } catch (err) {
//       console.error('[Schedule] 群聊清理失败:', err);
//     }
//   });
// };