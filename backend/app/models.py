from __future__ import annotations

from pydantic import BaseModel, Field


class FeedbackCreate(BaseModel):
    name: str = Field(default="匿名", max_length=100)
    message: str = Field(min_length=1, max_length=2000)


class FeedbackOut(BaseModel):
    id: int
    name: str
    message: str
    created_at: str
