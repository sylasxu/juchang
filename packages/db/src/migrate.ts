// /Users/sylas/Documents/GitHub/juchang/packages/db/src/migrate.ts
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, closeConnection } from './db';
import path from 'path';

async function runMigrations() {
  try {
    console.log('🚀 Starting migrations...');
    
    // 使用绝对路径，防止在不同目录下执行命令时找不到文件夹
    // 假设当前文件在 src 下，drizzle 文件夹在包根目录下
    const migrationsFolder = path.resolve(__dirname, '../drizzle');
    
    await migrate(db, { migrationsFolder });
    
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