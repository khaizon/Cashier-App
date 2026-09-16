"""ORM models.

Money is stored as integer cents (``price_cents``/``total_cents``) so totals never
accumulate binary floating-point error; the API converts to dollars at the edge.
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, LargeBinary, String, Text
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
    # Client-generated idempotency key. A till that rings a sale offline cannot
    # know whether a lost response meant success, so a replay carries the same
    # ref and the unique index makes the retry return the original row instead of
    # selling the item twice.
    client_ref: Mapped[str | None] = mapped_column(String(36), unique=True, index=True, nullable=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    payment: Mapped[str] = mapped_column(String(16))
    total_cents: Mapped[int] = mapped_column(Integer)
    # When the sale actually happened on the device. Authoritative for reporting
    # when present (clamped at sync), because an offline sale may be reconciled
    # long after the fact.
    sold_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # Server clock at reconciliation, kept so device time is always auditable.
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    # Set when a synced snapshot disagrees with the catalogue at sync time. The
    # sale still records the price the customer actually paid.
    price_conflict: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
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


class CatalogMeta(Base):
    """A single row tracking the catalogue revision.

    Bumped by every catalogue mutation so an offline till can revalidate with one
    cheap conditional request instead of re-downloading, and so it can record the
    revision a queued sale was priced against.
    """

    __tablename__ = "catalog_meta"

    id: Mapped[int] = mapped_column(primary_key=True)
    revision: Mapped[int] = mapped_column(Integer, default=1)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class SaleDeletion(Base):
    """An audit record for a deleted sale.

    Deleting a sale removes it from every report, so the fact that it existed and
    who removed it must survive somewhere. This row is written in the same
    transaction as the delete and keeps a snapshot of what was removed, since the
    sale row itself is about to be gone.

    Deliberately not a soft delete: the operator asked for the transaction to go
    away, and a hidden-but-present row would silently keep counting towards some
    future report that forgot to filter it.
    """

    __tablename__ = "sale_deletions"

    id: Mapped[int] = mapped_column(primary_key=True)
    # Plain columns, not foreign keys: the referenced rows are deleted, and this
    # record has to outlive them.
    sale_id: Mapped[int] = mapped_column(Integer, index=True)
    order_ref: Mapped[str] = mapped_column(String(16), index=True)
    total_cents: Mapped[int] = mapped_column(Integer)
    payment: Mapped[str] = mapped_column(String(16), default="")
    # The sale's own timestamp, so a deletion can still be placed in time.
    sold_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # The deleted sale's idempotency key, remembered so a queued offline retry
    # cannot resurrect a sale an operator deliberately removed. Without this,
    # deleting a synced sale would simply be undone by the next sync attempt.
    client_ref: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    # JSON array of the removed lines: [{title, quantity, price_cents}].
    items_json: Mapped[str] = mapped_column(Text, default="[]")
    reason: Mapped[str] = mapped_column(String(255), default="")
    deleted_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    deleted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)
