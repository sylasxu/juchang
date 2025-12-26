/**
 * 定时任务调度器
 * 基于 setInterval 实现简单的定时任务系统
 * 
 * 任务列表：
 * 1. 履约超时自动确认 - 活动结束后 48h 未确认自动标记全员履约
 * 2. 申诉超时自动处理 - 申诉提交后 72h 未处理自动扣分
 * 3. 活动状态自动更新 - 根据时间自动更新活动状态
 */

import { processExpiredFulfillments } from './fulfillment-timeout';
import { processExpiredDisputes } from './dispute-timeout';
import { updateActivityStatuses } from './activity-status';
import { jobLogger } from '../lib/logger';

interface ScheduledJob {
  name: string;
  interval: number; // 毫秒
  handler: () => Promise<void>;
  lastRun?: Date;
  isRunning: boolean;
}

const jobs: ScheduledJob[] = [
  {
    name: '履约超时自动确认',
    interval: 60 * 60 * 1000, // 每小时执行
    handler: processExpiredFulfillments,
    isRunning: false,
  },
  {
    name: '申诉超时自动处理',
    interval: 60 * 60 * 1000, // 每小时执行
    handler: processExpiredDisputes,
    isRunning: false,
  },
  {
    name: '活动状态自动更新',
    interval: 5 * 60 * 1000, // 每5分钟执行
    handler: updateActivityStatuses,
    isRunning: false,
  },
];

const timers: NodeJS.Timeout[] = [];

/**
 * 执行单个任务（带锁防止重复执行）
 */
async function runJob(job: ScheduledJob): Promise<void> {
  if (job.isRunning) {
    jobLogger.jobSkipped(job.name);
    return;
  }

  job.isRunning = true;
  const startTime = Date.now();

  try {
    jobLogger.jobStart(job.name);
    await job.handler();
    job.lastRun = new Date();
    const duration = Date.now() - startTime;
    jobLogger.jobSuccess(job.name, duration);
  } catch (error) {
    const duration = Date.now() - startTime;
    jobLogger.jobError(job.name, duration, error);
  } finally {
    job.isRunning = false;
  }
}

/**
 * 启动所有定时任务
 */
export function startScheduler(): void {
  jobLogger.schedulerStart(jobs.length);

  for (const job of jobs) {
    // 立即执行一次
    runJob(job);

    // 设置定时执行
    const timer = setInterval(() => runJob(job), job.interval);
    timers.push(timer);

    jobLogger.jobRegistered(job.name, job.interval / 1000);
  }
}

/**
 * 停止所有定时任务
 */
export function stopScheduler(): void {
  jobLogger.schedulerStop();

  for (const timer of timers) {
    clearInterval(timer);
  }

  timers.length = 0;
}

/**
 * 获取任务状态
 */
export function getJobStatuses(): Array<{
  name: string;
  interval: number;
  lastRun?: Date;
  isRunning: boolean;
}> {
  return jobs.map((job) => ({
    name: job.name,
    interval: job.interval,
    lastRun: job.lastRun,
    isRunning: job.isRunning,
  }));
}
