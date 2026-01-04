/**
 * Time Expression Enricher
 * 
 * 解析用户消息中的相对时间表达（如"明晚"、"周末"），
 * 生成 XML 格式的时间提示注入到 System Prompt。
 */

import type { EnrichmentResult } from '../types';

/**
 * 格式化日期时间为中文友好格式
 * 例如：2026-01-05 周一 19:00
 */
function formatDateTime(date: Date): string {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const weekday = weekdays[date.getDay()];
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${weekday} ${hours}:${minutes}`;
}

/**
 * 添加天数
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * 设置小时（保留日期）
 */
function setHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(hours, 0, 0, 0);
  return result;
}

/**
 * 获取下一个周末（周六）
 */
function getNextWeekend(date: Date): Date {
  const result = new Date(date);
  const dayOfWeek = result.getDay();
  // 如果今天是周六或周日，返回下周六
  const daysUntilSaturday = dayOfWeek === 6 ? 7 : (6 - dayOfWeek);
  result.setDate(result.getDate() + daysUntilSaturday);
  result.setHours(14, 0, 0, 0); // 默认下午 2 点
  return result;
}

/**
 * 获取下一个指定星期几
 * @param date 当前日期
 * @param targetDay 目标星期几（0=周日, 1=周一, ..., 6=周六）
 */
function getNextWeekday(date: Date, targetDay: number): Date {
  const result = new Date(date);
  const currentDay = result.getDay();
  let daysUntilTarget = targetDay - currentDay;
  // 如果目标日期已过或是今天，则取下周
  if (daysUntilTarget <= 0) {
    daysUntilTarget += 7;
  }
  result.setDate(result.getDate() + daysUntilTarget);
  result.setHours(19, 0, 0, 0); // 默认晚上 7 点
  return result;
}

/**
 * 时间表达式映射
 * key: 中文时间表达
 * value: 解析函数，接收当前时间，返回解析后的时间
 */
export const TIME_EXPRESSIONS: Record<string, (now: Date) => Date> = {
  // 基础日期
  '今天': (now) => setHours(now, 19),
  '明天': (now) => setHours(addDays(now, 1), 19),
  '后天': (now) => setHours(addDays(now, 2), 19),
  '大后天': (now) => setHours(addDays(now, 3), 19),
  
  // 时段
  '今晚': (now) => setHours(now, 19),
  '明晚': (now) => setHours(addDays(now, 1), 19),
  '今天晚上': (now) => setHours(now, 19),
  '明天晚上': (now) => setHours(addDays(now, 1), 19),
  '今天中午': (now) => setHours(now, 12),
  '明天中午': (now) => setHours(addDays(now, 1), 12),
  
  // 周末
  '周末': (now) => getNextWeekend(now),
  '这周末': (now) => getNextWeekend(now),
  '下周末': (now) => getNextWeekend(addDays(now, 7)),
  
  // 星期几
  '周一': (now) => getNextWeekday(now, 1),
  '周二': (now) => getNextWeekday(now, 2),
  '周三': (now) => getNextWeekday(now, 3),
  '周四': (now) => getNextWeekday(now, 4),
  '周五': (now) => getNextWeekday(now, 5),
  '周六': (now) => getNextWeekday(now, 6),
  '周日': (now) => getNextWeekday(now, 0),
  '星期一': (now) => getNextWeekday(now, 1),
  '星期二': (now) => getNextWeekday(now, 2),
  '星期三': (now) => getNextWeekday(now, 3),
  '星期四': (now) => getNextWeekday(now, 4),
  '星期五': (now) => getNextWeekday(now, 5),
  '星期六': (now) => getNextWeekday(now, 6),
  '星期天': (now) => getNextWeekday(now, 0),
  '星期日': (now) => getNextWeekday(now, 0),
  
  // 下周
  '下周一': (now) => getNextWeekday(addDays(now, 7), 1),
  '下周二': (now) => getNextWeekday(addDays(now, 7), 2),
  '下周三': (now) => getNextWeekday(addDays(now, 7), 3),
  '下周四': (now) => getNextWeekday(addDays(now, 7), 4),
  '下周五': (now) => getNextWeekday(addDays(now, 7), 5),
  '下周六': (now) => getNextWeekday(addDays(now, 7), 6),
  '下周日': (now) => getNextWeekday(addDays(now, 7), 0),
};

/**
 * 解析消息中的时间表达式，生成 XML 时间提示
 * 
 * @param message 用户消息
 * @param currentTime 当前时间
 * @returns 增强结果
 */
export function enrichWithTimeContext(
  message: string,
  currentTime: Date
): EnrichmentResult {
  const matchedExpressions: Array<{ original: string; resolved: Date }> = [];
  
  // 按长度降序排序，优先匹配更长的表达式（如"下周一"优先于"周一"）
  const sortedExpressions = Object.entries(TIME_EXPRESSIONS)
    .sort((a, b) => b[0].length - a[0].length);
  
  for (const [expr, resolver] of sortedExpressions) {
    if (message.includes(expr)) {
      // 检查是否已经被更长的表达式匹配
      const alreadyMatched = matchedExpressions.some(m => 
        m.original.includes(expr) || expr.includes(m.original)
      );
      if (!alreadyMatched) {
        matchedExpressions.push({
          original: expr,
          resolved: resolver(currentTime),
        });
      }
    }
  }
  
  if (matchedExpressions.length === 0) {
    return {
      originalMessage: message,
      enrichedMessage: message,
      appliedEnrichments: [],
    };
  }
  
  // 生成 XML 格式的时间提示
  const timeHintsXml = matchedExpressions
    .map(({ original, resolved }) => 
      `  <time_resolved original="${original}" resolved="${formatDateTime(resolved)}" />`
    )
    .join('\n');
  
  const contextXml = `<enrichment_hints>
  <current_time>${formatDateTime(currentTime)}</current_time>
${timeHintsXml}
</enrichment_hints>`;
  
  return {
    originalMessage: message,
    enrichedMessage: message, // 时间表达式不修改原消息，只注入上下文
    appliedEnrichments: ['time_expression'],
    contextInjectionXml: contextXml,
  };
}
