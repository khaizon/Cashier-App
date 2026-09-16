"""Catalog administration — the write side of the CMS.

Reads for the cashier stay on ``/api/catalog`` (a deliberately narrow shape).
These endpoints return the richer admin shape: integer cents, category ids, and
the stored-image metadata an editor needs.

A note on images: replacing or clearing an item's picture never deletes the old
``ItemImage`` row. Sale history can still reference an item whose picture was
changed afterwards, and these rows are small WebP blobs, so the safer default is
to leave them. ``DELETE /api/images/{id}`` removes one when it is truly
unreferenced.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload

from ..deps import CurrentUser, DbSession
from ..models import Category, Item, ItemImage
from ..schemas import (
    AdminCategoryOut,
    AdminItemOut,
    CategoryCreate,
    CategoryUpdate,
    ItemCreate,
    ItemUpdate,
    admin_category_out,
    admin_item_out,
)

router = APIRouter(prefix="/api/admin", tags=["admin"])


# ------------------------------------------------------------------- helpers


def _load_category(db: DbSession, category_id: int) -> Category:
    category = db.scalar(
        select(Category)
        .where(Category.id == category_id)
        .options(selectinload(Category.items).selectinload(Item.image))
        # See _load_item: refresh relationship state from this query.
        .execution_options(populate_existing=True)
    )
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found.")
    return category


def _load_item(db: DbSession, item_id: int) -> Item:
    item = db.scalar(
        select(Item)
        .where(Item.id == item_id)
        .options(selectinload(Item.image))
        # The session may already hold this Item with ``image`` loaded as None
        # from before a PATCH changed ``image_id``. Without populate_existing the
        # stale relationship is reused and the response omits the new image.
        .execution_options(populate_existing=True)
    )
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found.")
    return item


def _next_category_sort(db: DbSession) -> int:
    current = db.scalar(select(func.max(Category.sort_order)))
    return (current or 0) + 1


def _next_item_sort(db: DbSession, category_id: int) -> int:
    current = db.scalar(select(func.max(Item.sort_order)).where(Item.category_id == category_id))
    return (current or 0) + 1


def _require_image(db: DbSession, image_id: int | None) -> None:
    if image_id is None:
        return
    if db.get(ItemImage, image_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found.")


def _commit(db: DbSession, *, conflict_detail: str) -> None:
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=conflict_detail) from exc


# ----------------------------------------------------------------- categories


@router.get("/catalog", response_model=list[AdminCategoryOut], summary="Full catalog for editing")
def read_admin_catalog(db: DbSession, _user: CurrentUser) -> list[AdminCategoryOut]:
    categories = db.scalars(
        select(Category)
        .options(selectinload(Category.items).selectinload(Item.image))
        .order_by(Category.sort_order, Category.id)
    ).all()
    return [admin_category_out(category) for category in categories]


@router.post("/categories", response_model=AdminCategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(payload: CategoryCreate, db: DbSession, _user: CurrentUser) -> AdminCategoryOut:
    category = Category(
        name=payload.name.strip(),
        palette1=payload.palette1,
        palette2=payload.palette2,
        palette3=payload.palette3,
        sort_order=payload.sort_order if payload.sort_order is not None else _next_category_sort(db),
    )
    db.add(category)
    _commit(db, conflict_detail=f"A category named {payload.name!r} already exists.")
    return admin_category_out(_load_category(db, category.id))


@router.patch("/categories/{category_id}", response_model=AdminCategoryOut)
def update_category(
    category_id: int, payload: CategoryUpdate, db: DbSession, _user: CurrentUser
) -> AdminCategoryOut:
    category = _load_category(db, category_id)
    fields = payload.model_dump(exclude_unset=True)

    if "name" in fields:
        category.name = fields["name"].strip()
    for field in ("palette1", "palette2", "palette3", "sort_order"):
        if field in fields and fields[field] is not None:
            setattr(category, field, fields[field])

    _commit(db, conflict_detail=f"A category named {category.name!r} already exists.")
    return admin_category_out(_load_category(db, category_id))


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(category_id: int, db: DbSession, _user: CurrentUser) -> Response:
    category = _load_category(db, category_id)
    # Items cascade at the DB level (ON DELETE CASCADE, PRAGMA-enabled).
    db.delete(category)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------- items


@router.post("/items", response_model=AdminItemOut, status_code=status.HTTP_201_CREATED)
def create_item(payload: ItemCreate, db: DbSession, _user: CurrentUser) -> AdminItemOut:
    if db.get(Category, payload.category_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found.")
    _require_image(db, payload.image_id)

    item = Item(
        category_id=payload.category_id,
        title=payload.title.strip(),
        price_cents=payload.price_cents,
        img=payload.img,
        image_id=payload.image_id,
        image_version=1 if payload.image_id is not None else 0,
        sort_order=payload.sort_order if payload.sort_order is not None else _next_item_sort(db, payload.category_id),
    )
    db.add(item)
    db.commit()
    return admin_item_out(_load_item(db, item.id))


@router.patch("/items/{item_id}", response_model=AdminItemOut)
def update_item(item_id: int, payload: ItemUpdate, db: DbSession, _user: CurrentUser) -> AdminItemOut:
    item = _load_item(db, item_id)
    fields = payload.model_dump(exclude_unset=True)

    if "category_id" in fields and fields["category_id"] is not None:
        if db.get(Category, fields["category_id"]) is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found.")
        moved = fields["category_id"] != item.category_id
        item.category_id = fields["category_id"]
        # A moved item lands at the end of its new category rather than
        # colliding with whatever already sits at its old sort_order.
        if moved and "sort_order" not in fields:
            item.sort_order = _next_item_sort(db, fields["category_id"])

    if "image_id" in fields:
        new_image_id = fields["image_id"]
        _require_image(db, new_image_id)
        if new_image_id != item.image_id:
            item.image_id = new_image_id
            # Bump the version so any client-side cache of the old URL is bypassed.
            item.image_version += 1

    if "title" in fields and fields["title"] is not None:
        item.title = fields["title"].strip()
    if "price_cents" in fields and fields["price_cents"] is not None:
        item.price_cents = fields["price_cents"]
    if "img" in fields and fields["img"] is not None:
        item.img = fields["img"]
    if "sort_order" in fields and fields["sort_order"] is not None:
        item.sort_order = fields["sort_order"]

    db.commit()
    return admin_item_out(_load_item(db, item_id))


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: int, db: DbSession, _user: CurrentUser) -> Response:
    item = _load_item(db, item_id)
    db.delete(item)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# --------------------------------------------------------------------- images


@router.delete("/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_image(image_id: int, db: DbSession, _user: CurrentUser) -> Response:
    """Delete an unreferenced image. Refuses while items still point at it."""
    image = db.get(ItemImage, image_id)
    if image is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found.")

    in_use = db.scalar(select(func.count()).select_from(Item).where(Item.image_id == image_id)) or 0
    if in_use:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Image is still used by {in_use} item(s).",
        )

    db.delete(image)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
