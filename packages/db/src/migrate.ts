// /Users/sylas/Documents/GitHub/juchang/packages/db/src/migrate.ts
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, closeConnection } from './db';

async function runMigrations() {
  try {
    console.log('🚀 Starting migrations...');
    
    // Drizzle会处理：schema创建、表结构、索引、外键
    await migrate(db, { migrationsFolder: './drizzle' });
    
    console.log('✅ Migrations completed!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations();
}