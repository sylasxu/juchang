// Database client and schema exports
export { db, closeConnection } from './db';
export * from './schema';

// Re-export commonly used Drizzle ORM operators
// This allows API layer to use them without directly depending on drizzle-orm
export { eq, and, or, not, gt, gte, lt, lte, like, ilike, inArray, isNull, isNotNull, sql, count, desc, asc } from 'drizzle-orm';