CREATE SCHEMA IF NOT EXISTS users;
CREATE SCHEMA IF NOT EXISTS auth;

-- 启用PostGIS扩展
CREATE EXTENSION IF NOT EXISTS postgis;

-- 启用pgvector扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 验证扩展安装
SELECT postgis_full_version();
SELECT extversion FROM pg_extension WHERE extname = 'vector';
