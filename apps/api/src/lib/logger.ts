/**
 * 聚场 API 日志系统
 * 
 * 使用 pino + pino-pretty + chalk 实现美观的日志输出
 * - 全中文输出，结构化格式 [模块]描述
 * - 彩色 HTTP 方法显示
 * - 请求响应时间统计
 */

import { Elysia } from 'elysia';
import pino from 'pino';
import chalk from 'chalk';

// ============ 类型定义 ============

interface RouteInfo {
  method: string;
  path: string;
}

interface ElysiaAppWithRoutes {
  routes?: RouteInfo[];
}

// ============ 配置 ============

export const isDev = process.env.NODE_ENV !== 'production';

// ============ Pino Logger 配置 ============

const logger = pino({
  level: 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: true,
    },
  },
});

// ============ 颜色配置 ============

const methodColors: Record<string, (s: string) => string> = {
  GET: chalk.green,
  POST: chalk.yellow,
  PUT: chalk.blue,
  PATCH: chalk.cyan,
  DELETE: chalk.red,
  OPTIONS: chalk.gray,
  HEAD: chalk.gray,
};

// ============ Logger Plugin ============

export const loggerPlugin = new Elysia({ name: 'logger' })
  .decorate('log', logger)
  .derive(() => ({
    startTime: Date.now()
  }))
  .onRequest(({ request, log }) => {
    const { method, url } = request;
    const pathname = new URL(url).pathname;
    
    // 跳过健康检查和静态资源的入站日志
    if (pathname === '/health' || pathname === '/favicon.ico' || pathname.startsWith('/openapi')) {
      return;
    }
    
    // 彩色方法名
    const methodColored = chalk.bold(
      method === 'GET' ? chalk.green(method) :
      method === 'POST' ? chalk.yellow(method) :
      method === 'PUT' ? chalk.blue(method) :
      method === 'PATCH' ? chalk.cyan(method) :
      method === 'DELETE' ? chalk.red(method) :
      chalk.magenta(method)
    );
    
    log.info(`${chalk.cyan('[请求]')} ← ${methodColored} ${pathname}`);
  })
  .onAfterResponse(({ request, set, startTime, log, response }) => {
    const { method, url } = request;
    const pathname = new URL(url).pathname;
    const elapsed = Date.now() - (startTime || 0);
    const status = set.status ?? 200;
    
    // 跳过健康检查和静态资源
    if (pathname === '/health' || pathname === '/favicon.ico' || pathname.startsWith('/openapi')) {
      return;
    }
    
    // 状态颜色
    const statusColor = status >= 500 ? chalk.red :
                       status >= 400 ? chalk.yellow :
                       status >= 300 ? chalk.cyan :
                       chalk.green;
    
    // 方法颜色
    const methodColored = chalk.bold(
      method === 'GET' ? chalk.green(method) :
      method === 'POST' ? chalk.yellow(method) :
      method === 'PUT' ? chalk.blue(method) :
      method === 'PATCH' ? chalk.cyan(method) :
      method === 'DELETE' ? chalk.red(method) :
      chalk.magenta(method)
    );
    
    const statusIcon = status >= 400 ? '×' : '√';
    
    // 记录响应信息
    log.info({
      status,
      headers: set.headers,
      elapsed: `${elapsed}ms`
    }, `${chalk.cyan('[请求]')} ${statusIcon} ${methodColored} ${pathname.padEnd(35)} ${statusColor(String(status))} ${chalk.gray(`${elapsed}ms`)}`);
  })
  .onError(({ request, error, set, startTime, log }) => {
    const { method, url } = request;
    const pathname = new URL(url).pathname;
    const elapsed = Date.now() - (startTime || 0);
    const status = typeof set.status === 'number' ? set.status : 500;
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    // 跳过健康检查和静态资源
    if (pathname === '/health' || pathname === '/favicon.ico' || pathname.startsWith('/openapi')) {
      return;
    }
    
    const methodColored = chalk.bold(chalk.red(method));
    
    log.error(`${chalk.cyan('[请求]')} × ${methodColored} ${pathname.padEnd(35)} ${chalk.red(String(status))} ${chalk.gray(`${elapsed}ms`)} ${chalk.red(`• ${errorMsg}`)}`);
  });

// ============ 启动 Banner ============

export function printBanner(appName: string, version: string): void {
  if (!isDev) return;

  const banner = `
${chalk.cyan('┌─────────────────────────────────────────────────────────────┐')}
${chalk.cyan('│')}                    ${chalk.bold.magenta(`🚀 ${appName}`)} ${chalk.gray(`v${version}`)}                     ${chalk.cyan('│')}
${chalk.cyan('│')}                    ${chalk.gray('Powered by Elysia + Bun')}                   ${chalk.cyan('│')}
${chalk.cyan('└─────────────────────────────────────────────────────────────┘')}
`;
  console.log(banner);
}
// ============ 路由打印 ============

export function printRoutes(app: ElysiaAppWithRoutes): void {
  if (!isDev) return;

  const routes = app.routes;
  if (!routes || routes.length === 0) {
    console.log(chalk.yellow('[路由] 未发现任何路由'));
    return;
  }

  // 按模块分组（根据路径第一段）
  const grouped = new Map<string, RouteInfo[]>();
  
  for (const route of routes) {
    // 跳过 OpenAPI 相关路由和 OPTIONS（CORS 预检）
    if (route.path.startsWith('/openapi')) continue;
    if (route.method === 'OPTIONS') continue;
    
    const segments = route.path.split('/').filter(Boolean);
    const module = segments[0] || 'ROOT';
    
    // 模块名映射为中文
    const moduleNameMap: Record<string, string> = {
      'ROOT': '根路径',
      'auth': '认证模块',
      'users': '用户模块', 
      'activities': '活动模块',
      'ai': 'AI模块',
      'participants': '参与者模块',
      'chat': '聊天模块',
      'dashboard': '仪表板',
      'notifications': '通知模块',
      'health': '健康检查',
      'jobs': '任务状态'
    };
    
    const moduleName = moduleNameMap[module] || module.toUpperCase();
    
    if (!grouped.has(moduleName)) {
      grouped.set(moduleName, []);
    }
    grouped.get(moduleName)!.push(route);
  }
  // 定义模块显示顺序
  const moduleOrder = ['根路径', '认证模块', '用户模块', '活动模块', 'AI模块', '参与者模块', '聊天模块', '仪表板', '通知模块', '健康检查', '任务状态'];
  const sortedModules = [...grouped.keys()].sort((a, b) => {
    const aIndex = moduleOrder.indexOf(a);
    const bIndex = moduleOrder.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  console.log(chalk.blue('[路由] 注册路由列表:'));
  
  // 打印每个模块的路由
  for (const module of sortedModules) {
    const moduleRoutes = grouped.get(module);
    if (!moduleRoutes) continue;
    
    // 跳过只有通配符路由的模块
    if (moduleRoutes.every(r => r.path.endsWith('/*'))) continue;
    
    console.log(`  ${chalk.cyan(`[${module}]`)}`);
    
    // 按路径排序，过滤通配符路由
    const filteredRoutes = moduleRoutes
      .filter(r => !r.path.endsWith('/*'))
      .sort((a, b) => a.path.localeCompare(b.path));
    
    for (const { method, path } of filteredRoutes) {
      const colorFn = methodColors[method] || chalk.white;
      console.log(`    ${colorFn(method.padEnd(7))} ${chalk.white(path)}`);
    }
  }
  console.log();
}
// ============ 启动信息 ============

export function printStartupInfo(port: number, openapiPath?: string): void {
  if (!isDev) {
    return;
  }

  console.log(`${chalk.green('[服务器]')} 运行在 ${chalk.cyan.underline(`http://localhost:${port}`)}`);
  if (openapiPath) {
    console.log(`${chalk.blue('[文档]')} OpenAPI 文档: ${chalk.cyan.underline(`http://localhost:${port}${openapiPath}`)}`);
  }
  console.log(chalk.gray('─'.repeat(61)));
  console.log();
}

// ============ 定时任务专用日志函数 ============

export const jobLogger = {
  // 调度器启动/停止
  schedulerStart: (jobCount: number) => {
    if (isDev) {
      console.log(`${chalk.cyan('[调度器]')} 启动定时任务调度器 ${chalk.gray(`(${jobCount} 个任务)`)}`);
    }
  },

  schedulerStop: () => {
    if (isDev) {
      console.log(`${chalk.cyan('[调度器]')} 停止定时任务调度器`);
    }
  },

  // 任务注册
  jobRegistered: (name: string, intervalSeconds: number) => {
    if (isDev) {
      console.log(`${chalk.cyan('[调度器]')} 注册任务: ${chalk.white(name)} ${chalk.gray(`(每${intervalSeconds}秒执行)`)}`);
    }
  },
  // 任务执行
  jobStart: (name: string) => {
    if (isDev) {
      console.log(`${chalk.cyan('[任务]')} 开始执行: ${chalk.white(name)}`);
    }
  },

  jobSuccess: (name: string, duration: number) => {
    if (isDev) {
      console.log(`${chalk.cyan('[任务]')} 执行完成: ${chalk.white(name)} ${chalk.gray(`(${duration}ms)`)}`);
    }
  },

  jobError: (name: string, duration: number, error: any) => {
    if (isDev) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.log(`${chalk.red('[任务]')} 执行失败: ${chalk.white(name)} ${chalk.gray(`(${duration}ms)`)} ${chalk.red(`• ${errorMsg}`)}`);
    }
  },

  jobSkipped: (name: string) => {
    if (isDev) {
      console.log(`${chalk.gray('[任务]')} 跳过执行: ${chalk.white(name)} ${chalk.gray('(正在执行中)')}`);
    }
  },

  // 任务执行结果统计
  jobStats: (name: string, processed: number, affected: number = 0) => {
    if (isDev) {
      if (affected > 0) {
        console.log(`${chalk.cyan('[任务]')} ${chalk.white(name)}: 处理 ${chalk.yellow(processed)} 条记录，影响 ${chalk.green(affected)} 条`);
      } else if (processed > 0) {
        console.log(`${chalk.cyan('[任务]')} ${chalk.white(name)}: 处理 ${chalk.yellow(processed)} 条记录`);
      } else {
        console.log(`${chalk.cyan('[任务]')} ${chalk.white(name)}: ${chalk.gray('无需处理的记录')}`);
      }
    }
  }
};

// ============ 导出便捷函数 ============

export function createLogger(context: string) {
  return logger.child({ context });
}