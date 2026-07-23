"""把 content/ 下的 Markdown 内容导出为前端可用的静态 JSON。

GitHub Pages 等纯静态托管没有后端，前端改为读取 /content.json。
CI 中在 `npm run build` 前执行本脚本（需 python-frontmatter + markdown）。
本地预览也可用：backend/.venv/bin/python scripts/export_content.py
"""
from __future__ import annotations

import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "backend"))

from app import content  # noqa: E402


def main() -> None:
    out: dict[str, list[dict]] = {}
    for kind in ("articles", "levels", "cases"):
        items: list[dict] = []
        for meta in content.list_items(kind):
            full = content.get_item(kind, meta["id"])
            if full:
                items.append(full)
        items.sort(key=lambda x: x.get("order", 999))
        out[kind] = items

    public_dir = os.path.join(ROOT, "frontend", "public")
    os.makedirs(public_dir, exist_ok=True)
    dest = os.path.join(public_dir, "content.json")
    with open(dest, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)

    print("✓ 已生成", dest)
    for k, v in out.items():
        print(f"  {k}: {len(v)} 篇")


if __name__ == "__main__":
    main()
