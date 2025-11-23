# 自定义PostgreSQL镜像

这个自定义镜像基于PostgreSQL 18，集成了PostGIS 3.4和pgvector扩展，专为聚场应用优化。

## 功能特性

- **PostgreSQL 18**: 最新稳定版本
- **PostGIS 3.4**: 地理空间数据库扩展
  - 支持几何、地理、栅格数据类型
  - 空间索引和查询优化
  - 拓扑和地理编码功能
- **pgvector 0.8.0**: 向量数据库扩展
  - 支持高维向量存储和相似度搜索
  - 多种距离函数（L2、内积、余弦相似度）
  - 向量索引支持

## 构建镜像

```bash
docker build -t juchang-postgres:18-postgis-pgvector .
```

## 使用镜像

### 基本使用

```bash
docker run -d \
  --name postgres \
  -e POSTGRES_DB=juchang \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=your_password \
  -p 5432:5432 \
  juchang-postgres:18-postgis-pgvector
```

### 使用Docker Compose

已经在项目根目录的`docker-compose.yml`中配置好，直接运行：

```bash
docker-compose up -d
```

## 验证安装

连接数据库后执行：

```sql
-- 检查PostGIS版本
SELECT postgis_full_version();

-- 检查pgvector版本
SELECT extversion FROM pg_extension WHERE extname = 'vector';

-- 检查所有已安装的扩展
SELECT * FROM pg_extension;
```

## 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| POSTGRES_DB | postgres | 数据库名称 |
| POSTGRES_USER | postgres | 超级用户 |
| POSTGRES_PASSWORD | - | 超级用户密码 |
| POSTGRES_APP_USER | app | 应用用户 |
| POSTGRES_APP_PASSWORD | app_password | 应用用户密码 |

## 性能优化

镜像已经预配置了PostgreSQL性能参数：

- `max_connections = 200`
- `shared_buffers = 256MB`
- `effective_cache_size = 1GB`
- `work_mem = 4MB`
- 启用了`pg_stat_statements`用于查询分析

## 数据持久化

确保挂载数据卷：

```yaml
volumes:
  - postgres_data:/var/lib/postgresql/data
```

## 备份和恢复

### 备份
```bash
docker exec -t juchang-postgres pg_dumpall -c -U postgres > backup.sql
```

### 恢复
```bash
docker exec -i juchang-postgres psql -U postgres < backup.sql
```
