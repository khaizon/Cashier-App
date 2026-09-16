"""ORM models.

Money is stored as integer cents (``price_cents``/``total_cents``) so totals never
accumulate binary floating-point error; the API converts to dollars at the edge.
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, LargeBinary, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    # pbkdf2_sha256$<iterations>$<salt>$<digest> — salt is embedded, see app.security
    password_hash: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    sales: Mapped[list[Sale]] = relationship(back_populates="user")


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    palette1: Mapped[str] = mapped_column(String(32), default="")
    palette2: Mapped[str] = mapped_column(String(32), default="")
    palette3: Mapped[str] = mapped_column(String(32), default="")
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    items: Mapped[list[Item]] = relationship(
        back_populates="category",
        cascade="all, delete-orphan",
        order_by="Item.sort_order, Item.id",
    )


class Item(Base):
    __tablename__ = "items"

    id: Mapped[int] = mapped_column(primary_key=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(160))
    price_cents: Mapped[int] = mapped_column(Integer)
    # Legacy/external URL, used when no image has been uploaded through the CMS.
    # See ``image_id`` for CMS-managed assets.
    img: Mapped[str] = mapped_column(String(500), default="")
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    # CMS-managed image. Nullable so externally-hosted images (the old
    # ``img`` string, seeded sample data) keep working unchanged.
    image_id: Mapped[int | None] = mapped_column(
        ForeignKey("item_images.id", ondelete="SET NULL"), nullable=True, index=True
    )
    # Bumped whenever the underlying bytes change, so a fixed image URL can be
    # cached immutably by the browser without ever going stale.
    image_version: Mapped[int] = mapped_column(Integer, default=0)

    category: Mapped[Category] = relationship(back_populates="items")
    image: Mapped[ItemImage | None] = relationship(back_populates="items")


class ItemImage(Base):
    """An uploaded catalogue image, stored in the database as bytes.

    Images live in the DB rather than on disk so a catalogue is a single
    portable artifact and the app stays deployable without a writable volume.

    Bytes are always normalised to a square on the way in (see ``app.images``),
    so consumers can assume ``width == height``.
    """

    __tablename__ = "item_images"

    id: Mapped[int] = mapped_column(primary_key=True)
    # Unguessable handle used in public URLs, so the sequential ``id`` is never
    # exposed and the image space cannot be enumerated.
    public_id: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    data: Mapped[bytes] = mapped_column(LargeBinary)
    content_type: Mapped[str] = mapped_column(String(64), default="image/webp")
    # Original client filename, kept for operator recognition only.
    filename: Mapped[str] = mapped_column(String(255), default="")
    width: Mapped[int] = mapped_column(Integer)
    height: Mapped[int] = mapped_column(Integer)
    byte_size: Mapped[int] = mapped_column(Integer)
    # sha256 of ``data``; lets an operator spot duplicate assets.
    sha256: Mapped[str] = mapped_column(String(64), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    items: Mapped[list[Item]] = relationship(back_populates="image")


class Sale(Base):
    __tablename__ = "sales"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_ref: Mapped[str] = mapped_column(String(16), unique=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    payment: Mapped[str] = mapped_column(String(16))
    total_cents: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)

    user: Mapped[User] = relationship(back_populates="sales")
    items: Mapped[list[SaleItem]] = relationship(
        back_populates="sale",
        cascade="all, delete-orphan",
        order_by="SaleItem.id",
    )


class SaleItem(Base):
    """A priced line on a sale.

    ``title`` and ``price_cents`` are copied from the item at sale time so the
    historical record survives later catalog edits; ``item_id`` is kept only as a
    soft reference and is nulled if the item is deleted.
    """

    __tablename__ = "sale_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    sale_id: Mapped[int] = mapped_column(ForeignKey("sales.id", ondelete="CASCADE"), index=True)
    item_id: Mapped[int | None] = mapped_column(ForeignKey("items.id", ondelete="SET NULL"), nullable=True)
    title: Mapped[str] = mapped_column(String(160))
    price_cents: Mapped[int] = mapped_column(Integer)
    quantity: Mapped[int] = mapped_column(Integer)
    subtotal_cents: Mapped[int] = mapped_column(Integer)

    sale: Mapped[Sale] = relationship(back_populates="items")
