/**
 * Database Utilities
 * 
 * 提供 SQL 查询的工具函数，避免常见的类型转换问题。
 */

import { sql } from 'drizzle-orm';

/**
 * 将 Date 对象转换为 PostgreSQL timestamptz 参数
 * 
 * 解决 Drizzle sql`` 模板直接传递 Date 对象时的格式问题。
 * Date.toString() 生成 "Fri Dec 26 2025 00:00:00 GMT+0800" 格式，
 * PostgreSQL 无法解析。此函数转换为 ISO 字符串并显式类型转换。
 * 
 * @example
 * ```typescript
 * // ❌ 错误：直接传递 Date 对象
 * sql`SELECT * FROM table WHERE created_at >= ${startDate}`
 * 
 * // ✅ 正确：使用 toTimestamp
 * sql`SELECT * FROM table WHERE created_at >= ${toTimestamp(startDate)}`
 * ```
 */
export function toTimestamp(date: Date) {
  return sql`${date.toISOString()}::timestamptz`;
}

/**
 * 将 Date 对象转换为 PostgreSQL date 参数（仅日期，无时间）
 * 
 * @example
 * ```typescript
 * sql`SELECT * FROM table WHERE DATE(created_at) = ${toDate(date)}`
 * ```
 */
export function toDateOnly(date: Date) {
  return sql`${date.toISOString().split('T')[0]}::date`;
}
