# 基于官方PostgreSQL 18镜像
FROM postgres:18

# 安装PostGIS和pgvector所需的依赖
RUN apt-get update && apt-get install -y \
    postgresql-18-postgis-3 \
    postgresql-18-postgis-3-scripts \
    postgresql-18-pgvector \
    postgis \
    gdal-bin \
    proj-bin \
    && rm -rf /var/lib/apt/lists/*

# 复制初始化脚本
COPY ./init-scripts/ /docker-entrypoint-initdb.d/

# 设置PostgreSQL配置
ENV POSTGIS_VERSION 3.4
ENV PGVECTOR_VERSION 0.8.0

# 暴露PostgreSQL默认端口
EXPOSE 5432

# 设置数据目录
VOLUME ["/var/lib/postgresql/data"]

# 健康检查
HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD pg_isready -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-postgres} || exit 1
