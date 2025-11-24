# 使用最新的 Postgres 18
FROM postgres:18

# 设置环境变量，防止交互式提示
ENV DEBIAN_FRONTEND=noninteractive

# 1. 更新源并安装构建依赖 (为了防止二进制包不存在，我们准备好编译环境)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    git \
    build-essential \
    postgresql-server-dev-18 \
    # PostGIS 依赖
    libgdal-dev \
    libgeos-dev \
    libproj-dev \
    libxml2-dev \
    libprotobuf-c-dev \
    protobuf-c-compiler \
    # 尝试直接安装 PostGIS (通常 PostGIS 跟进很快)
    postgresql-18-postgis-3 \
    postgresql-18-postgis-3-scripts \
    && rm -rf /var/lib/apt/lists/*

# 2. 安装 pgvector (推荐源码安装以获得最佳性能和最新 PG18 支持)
# 如果 apt install postgresql-18-pgvector 可用，也可以替换这一步，但源码更稳
RUN cd /tmp \
    && git clone --branch v0.8.0 https://github.com/pgvector/pgvector.git \
    && cd pgvector \
    && make \
    && make install \
    && cd .. \
    && rm -rf pgvector

# 3. 清理构建依赖以减小镜像体积 (可选，生产环境建议执行)
# RUN apt-get purge -y --auto-remove build-essential postgresql-server-dev-18 git

# 复制初始化脚本
COPY ./init-scripts/ /docker-entrypoint-initdb.d/