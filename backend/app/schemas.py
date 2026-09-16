"""Pydantic request/response models plus ORM -> wire serializers.

Field names on the wire deliberately match the shapes the React app already
uses (``CategoryItem``/``Item``), so swapping gapi for this API is a drop-in
change on the client.
"""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import inspect as sa_inspect

from .models import Category, Item, ItemImage, Sale, SaleItem


def cents_to_dollars(cents: int) -> float:
    return round(cents / 100, 2)


def image_url(image: ItemImage, version: int = 0) -> str:
    """Publicly fetchable URL for a stored image.

    ``v`` is a cache-buster: the bytes behind a ``public_id`` never change, so
    the parameter is not strictly needed, but it makes it obvious in devtools
    when an item was repointed at a new asset.
    """
    suffix = f"?v={version}" if version else ""
    return f"/api/images/{image.public_id}{suffix}"


# --------------------------------------------------------------------------- auth


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str


# ------------------------------------------------------------------------ catalog


class ItemOut(BaseModel):
    id: int
    img: str
    title: str
    price: float
    # Present so the CMS can tell "already has an uploaded asset" from
    # "still on a legacy/external URL" without re-uploading on every save.
    image_id: int | None = None


class CategoryOut(BaseModel):
    category: str
    palette1: str
    palette2: str
    palette3: str
    items: list[ItemOut]


class ItemImageOut(BaseModel):
    """Metadata for an uploaded image; never includes the bytes."""

    id: int
    url: str
    width: int
    height: int
    byte_size: int
    content_type: str
    original_filename: str


def image_out(image: ItemImage, version: int = 0) -> ItemImageOut:
    return ItemImageOut(
        id=image.id,
        url=image_url(image, version),
        width=image.width,
        height=image.height,
        byte_size=image.byte_size,
        content_type=image.content_type,
        original_filename=image.filename,
    )


def _loaded_image(item: Item) -> ItemImage | None:
    """Return ``item.image`` without triggering a lazy load on a detached item.

    Catalog queries eager-load the relationship, but a freshly created item is
    serialised before any such load; touching the attribute there would emit a
    SELECT per item.
    """
    state = sa_inspect(item)
    if "image" in state.unloaded:
        return None
    return item.image


def item_out(item: Item) -> ItemOut:
    image = _loaded_image(item)
    return ItemOut(
        id=item.id,
        img=image_url(image, item.image_version) if image is not None else item.img,
        title=item.title,
        price=cents_to_dollars(item.price_cents),
        image_id=item.image_id,
    )


def category_out(category: Category) -> CategoryOut:
    return CategoryOut(
        category=category.name,
        palette1=category.palette1,
        palette2=category.palette2,
        palette3=category.palette3,
        items=[item_out(item) for item in category.items],
    )


# ------------------------------------------------------------------------- admin


class AdminItemOut(BaseModel):
    id: int
    category_id: int
    title: str
    price_cents: int
    img: str
    image_id: int | None
    image_url: str | None
    sort_order: int


class AdminCategoryOut(BaseModel):
    id: int
    name: str
    palette1: str
    palette2: str
    palette3: str
    sort_order: int
    items: list[AdminItemOut]


def admin_item_out(item: Item) -> AdminItemOut:
    image = _loaded_image(item)
    return AdminItemOut(
        id=item.id,
        category_id=item.category_id,
        title=item.title,
        price_cents=item.price_cents,
        img=item.img,
        image_id=item.image_id,
        image_url=image_url(image, item.image_version) if image is not None else None,
        sort_order=item.sort_order,
    )


def admin_category_out(category: Category) -> AdminCategoryOut:
    return AdminCategoryOut(
        id=category.id,
        name=category.name,
        palette1=category.palette1,
        palette2=category.palette2,
        palette3=category.palette3,
        sort_order=category.sort_order,
        items=[admin_item_out(item) for item in category.items],
    )


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    palette1: str = Field(default="", max_length=32)
    palette2: str = Field(default="", max_length=32)
    palette3: str = Field(default="", max_length=32)
    sort_order: int | None = None


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    palette1: str | None = Field(default=None, max_length=32)
    palette2: str | None = Field(default=None, max_length=32)
    palette3: str | None = Field(default=None, max_length=32)
    sort_order: int | None = None


class ItemCreate(BaseModel):
    category_id: int
    title: str = Field(min_length=1, max_length=160)
    # Cents, matching storage. The CMS multiplies the operator's dollar input.
    price_cents: int = Field(ge=0, le=100_000_000)
    img: str = Field(default="", max_length=500)
    image_id: int | None = None
    sort_order: int | None = None


class ItemUpdate(BaseModel):
    category_id: int | None = None
    title: str | None = Field(default=None, min_length=1, max_length=160)
    price_cents: int | None = Field(default=None, ge=0, le=100_000_000)
    img: str | None = Field(default=None, max_length=500)
    image_id: int | None = None
    sort_order: int | None = None


# -------------------------------------------------------------------------- sales


class SaleItemIn(BaseModel):
    item_id: int
    quantity: int = Field(gt=0, le=999)


class SaleCreate(BaseModel):
    payment: Literal["cash", "paynow"] = "cash"
    items: list[SaleItemIn] = Field(min_length=1)


class SaleItemOut(BaseModel):
    item_id: int | None
    title: str
    price: float
    quantity: int
    subtotal: float


class SaleOut(BaseModel):
    id: int
    order_ref: str
    payment: str
    total: float
    created_at: datetime
    items: list[SaleItemOut]


def sale_item_out(line: SaleItem) -> SaleItemOut:
    return SaleItemOut(
        item_id=line.item_id,
        title=line.title,
        price=cents_to_dollars(line.price_cents),
        quantity=line.quantity,
        subtotal=cents_to_dollars(line.subtotal_cents),
    )


def sale_out(sale: Sale) -> SaleOut:
    return SaleOut(
        id=sale.id,
        order_ref=sale.order_ref,
        payment=sale.payment,
        total=cents_to_dollars(sale.total_cents),
        created_at=sale.created_at,
        items=[sale_item_out(line) for line in sale.items],
    )


# ----------------------------------------------------------------- reporting


class SalesRangeOut(BaseModel):
    """The window a stats payload covers."""

    days: int
    start: datetime
    end: datetime


class PeriodTotalsOut(BaseModel):
    revenue: float
    transactions: int
    items_sold: int
    average_sale: float


class DailyTotalOut(BaseModel):
    # Local calendar date, ISO formatted, so the client does no date maths.
    date: str
    revenue: float
    transactions: int


class PaymentSplitOut(BaseModel):
    payment: str
    revenue: float
    transactions: int
    share: float


class TopItemOut(BaseModel):
    title: str
    quantity: int
    revenue: float


class SalesStatsOut(BaseModel):
    range: SalesRangeOut
    today: PeriodTotalsOut
    period: PeriodTotalsOut
    daily: list[DailyTotalOut]
    payments: list[PaymentSplitOut]
    top_items: list[TopItemOut]
