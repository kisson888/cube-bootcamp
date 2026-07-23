#!/usr/bin/env bash
# 魔方训练营一键启动：构建前端并由 FastAPI 统一托管。
set -e

echo "==> 安装前端依赖并构建…"
npm install --prefix frontend
npm run build --prefix frontend

echo "==> 启动后端（http://localhost:8000）…"
export PYTHONPATH="$(cd backend && pwd)"
exec backend/.venv/bin/uvicorn app.main:app --port 8000 --host 0.0.0.0
