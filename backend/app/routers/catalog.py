"""Catalog reads — the replacement for the Google Sheets range fetch."""

from __future__ import annotations

from fastapi import APIRouter
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from ..deps import CurrentUser, DbSession
from ..models import Category
from ..schemas import CategoryOut, category_out

router = APIRouter(prefix="/api", tags=["catalog"])


@router.get("/catalog", response_model=list[CategoryOut], summary="Categories with their items")
def read_catalog(db: DbSession, _user: CurrentUser) -> list[CategoryOut]:
    categories = db.scalars(
        select(Category).options(selectinload(Category.items)).order_by(Category.sort_order, Category.id)
    ).all()
    return [category_out(category) for category in categories]
