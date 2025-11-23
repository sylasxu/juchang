import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, closeConnection } from './db';

async function runMigrations() {
  try {
    console.log('🚀 Starting database migrations...');
    
    await migrate(db, { migrationsFolder: './drizzle' });
    
    console.log('✅ Database migrations completed successfully!');
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    process.exit(1);
  } finally {
    await closeConnection();
    process.exit(0);
  }
}

// Run migrations if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations();
}
