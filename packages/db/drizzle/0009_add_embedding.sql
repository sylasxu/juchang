-- v4.5: 添加 pgvector 扩展和 embedding 列
-- 用于活动语义搜索功能

-- 1. 启用 pgvector 扩展 (幂等)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. 添加 embedding 列 (1024 维，对应智谱 embedding-3)
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS embedding vector(1024);

-- 3. 创建 HNSW 索引 (用于高效向量相似度搜索)
-- HNSW (Hierarchical Navigable Small World) 是 pgvector 推荐的索引类型
-- vector_cosine_ops 用于余弦相似度计算
CREATE INDEX IF NOT EXISTS activities_embedding_idx 
ON activities 
USING hnsw (embedding vector_cosine_ops);
