import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema'; // 👈 核心修改：导入所有 schema

const connectionString = process.env.DATABASE_URL!;

// 创建客户端
const client = postgres(connectionString, {
  prepare: false,
  max: 20, 
  idle_timeout: 20,
  connect_timeout: 10,
});

// 👈 核心修改：把 schema 传进去
export const db = drizzle(client, { schema });

export type Database = typeof db;

export async function closeConnection() {
  await client.end();
}