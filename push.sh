#!/usr/bin/env bash
# 魔方训练营 · 一键推送并准备 GitHub Pages 部署
# 前置：先在终端执行 `gh auth login`（或 `export GH_TOKEN=ghp_xxx` 后 `gh auth login --with-token <<< "$GH_TOKEN"`）
# 用法：
#   ./push.sh                 # 默认仓库名 cube-bootcamp
#   ./push.sh my-cube-camp    # 自定义仓库名（不含用户名，会自动取当前 gh 账号）
set -euo pipefail

REPO_NAME="${1:-cube-bootcamp}"
BRANCH="main"

echo "==> 检查 gh 登录状态"
if ! gh auth status >/dev/null 2>&1; then
  echo "❌ 尚未登录 GitHub CLI。请先执行："
  echo "   gh auth login"
  echo "（或：export GH_TOKEN=ghp_xxx && gh auth login --with-token <<< \"\$GH_TOKEN\"）"
  exit 1
fi

OWNER="$(gh api user --jq .login)"
echo "    已登录为 @${OWNER}"

# 确保当前在 main 分支
CUR="$(git rev-parse --abbrev-ref HEAD)"
if [ "$CUR" != "$BRANCH" ]; then
  echo "==> 切换分支 ${CUR} -> ${BRANCH}"
  git branch -m "$CUR" "$BRANCH"
fi

# 若有未提交改动先提交（避免漏推）
if [ -n "$(git status --porcelain)" ]; then
  echo "==> 检测到未提交改动，自动提交"
  git add -A
  git commit -m "chore: 推送前自动提交未保存改动" || true
fi

echo "==> 配置远程仓库"
if git remote get-url origin >/dev/null 2>&1; then
  echo "    已存在 origin，直接推送"
  git push -u origin "$BRANCH"
else
  echo "    创建远程仓库 ${OWNER}/${REPO_NAME} 并推送"
  gh repo create "${OWNER}/${REPO_NAME}" --public --source=. --remote=origin --push
fi

echo ""
echo "✅ 推送完成！"
echo "   1) 打开 https://github.com/${OWNER}/${REPO_NAME}/settings/pages"
echo "   2) Build and deployment → Source 选 \"GitHub Actions\""
echo "   3) 等待 Actions 构建完成（约 1-2 分钟）"
echo "   站点地址：https://${OWNER}.github.io/${REPO_NAME}/"
