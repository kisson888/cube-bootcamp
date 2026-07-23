# 部署到 GitHub Pages

本仓库已初始化并提交，**只差把代码推到 GitHub 即可自动部署**。当前环境未登录 `gh`、无 `GH_TOKEN`，因此「push」这一步需要你提供凭证（见下方步骤 3）。

---

## 架构说明

- 前端为纯静态站点（React + Vite）。教程、社区、案例、训练**全部数据已预生成为 `frontend/public/content.json`**，运行时直接读取，**无需后端**即可完整运行。
- 路由改用 `HashRouter`，资源路径由 `vite.config.ts` 的 `base` 控制（CI 自动设为 `/<仓库名>/`），因此可托管在 GitHub Pages 子路径下，深链刷新不会 404。
- `.github/workflows/deploy.yml` 在每次推到 `main` 时：导出内容 JSON → `npm ci` → `npm run build`（开启 `VITE_STATIC=true`）→ 部署到 GitHub Pages。
- 后端（FastAPI）仍可用于「同域托管」生产部署（Docker），见 [DEPLOY.md](./DEPLOY.md)；GitHub Pages 方案不依赖它。

> 说明：站点不含后端功能（反馈留言接口），但前端并无调用该接口的 UI，因此静态版功能完整。

---

## 你来做：3 步推上 GitHub

### 1) 登录 GitHub CLI（或准备 Token）

```bash
# 方式 A：交互式登录（浏览器授权）
gh auth login

# 方式 B：用 Personal Access Token（需 repo + workflow 权限）
export GH_TOKEN=ghp_xxx   # 仅当前终端有效
gh auth login --with-token <<< "$GH_TOKEN"
```

### 2) 创建远程仓库

```bash
# 用你的 GitHub 用户名替换 <you>；仓库名随意，建议 cube-bootcamp
gh repo create <you>/cube-bootcamp --public --source=. --remote=origin --push
# 上面 --push 会直接推送当前分支；若已手动 add remote，可改为：
# git remote add origin https://github.com/<you>/cube-bootcamp.git
# git push -u origin main
```

> 也可用网页在 github.com 新建空仓库，然后只执行：
> `git remote add origin https://github.com/<you>/cube-bootcamp.git && git push -u origin main`

### 3) 开启 Pages（一次即可）

1. 仓库 → **Settings → Pages → Build and deployment → Source 选 "GitHub Actions"**。
2. 推送 `main` 后，Actions 会自动构建；完成后 Pages 地址为：
   `https://<you>.github.io/cube-bootcamp/`
3. 首次部署约 1–2 分钟；之后每次推 `main` 自动更新。

---

## 本地预览（静态版，无需后端）

```bash
# 重新生成内容 JSON（改了 content/ 后）
backend/.venv/bin/python scripts/export_content.py

# 以静态模式构建并在本地预览
cd frontend
VITE_STATIC=true VITE_BASE=/cube-bootcamp/ npm run build
npm run preview          # 默认 http://localhost:4173
```

## 校验脚本（开发用）

```bash
npx --yes tsx scripts/verify_tutorial.mts   # 阶段数据：start+solution=已还原
npx --yes tsx scripts/verify_practice.mts   # 练习纠错状态机模拟
```
