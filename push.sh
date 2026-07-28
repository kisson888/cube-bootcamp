#!/usr/bin/env bash
# 魔方训练营 · 推送脚本（不依赖 gh 登录校验，避免 read:org 报错）
#
# 用法：
#   GH_TOKEN=ghp_xxx ./push.sh                 # 默认仓库名 cube-bootcamp
#   GH_TOKEN=ghp_xxx ./push.sh my-cube-camp    # 自定义仓库名（不含用户名）
#
# 说明：
#   - 通过 GitHub API 用 token 建库（仅需要 repo 权限，不需要 read:org）
#   - 推送时用一次性 `url.<token>@github.com/.insteadOf` 注入凭据，
#     token 不会写入 .git/config，命令结束即失效
#   - 首次部署后到仓库 Settings → Pages → Source 选 "GitHub Actions"
set -euo pipefail

REPO_NAME="${1:-cube-bootcamp}"
BRANCH="main"

if [ -z "${GH_TOKEN:-}" ]; then
  echo "❌ 缺少 GH_TOKEN。请这样运行："
  echo "   GH_TOKEN=ghp_xxx ./push.sh"
  echo "（token 需含 repo + workflow 权限；用完建议在 GitHub 吊销）"
  exit 1
fi

# 拿到当前登录用户名
OWNER="$(curl -s -H "Authorization: token ${GH_TOKEN}" https://api.github.com/user | python3 -c 'import json,sys;print(json.load(sys.stdin)["login"])')"
echo "==> 登录为 @${OWNER}"

# 确保在 main 分支
CUR="$(git rev-parse --abbrev-ref HEAD)"
if [ "$CUR" != "$BRANCH" ]; then
  echo "==> 分支 ${CUR} -> ${BRANCH}"
  git branch -m "$CUR" "$BRANCH"
fi

# 未提交改动先提交
if [ -n "$(git status --porcelain)" ]; then
  echo "==> 自动提交未保存改动"
  git add -A
  git commit -q -m "chore: 推送前自动提交" || true
fi

# 创建远程仓库（若不存在）
echo "==> 准备远程仓库 ${OWNER}/${REPO_NAME}"
if ! git ls-remote --exit-code "https://github.com/${OWNER}/${REPO_NAME}.git" >/dev/null 2>&1; then
  curl -s -o /dev/null -w "    建库 HTTP %{http_code}\n" \
    -H "Authorization: token ${GH_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"${REPO_NAME}\",\"private\":false}" \
    https://api.github.com/user/repos
fi

git remote add origin "https://github.com/${OWNER}/${REPO_NAME}.git" 2>/dev/null || git remote set-url origin "https://github.com/${OWNER}/${REPO_NAME}.git"

# 一次性注入 token 推送（不写盘）
echo "==> 推送 ${BRANCH}"
git -c "url.https://${OWNER}:${GH_TOKEN}@github.com/.insteadOf=https://github.com/" \
  push -u origin "$BRANCH"

echo ""
echo "✅ 推送完成！"
echo "   1) 打开 https://github.com/${OWNER}/${REPO_NAME}/settings/pages"
echo "   2) Build and deployment → Source 选 \"GitHub Actions\"（仅需一次）"
echo "   3) Actions 构建完成后站点地址：https://${OWNER}.github.io/${REPO_NAME}/"
