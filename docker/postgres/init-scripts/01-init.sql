-- 确保安装在默认的 public schema，方便 Drizzle 识别
CREATE EXTENSION IF NOT EXISTS postgis SCHEMA public;
CREATE EXTENSION IF NOT EXISTS vector SCHEMA public;

-- 验证安装（可选）
SELECT postgis_full_version();