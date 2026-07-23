"""魔方训练营后端：内容 API + 反馈接口 + 前端静态托管。"""
from __future__ import annotations

import os

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from . import content, db
from .models import FeedbackCreate, FeedbackOut

app = FastAPI(title="魔方训练营 Cube Bootcamp API", version="1.0.0")

# CORS：默认开放（本地/dev 兼容）；生产请设为你的域名，如 "https://cube.example.com"
CORS_ORIGINS = [o.strip() for o in os.environ.get("CORS_ORIGINS", "*").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

FRONTEND_DIST = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")
)


# ---------- 知识社区 ----------
@app.get("/api/articles")
def list_articles(category: str | None = None, tag: str | None = None):
    items = content.list_items("articles")
    if category:
        items = [i for i in items if i.get("category") == category]
    if tag:
        items = [i for i in items if tag in (i.get("tags") or [])]
    return sorted(items, key=lambda x: x.get("order", 999))


@app.get("/api/articles/{item_id}")
def get_article(item_id: str):
    item = content.get_item("articles", item_id)
    if not item:
        raise HTTPException(status_code=404, detail="文章不存在")
    return item


# ---------- 阶梯训练计划 ----------
@app.get("/api/levels")
def list_levels():
    return sorted(content.list_items("levels"), key=lambda x: x.get("order", 999))


@app.get("/api/levels/{item_id}")
def get_level(item_id: str):
    item = content.get_item("levels", item_id)
    if not item:
        raise HTTPException(status_code=404, detail="关卡不存在")
    return item


# ---------- 案例库 ----------
@app.get("/api/cases")
def list_cases(
    category: str | None = None,
    q: str | None = Query(default=None, description="关键词搜索"),
):
    items = content.list_items("cases")
    if category:
        items = [i for i in items if i.get("category") == category]
    if q:
        q = q.lower()
        items = [
            i
            for i in items
            if q in (i.get("title") or "").lower()
            or q in (i.get("summary") or "").lower()
            or any(q in str(t).lower() for t in (i.get("tags") or []))
        ]
    return sorted(items, key=lambda x: x.get("order", 999))


@app.get("/api/cases/{item_id}")
def get_case(item_id: str):
    item = content.get_item("cases", item_id)
    if not item:
        raise HTTPException(status_code=404, detail="案例不存在")
    return item


# ---------- 反馈 ----------
@app.post("/api/feedback", response_model=FeedbackOut)
def post_feedback(payload: FeedbackCreate):
    fb = db.add_feedback(payload.name, payload.message)
    return FeedbackOut(
        id=fb.id,
        name=fb.name,
        message=fb.message,
        created_at=fb.created_at.isoformat() if fb.created_at else "",
    )


@app.get("/api/meta")
def meta():
    return {
        "articles": len(content.list_items("articles")),
        "levels": len(content.list_items("levels")),
        "cases": len(content.list_items("cases")),
    }


# ---------- 前端托管（若存在构建产物） ----------
if os.path.isdir(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        index = os.path.join(FRONTEND_DIST, "index.html")
        # API 路径不应落到这里（已在上面定义）
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found")
        return FileResponse(index)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host=os.environ.get("HOST", "0.0.0.0"),
        port=int(os.environ.get("PORT", "8000")),
    )
