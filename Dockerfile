# ---- 阶段 1：构建前端 ----
FROM node:20-slim AS frontend-build
WORKDIR /build
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ---- 阶段 2：运行镜像 ----
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/backend \
    SQLITE_PATH=/data/cube.db \
    HOST=0.0.0.0 \
    PORT=8000

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 后端依赖（先装依赖以利用缓存层）
COPY backend/requirements.txt /app/backend/requirements.txt
RUN python -m venv /opt/venv \
    && /opt/venv/bin/pip install --no-cache-dir -r /app/backend/requirements.txt

# 复制代码：保持 backend/ 与 content/ 的相对层级
# （content.py 按 backend/app -> ../../content 解析，dist 路径同理）
COPY backend/ /app/backend/
COPY content/ /app/content/
COPY --from=frontend-build /build/dist /app/frontend/dist

ENV PATH="/opt/venv/bin:$PATH"

EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host ${HOST} --port ${PORT}"]
