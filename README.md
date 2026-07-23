# 魔方训练营 · Cube Bootcamp

面向**零基础到速拧进阶**玩家的一站式学习平台，包含三大核心模块：

1. **知识社区** — 从认识魔方、转动记号，到层先法、CFOP、比赛规则的系统教程（精选策划内容）。
2. **互动还原教程** — 按层先法（LBL）七步的分阶段教学：每步配 **3D 动画演示**（播放/暂停/快退/快进/调速）与**动手练习**（虚拟魔方手动转动 + 智能逐步纠错 + 成绩记录），进度自动存入档案。
3. **阶梯训练计划** — L0–L6 关卡式递进，每关有目标、任务与达标线；参与者的**进步档案**保存在浏览器本地（localStorage），免登录。
4. **经典案例库** — 从网络摘录的真实选手、赛事、解法与器材案例，分类并标注出处。

## 技术架构

- 前端：React 18 + Vite + TypeScript + TailwindCSS
- 后端：FastAPI + SQLite（反馈用）+ Markdown 内容引擎
- 内容：以 Markdown + frontmatter 存放在 `content/`，由后端解析并提供 JSON / HTML
- 进度：前端 `localStorage`（无账号体系，单设备）

## 目录结构

```
workspace/
├── backend/            # FastAPI 后端（app/、venv/、requirements.txt）
├── content/            # 内容种子：articles / levels / cases
├── frontend/           # React 前端（src/、dist/ 构建产物）
└── scripts/build_content.py  # 生成内容种子
```

## 运行方式

### 方式一：生产模式（构建后由后端统一托管，推荐）

```bash
# 1. 前端构建（已构建可跳过）
npm install --prefix frontend
npm run build --prefix frontend

# 2. 启动后端（自动托管 frontend/dist）
PYTHONPATH=backend backend/.venv/bin/uvicorn app.main:app --port 8000
# 打开 http://localhost:8000
```

也可使用一键脚本：

```bash
bash run.sh
```

### 方式二：开发模式（热更新）

```bash
# 终端 1：后端
PYTHONPATH=backend backend/.venv/bin/uvicorn app.main:app --port 8000 --reload

# 终端 2：前端（默认 5173，已配置 /api 代理到 8000）
npm run dev --prefix frontend
# 打开 http://localhost:5173
```

## 部署

有两种方式：

- **GitHub Pages（推荐，零服务器）** — 前端构建为纯静态站，内容预生成为 JSON，无需后端即可完整运行。详见 **[GITHUB_DEPLOY.md](./GITHUB_DEPLOY.md)**，推送 `main` 后 Actions 自动部署。
- **Docker 生产部署（含后端）** — 完整生产部署（Docker 单容器 + nginx + HTTPS）见 **[DEPLOY.md](./DEPLOY.md)**，包含逐步命令、证书申请/续期与排错。

要点（Docker 方式）：

- 镜像由多阶段 `Dockerfile` 构建，前端 `dist` 由 FastAPI 同域托管，对外仅一个端口（8000）。
- 生产用 `docker compose` 叠加 nginx 做 TLS 终止与反代；证书经 `certbot` 申请。
- 关键环境变量：`CORS_ORIGINS`（生产设为你的域名）、`SQLITE_PATH`（配合挂卷持久化）、`HOST`/`PORT`。

```bash
docker build -t cube-bootcamp .
docker run -d --name cube -p 8000:8000 -v cube_data:/data cube-bootcamp
```

## 内容维护

内容即文件，位于 `content/articles`、`content/levels`、`content/cases`，为 Markdown + YAML frontmatter。
修改后用 `python3 scripts/build_content.py` 可重新生成全部种子内容。

## 主要 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/articles` | 文章列表（支持 `category`/`tag`） |
| GET | `/api/articles/:id` | 文章详情（含 HTML） |
| GET | `/api/levels` | 训练关卡列表 |
| GET | `/api/levels/:id` | 关卡详情 |
| GET | `/api/cases` | 案例列表（支持 `category`/`q`） |
| GET | `/api/cases/:id` | 案例详情（含出处链接） |
| POST | `/api/feedback` | 反馈留言 |
| GET | `/api/meta` | 内容统计 |

## 后续升级方向

互动社区（注册/评论/发帖）、账号同步进度、内容管理后台、AI 陪练（打乱/计时/复盘）、多语言与 PWA 等。
