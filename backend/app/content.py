"""Markdown 内容引擎：读取 content/ 下的文章、关卡、案例，并提供 JSON / HTML。"""
from __future__ import annotations

import frontmatter
from markdown import markdown
from pathlib import Path

CONTENT_ROOT = Path(__file__).resolve().parent.parent.parent / "content"

COLLECTIONS = {
    "articles": "articles",
    "levels": "levels",
    "cases": "cases",
}

MD_EXTENSIONS = ["extra", "tables", "fenced_code", "sane_lists", "toc", "nl2br"]

_cache: dict[str, list[dict]] = {}


def _load_collection(kind: str) -> list[dict]:
    folder = CONTENT_ROOT / COLLECTIONS[kind]
    items: list[dict] = []
    if not folder.exists():
        return items
    for path in sorted(folder.glob("*.md"), key=lambda p: p.stem):
        post = frontmatter.load(path)
        meta = dict(post.metadata)
        meta["id"] = path.stem
        meta["body"] = post.content
        meta.setdefault("title", path.stem)
        meta.setdefault("category", "")
        meta.setdefault("tags", [])
        if isinstance(meta.get("tags"), str):
            meta["tags"] = [t.strip() for t in meta["tags"].split(",") if t.strip()]
        items.append(meta)
    return items


def get_collection(kind: str, force: bool = False) -> list[dict]:
    if force or kind not in _cache:
        _cache[kind] = _load_collection(kind)
    return _cache[kind]


def _strip_body(item: dict) -> dict:
    return {k: v for k, v in item.items() if k != "body"}


def list_items(kind: str) -> list[dict]:
    return [_strip_body(i) for i in get_collection(kind)]


def get_item(kind: str, item_id: str, render_html: bool = True) -> dict | None:
    for item in get_collection(kind):
        if item["id"] == item_id:
            item = dict(item)
            if render_html:
                item["html"] = markdown(item["body"], extensions=MD_EXTENSIONS)
            return item
    return None


def reload() -> None:
    for kind in COLLECTIONS:
        get_collection(kind, force=True)
