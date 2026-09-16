"""Pydantic request/response models plus ORM -> wire serializers.

Field names on the wire deliberately match the shapes the React app already
uses (``CategoryItem``/``Item``), so swapping gapi for this API is a drop-in
change on the client.
"""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from .models import Category, Item, Sale, SaleItem


def cents_to_dollars(cents: int) -> float:
    return round(cents / 100, 2)


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


class CategoryOut(BaseModel):
    category: str
    palette1: str
    palette2: str
    palette3: str
    items: list[ItemOut]


def item_out(item: Item) -> ItemOut:
    return ItemOut(id=item.id, img=item.img, title=item.title, price=cents_to_dollars(item.price_cents))


def category_out(category: Category) -> CategoryOut:
    return CategoryOut(
        category=category.name,
        palette1=category.palette1,
        palette2=category.palette2,
        palette3=category.palette3,
        items=[item_out(item) for item in category.items],
    )


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
