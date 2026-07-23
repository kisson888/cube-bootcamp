# 部署指南 · 魔方训练营

## 架构

- **单镜像（推荐）**：多阶段 `Dockerfile`，先用 Node 构建前端，再把后端与 `dist` 打进同一个 Python 镜像；由 FastAPI **同域托管**前端与 `/api`，对外只有一个服务端口（8000）。
- **生产对外**：用 `docker-compose` 在前面加一层 **nginx** 做 TLS 终止 + 反向代理，证书用 Let's Encrypt（`certbot`）。

> 为什么同域托管：后端直接 serve `dist` 与 `/assets`，运行期无需跨域/代理，部署最简单。

---

## 1. 本地单容器（最快验证）

```bash
docker build -t cube-bootcamp .
docker run -d --name cube -p 8000:8000 -v cube_data:/data cube-bootcamp
# 打开 http://localhost:8000
```

- 数据持久化：挂卷 `cube_data` → 容器内 `/data`（`SQLITE_PATH=/data/cube.db`）。
- 停止/删除：`docker rm -f cube`；数据在卷中保留。

---

## 2. 生产部署（nginx + HTTPS）

前置条件：一台有公网 IP 的服务器、已解析到该服务器的域名（示例 `cube.example.com`）、防火墙开放 **80/443**。

```bash
# 1) 构建并启动后端
docker compose up -d app

# 2) 申请证书（certbot 官方镜像，webroot 模式）
mkdir -p certs certbot
docker run --rm \
  -v "$(pwd)/certs:/etc/letsencrypt" \
  -v "$(pwd)/certbot:/var/www/certbot" \
  certbot/certbot certonly --webroot -w /var/www/certbot \
  -d cube.example.com --email admin@example.com --agree-tos --non-interactive

# 3) 把证书放到 nginx 读取的位置
cp certs/live/cube.example.com/fullchain.pem certs/fullchain.pem
cp certs/live/cube.example.com/privkey.pem  certs/privkey.pem

# 4) 启动 nginx（读取 ./certs 与 ./nginx/nginx.conf）
docker compose up -d nginx
```

访问 `https://cube.example.com`，HTTP 会 **301 重定向**到 HTTPS。

**证书续期**（Let's Encrypt 有效期 90 天，建议写进 cron）：

```bash
docker run --rm -v "$(pwd)/certs:/etc/letsencrypt" -v "$(pwd)/certbot:/var/www/certbot" \
  certbot/certbot renew
cp certs/live/cube.example.com/fullchain.pem certs/fullchain.pem
cp certs/live/cube.example.com/privkey.pem  certs/privkey.pem
docker compose restart nginx
```

---

## 3. 环境变量

| 变量 | 默认 | 说明 |
|------|------|------|
| `CORS_ORIGINS` | `*` | 允许跨域来源，逗号分隔；**生产设为 `https://你的域名`** |
| `SQLITE_PATH` | `/data/cube.db` | SQLite 路径，需配合挂卷持久化 |
| `HOST` | `0.0.0.0` | 监听地址 |
| `PORT` | `8000` | 监听端口 |

在 `docker-compose.yml` 的 `app` 服务里已设置；也可在 `docker run -e` 覆盖。

---

## 4. 数据持久化

- 反馈留言存 SQLite（`cube.db`）。容器用卷 `cube_data:/data` 持久化，重建/升级容器数据不丢。
- 内容来自 `content/*.md`，**构建期已打入镜像**；更新文章/案例需重新 `docker build` 并重启。

---

## 5. 排错

| 现象 | 排查 |
|------|------|
| 首页打不开 | `docker compose logs app`；直接访问 `http://服务器IP:8000` 是否 200 |
| HTTPS 证书报错 | 确认 `certs/fullchain.pem`、`privkey.pem` 存在且路径正确；`docker compose logs nginx` |
| 证书申请失败 | 确认 80 端口可达、域名已解析、`certbot` 两处目录挂载正确 |
| 静态资源 404 | 确认前端已构建（`dist` 存在），镜像构建日志无 `npm` 报错 |
| 改了内容不生效 | 内容在镜像内，需重新 `docker build` 并 `docker compose up -d --build` |

---

## 6. 不使用 Docker 的裸机部署（备选）

见 `README.md`「运行方式」：构建前端后 `uvicorn app.main:app` 直接运行；若需 HTTPS，在前面加 nginx 反代（配置同 `nginx/nginx.conf`）。

---

## 7. 一键脚本（非 Docker 快速起）

```bash
bash run.sh          # 构建前端并启动后端（http://localhost:8000）
```
