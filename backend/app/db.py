"""轻量 SQLite：用于存储反馈/留言（参与者进度保留在浏览器 localStorage，不入库）。"""
from __future__ import annotations

import datetime
import os

from sqlalchemy import Column, DateTime, Integer, String, Text, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# SQLite 路径可经环境变量 SQLITE_PATH 覆盖（生产建议挂卷到 /data/cube.db）。
DB_PATH = os.environ.get(
    "SQLITE_PATH",
    os.path.join(os.path.dirname(__file__), "..", "cube.db"),
)
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False)
Base = declarative_base()


class Feedback(Base):
    __tablename__ = "feedback"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), default="匿名")
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


Base.metadata.create_all(engine)


def add_feedback(name: str, message: str) -> Feedback:
    with SessionLocal() as session:
        fb = Feedback(name=name or "匿名", message=message)
        session.add(fb)
        session.commit()
        session.refresh(fb)
        return fb
