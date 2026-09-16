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

from .models import Category, Item, ItemImage, Sale, SaleDeletion, SaleItem


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


class CatalogRevisionOut(BaseModel):
    """Just the counter, for a cheap "has the menu changed?" probe."""

    revision: int


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


class CategoryOrderIn(BaseModel):
    """The complete category order, front to back.

    ``ids`` must name every existing category exactly once. A partial list is
    rejected rather than silently leaving categories at duplicate or missing
    positions: menu order is data the operator set, not something to guess at.
    """

    ids: list[int] = Field(min_length=1)


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
    # Optional idempotency key. A client that retries a sale (because it never
    # saw the response) sends the same value and gets the original sale back
    # instead of recording a second one.
    client_ref: str | None = Field(default=None, max_length=36)
    # Optional device clock. Clamped at write time; see app.routers.sales.
    sold_at: datetime | None = None


class SaleItemSyncIn(BaseModel):
    """A line as the device saw it, price included.

    Unlike ``SaleItemIn`` this carries the price, because the only honest record
    of an offline sale is what the customer actually paid. The server still
    compares it against the catalogue and flags any disagreement.
    """

    item_id: int
    quantity: int = Field(gt=0, le=999)
    price_cents: int = Field(ge=0, le=100_000_000)
    title: str = Field(default="", max_length=160)
    # Optional. When the device sends its own subtotal the server verifies it, so
    # an internally inconsistent entry is rejected rather than trusted.
    subtotal_cents: int | None = Field(default=None, ge=0, le=100_000_000 * 999)


class SaleSyncIn(BaseModel):
    client_ref: str = Field(min_length=8, max_length=36)
    payment: Literal["cash", "paynow"] = "cash"
    sold_at: datetime | None = None
    # Which catalogue the device priced against; lets the response explain a
    # conflict precisely rather than just flagging one.
    catalog_revision: int | None = None
    items: list[SaleItemSyncIn] = Field(min_length=1)


class SaleSyncBatchIn(BaseModel):
    sales: list[SaleSyncIn] = Field(min_length=1, max_length=500)


class SaleSyncResultOut(BaseModel):
    client_ref: str
    # recorded: this call created it. duplicate: it already existed.
    # rejected: this entry was unusable; the rest of the batch still applied.
    status: Literal["recorded", "duplicate", "rejected"]
    sale_id: int | None = None
    order_ref: str | None = None
    price_conflict: bool = False
    reason: str | None = None


class SaleSyncBatchOut(BaseModel):
    results: list[SaleSyncResultOut]
    recorded: int
    duplicates: int
    rejected: int
    conflicts: int


class SaleDeleteIn(BaseModel):
    """A reason is required, not optional.

    Deleting a sale removes money from the day's totals, so "why" is the part an
    operator needs later. Making it mandatory is the difference between an audit
    trail and a table of timestamps.
    """

    reason: str = Field(min_length=1, max_length=255)


class SaleDeletionOut(BaseModel):
    id: int
    sale_id: int
    order_ref: str
    total: float
    payment: str
    reason: str
    deleted_by: str | None
    deleted_at: datetime


def sale_deletion_out(record: SaleDeletion, deleted_by: str | None) -> SaleDeletionOut:
    return SaleDeletionOut(
        id=record.id,
        sale_id=record.sale_id,
        order_ref=record.order_ref,
        total=cents_to_dollars(record.total_cents),
        payment=record.payment,
        reason=record.reason,
        deleted_by=deleted_by,
        deleted_at=record.deleted_at,
    )


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
    # Offline provenance, omitted from the wire when the sale was recorded live.
    client_ref: str | None = None
    sold_at: datetime | None = None
    price_conflict: bool = False


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
        client_ref=sale.client_ref,
        sold_at=sale.sold_at,
        price_conflict=bool(sale.price_conflict),
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
