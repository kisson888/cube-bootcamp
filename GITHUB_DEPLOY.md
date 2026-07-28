# 部署到 GitHub Pages

本仓库已初始化、推送并**已成功部署到 GitHub Pages**。下面的步骤供「之后再次更新代码」时参考。

> 推送用 `git + token` 直推（见下方 `push.sh`），**不依赖 `gh` 登录**——
> 因为 `gh auth login --with-token` 会校验 `read:org` 权限而报错，而部署只需 `repo + workflow`。
> token 仅在单次命令内注入，**不会写入 `.git/config`**。

---

## 架构说明

- 前端为纯静态站点（React + Vite）。教程、社区、案例、训练**全部数据已预生成为 `frontend/public/content.json`**，运行时直接读取，**无需后端**即可完整运行。
- 路由改用 `HashRouter`，资源路径由 `vite.config.ts` 的 `base` 控制（CI 自动设为 `/<仓库名>/`），因此可托管在 GitHub Pages 子路径下，深链刷新不会 404。
- `.github/workflows/deploy.yml` 在每次推到 `main` 时：导出内容 JSON → `npm ci` → `npm run build`（开启 `VITE_STATIC=true`）→ 部署到 GitHub Pages。
- 后端（FastAPI）仍可用于「同域托管」生产部署（Docker），见 [DEPLOY.md](./DEPLOY.md)；GitHub Pages 方案不依赖它。

> 说明：站点不含后端功能（反馈留言接口），但前端并无调用该接口的 UI，因此静态版功能完整。

---

## 之后如何更新（推送代码）

推荐用仓库里的 `push.sh`，它走 `git + token` 直推，**不依赖 `gh` 登录**（规避 `read:org` 校验报错）：

```bash
# token 需含 repo + workflow 权限（不需要 read:org）
GH_TOKEN=ghp_xxx ./push.sh            # 默认仓库名 cube-bootcamp
GH_TOKEN=ghp_xxx ./push.sh my-name    # 自定义仓库名
```

脚本会：用 API 建库（若不存在）→ 自动提交未保存改动 → 一次性注入 token 推送 `main` → 触发 Actions 自动部署。
**token 只在命令内生效，不写入 `.git/config`。**

> 手动等价操作（仅供理解）：
> ```bash
> git remote add origin https://github.com/<you>/cube-bootcamp.git
> git -c "url.https://<you>:${GH_TOKEN}@github.com/.insteadOf=https://github.com/" push -u origin main
> ```

### 首次开启 Pages（仅需一次）



1. 仓库 → **Settings → Pages → Build and deployment → Source 选 "GitHub Actions"**。
   ⚠️ 别选 "Deploy from a branch"：本仓库用 `actions/deploy-pages` 部署，
   若 Source 是分支模式，`deploy` 步骤必失败（已踩过坑）。正确模式下
   Pages 配置的 `build_type` 应为 `workflow`。
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
