# 1. 强制指定平台 linux/amd64 (解决 Mac M芯片 报错问题)
# 使用 PostGIS 官方 18-3.6 镜像
FROM --platform=linux/amd64 postgis/postgis:18-3.6

# 2. 替换国内源 (PG 18 基于 Debian Trixie/Sid)
# 这一步是为了解决 apt install 慢或 404
RUN echo "deb https://mirrors.ustc.edu.cn/debian/ trixie main contrib non-free non-free-firmware" > /etc/apt/sources.list \
    && echo "deb https://mirrors.ustc.edu.cn/debian/ trixie-updates main contrib non-free non-free-firmware" >> /etc/apt/sources.list \
    && echo "deb https://mirrors.ustc.edu.cn/debian-security/ trixie-security main contrib non-free non-free-firmware" >> /etc/apt/sources.list

# 3. 安装编译依赖
# 必须手动信任 PG 官方源的 Key
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    gnupg2 \
    git \
    make \
    gcc \
    build-essential \
    postgresql-server-dev-18 \
    && rm -rf /var/lib/apt/lists/*

# 4. 源码编译安装 pgvector (使用 v0.8.1)
# v0.8.1 应该已经修复了 PG18 的 vacuum_delay_point API 变更，不需要手动 patch 了
RUN cd /tmp \
    && git clone --branch v0.8.1 https://github.com/pgvector/pgvector.git \
    && cd pgvector \
    && make \
    && make install \
    && cd .. \
    && rm -rf pgvector

# 5. 清理垃圾，减小镜像体积
RUN apt-get purge -y --auto-remove \
    git \
    make \
    gcc \
    build-essential \
    curl \
    gnupg2