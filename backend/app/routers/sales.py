"""Sale recording — the replacement for appending rows to the Google Sheet.

Prices are always resolved server-side from the catalog, so a client cannot
dictate what it pays; the client only sends item ids and quantities.
"""

from __future__ import annotations

import csv
import json
import secrets
import string
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from io import StringIO

from fastapi import APIRouter, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from ..deps import CurrentUser, DbSession
from ..models import Item, Sale, SaleDeletion, SaleItem, User
from ..schemas import (
    DailyTotalOut,
    PaymentSplitOut,
    PeriodTotalsOut,
    SalesRangeOut,
    SalesStatsOut,
    SaleCreate,
    SaleDeleteIn,
    SaleDeletionOut,
    SaleOut,
    SaleSyncBatchIn,
    SaleSyncBatchOut,
    SaleSyncResultOut,
    TopItemOut,
    cents_to_dollars,
    sale_deletion_out,
    sale_out,
)

router = APIRouter(prefix="/api", tags=["sales"])

ORDER_REF_ALPHABET = string.ascii_uppercase + string.digits
ORDER_REF_LENGTH = 6
ORDER_REF_ATTEMPTS = 10


def _generate_order_ref() -> str:
    return "".join(secrets.choice(ORDER_REF_ALPHABET) for _ in range(ORDER_REF_LENGTH))


def _allocate_order_ref(db: Session) -> str:
    for _ in range(ORDER_REF_ATTEMPTS):
        candidate = _generate_order_ref()
        exists = db.scalar(select(Sale.id).where(Sale.order_ref == candidate))
        if exists is None:
            return candidate
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not allocate an order reference")


# Device clocks are not trustworthy, so a client-supplied sold_at is accepted
# only inside this window. Anything outside is replaced by server time and
# flagged, because an unclamped timestamp lets one bad clock corrupt reporting.
MAX_BACKDATE_DAYS = 30
MAX_FUTURE_MINUTES = 60


def _resolve_sold_at(value: datetime | None) -> tuple[datetime | None, bool]:
    """Return ``(sold_at, rejected)`` for a client-supplied timestamp."""
    if value is None:
        return None, False
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)

    now = datetime.now(timezone.utc)
    if value < now - timedelta(days=MAX_BACKDATE_DAYS) or value > now + timedelta(minutes=MAX_FUTURE_MINUTES):
        return None, True
    return value, False


def _existing_sale(db: Session, client_ref: str | None) -> Sale | None:
    """Idempotency lookup: has this device already recorded this sale?"""
    if not client_ref:
        return None
    return db.scalar(select(Sale).where(Sale.client_ref == client_ref).options(selectinload(Sale.items)))


def _deleted_ref(db: Session, client_ref: str | None) -> SaleDeletion | None:
    """Was this sale recorded and then deliberately deleted?

    The sale row is gone, so its idempotency key would otherwise be free again
    and a queued offline retry would quietly recreate a sale an operator removed.
    """
    if not client_ref:
        return None
    return db.scalar(select(SaleDeletion).where(SaleDeletion.client_ref == client_ref))


@router.post("/sales", response_model=SaleOut, status_code=status.HTTP_201_CREATED, summary="Record a sale")
def create_sale(payload: SaleCreate, db: DbSession, user: CurrentUser) -> SaleOut:
    # A replay of an already-recorded sale returns the original rather than
    # selling twice. The client cannot tell a lost response from a failure, so
    # this is what makes a retry safe.
    existing = _existing_sale(db, payload.client_ref)
    if existing is not None:
        return sale_out(existing)

    deleted = _deleted_ref(db, payload.client_ref)
    if deleted is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Sale {deleted.order_ref} was already recorded and then deleted "
                f"({deleted.reason}). It cannot be re-recorded."
            ),
        )

    # Collapse repeated ids so the same item sent twice becomes one line.
    quantities: dict[int, int] = {}
    for line in payload.items:
        quantities[line.item_id] = quantities.get(line.item_id, 0) + line.quantity

    catalog_items = {item.id: item for item in db.scalars(select(Item).where(Item.id.in_(quantities)))}

    missing = sorted(set(quantities) - set(catalog_items))
    if missing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown item id(s): {', '.join(str(item_id) for item_id in missing)}",
        )

    sold_at, _rejected = _resolve_sold_at(payload.sold_at)

    sale = Sale(
        order_ref=_allocate_order_ref(db),
        client_ref=payload.client_ref,
        user_id=user.id,
        payment=payload.payment,
        total_cents=0,
        sold_at=sold_at,
        price_conflict=False,
    )

    total_cents = 0
    for item_id, quantity in quantities.items():
        item = catalog_items[item_id]
        subtotal_cents = item.price_cents * quantity
        total_cents += subtotal_cents
        sale.items.append(
            SaleItem(
                item_id=item.id,
                title=item.title,
                price_cents=item.price_cents,
                quantity=quantity,
                subtotal_cents=subtotal_cents,
            )
        )

    sale.total_cents = total_cents
    db.add(sale)
    db.commit()
    db.refresh(sale)
    return sale_out(sale)


@router.post("/sales/sync", response_model=SaleSyncBatchOut, summary="Reconcile sales queued offline")
def sync_sales(payload: SaleSyncBatchIn, db: DbSession, user: CurrentUser) -> SaleSyncBatchOut:
    """Apply a batch of sales rung up while the till had no connection.

    Two rules make this safe:

    * Idempotent per ``client_ref`` — a batch replayed after a lost response
      returns the already-stored sales instead of duplicating them.
    * The price the customer actually paid is what gets recorded. The server
      still compares each snapshot against the current catalogue, but a
      disagreement is *flagged* rather than silently re-priced, because the
      money in the drawer followed the old price.

    Partial success is deliberate: one unusable entry must not discard the rest,
    since those are real sales that would otherwise be lost.
    """
    results: list[SaleSyncResultOut] = []
    recorded = duplicates = rejected = conflicts = 0

    for entry in payload.sales:
        existing = _existing_sale(db, entry.client_ref)
        if existing is not None:
            duplicates += 1
            results.append(
                SaleSyncResultOut(
                    client_ref=entry.client_ref,
                    status="duplicate",
                    sale_id=existing.id,
                    order_ref=existing.order_ref,
                    price_conflict=bool(existing.price_conflict),
                )
            )
            continue

        # A sale an operator deleted must not come back on the next sync — the
        # device has no way of knowing it was removed.
        if _deleted_ref(db, entry.client_ref) is not None:
            rejected += 1
            results.append(
                SaleSyncResultOut(
                    client_ref=entry.client_ref,
                    status="rejected",
                    reason="This sale was recorded and then deleted. It will not be re-created.",
                )
            )
            continue

        subtotal_mismatch = any(
            line.subtotal_cents is not None and line.subtotal_cents != line.price_cents * line.quantity
            for line in entry.items
        )
        if subtotal_mismatch:
            rejected += 1
            results.append(
                SaleSyncResultOut(
                    client_ref=entry.client_ref,
                    status="rejected",
                    reason="A line's subtotal does not match price_cents * quantity.",
                )
            )
            continue

        catalog_items = {
            item.id: item for item in db.scalars(select(Item).where(Item.id.in_([line.item_id for line in entry.items])))
        }

        # Price drift: the device priced against a catalogue that has since moved.
        conflict = any(
            line.item_id in catalog_items and catalog_items[line.item_id].price_cents != line.price_cents
            for line in entry.items
        )

        sold_at, _rejected_at = _resolve_sold_at(entry.sold_at)

        sale = Sale(
            order_ref=_allocate_order_ref(db),
            client_ref=entry.client_ref,
            user_id=user.id,
            payment=entry.payment,
            total_cents=0,
            sold_at=sold_at,
            price_conflict=conflict,
        )
        for line in entry.items:
            catalog_item = catalog_items.get(line.item_id)
            # Keep the catalogue's current title (the device's may be stale), but
            # always the device's price, which is what was actually charged.
            title = catalog_item.title if catalog_item is not None else (line.title or "Unknown item")
            sale.items.append(
                SaleItem(
                    item_id=line.item_id if catalog_item is not None else None,
                    title=title,
                    price_cents=line.price_cents,
                    quantity=line.quantity,
                    subtotal_cents=line.price_cents * line.quantity,
                )
            )
        sale.total_cents = sum(line.subtotal_cents for line in sale.items)
        db.add(sale)

        try:
            db.flush()
        except IntegrityError:
            # Two devices raced the same client_ref and the other one won.
            db.rollback()
            stored = _existing_sale(db, entry.client_ref)
            if stored is None:
                raise
            duplicates += 1
            results.append(
                SaleSyncResultOut(
                    client_ref=entry.client_ref,
                    status="duplicate",
                    sale_id=stored.id,
                    order_ref=stored.order_ref,
                    price_conflict=bool(stored.price_conflict),
                )
            )
            continue

        recorded += 1
        conflicts += 1 if conflict else 0
        results.append(
            SaleSyncResultOut(
                client_ref=entry.client_ref,
                status="recorded",
                sale_id=sale.id,
                order_ref=sale.order_ref,
                price_conflict=conflict,
                reason="Priced differently from the current catalogue; recorded at the price paid."
                if conflict
                else None,
            )
        )

    db.commit()
    return SaleSyncBatchOut(
        results=results,
        recorded=recorded,
        duplicates=duplicates,
        rejected=rejected,
        conflicts=conflicts,
    )


@router.get("/sales", response_model=list[SaleOut], summary="Recent sales, newest first")
def list_sales(
    db: DbSession,
    _user: CurrentUser,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
) -> list[SaleOut]:
    sales = db.scalars(
        select(Sale)
        .options(selectinload(Sale.items))
        .order_by(Sale.created_at.desc(), Sale.id.desc())
        .limit(limit)
        .offset(offset)
    ).all()
    return [sale_out(sale) for sale in sales]


@router.get(
    "/sales/deletions",
    response_model=list[SaleDeletionOut],
    summary="Audit trail of deleted sales",
)
def list_sale_deletions(
    db: DbSession,
    _user: CurrentUser,
    limit: int = Query(50, ge=1, le=200),
) -> list[SaleDeletionOut]:
    """Newest first. Kept separate from the sales list so a deletion is visible."""
    records = db.scalars(
        select(SaleDeletion).order_by(SaleDeletion.deleted_at.desc(), SaleDeletion.id.desc()).limit(limit)
    ).all()

    names: dict[int, str] = {}
    for record in records:
        if record.deleted_by_id is not None and record.deleted_by_id not in names:
            account = db.get(User, record.deleted_by_id)
            if account is not None:
                names[record.deleted_by_id] = account.username

    return [sale_deletion_out(record, names.get(record.deleted_by_id or -1)) for record in records]


def _totals(revenue_cents: int, transactions: int, items_sold: int) -> PeriodTotalsOut:
    return PeriodTotalsOut(
        revenue=cents_to_dollars(revenue_cents),
        transactions=transactions,
        items_sold=items_sold,
        average_sale=cents_to_dollars(round(revenue_cents / transactions)) if transactions else 0.0,
    )


def _csv_safe(value: str) -> str:
    """Neutralise spreadsheet formula injection.

    A field beginning with =, +, - or @ is treated as a formula by Excel and
    Sheets, so a catalog title like ``=HYPERLINK(...)`` would execute when the
    export is opened. Prefixing with an apostrophe keeps it as text. Item titles
    are operator-entered, so this is a real (if small) hole, not paranoia.
    """
    if value[:1] in ("=", "+", "-", "@", "\t", "\r"):
        return "'" + value
    return value


# Fixed columns, plus one row per sale *line*: a sale with three items becomes
# three rows, each carrying its order's own total. That is the shape pivot
# tables and per-item reporting expect; the sale total deliberately repeats.
CSV_COLUMNS = (
    "order_ref",
    "created_at_utc",
    "date_local",
    "payment",
    "cashier",
    "item",
    "unit_price_cents",
    "quantity",
    "line_subtotal_cents",
    "sale_total_cents",
    "unit_price",
    "line_subtotal",
    "sale_total",
)




@router.delete("/sales/{sale_id}", response_model=SaleDeletionOut, summary="Delete a recorded sale")
def delete_sale(sale_id: int, payload: SaleDeleteIn, db: DbSession, user: CurrentUser) -> SaleDeletionOut:
    """Remove a sale, keeping an audit record of what was removed and why.

    The sale disappears from the list, the stats and the CSV export, and the
    ``sale_items`` cascade away with it. A ``sale_deletions`` row is written in
    the same transaction carrying a snapshot — order ref, total, and the priced
    lines — because money leaving the ledger has to leave a trace.
    """
    sale = db.scalar(select(Sale).where(Sale.id == sale_id).options(selectinload(Sale.items), selectinload(Sale.user)))
    if sale is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sale not found.")

    reason = payload.reason.strip()
    if not reason:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="A reason is required to delete a sale.",
        )

    # Captured before the delete: the sale row is about to stop existing.
    deleted_by_name = sale.user.username if sale.user is not None else None
    snapshot = [
        {"title": line.title, "quantity": line.quantity, "price_cents": line.price_cents}
        for line in sale.items
    ]

    record = SaleDeletion(
        sale_id=sale.id,
        order_ref=sale.order_ref,
        total_cents=sale.total_cents,
        payment=sale.payment,
        sold_at=sale.sold_at or sale.created_at,
        client_ref=sale.client_ref,
        items_json=json.dumps(snapshot, separators=(",", ":")),
        reason=reason[:255],
        deleted_by_id=user.id,
    )
    db.add(record)
    db.delete(sale)
    db.commit()
    db.refresh(record)

    return sale_deletion_out(record, deleted_by_name)


@router.get("/sales/export.csv", summary="Download recorded sales as CSV")
def export_sales_csv(
    db: DbSession,
    _user: CurrentUser,
    days: int = Query(30, ge=1, le=3650, description="Length of the export window, ending today"),
) -> Response:
    end = datetime.now(timezone.utc)
    start = (end - timedelta(days=days - 1)).replace(hour=0, minute=0, second=0, microsecond=0)

    sales = db.scalars(
        select(Sale)
        .where(Sale.created_at >= start)
        # Chronological: an export is usually opened as a ledger, not a feed.
        .order_by(Sale.created_at.asc(), Sale.id.asc())
        .options(selectinload(Sale.items), selectinload(Sale.user))
    ).all()

    buffer = StringIO()
    writer = csv.writer(buffer, lineterminator="\r\n")
    writer.writerow(CSV_COLUMNS)
    for sale in sales:
        created = sale.created_at
        if created.tzinfo is None:
            # SQLite returns naive datetimes; they were written as UTC.
            created = created.replace(tzinfo=timezone.utc)
        cashier = sale.user.username if sale.user else ""
        for line in sale.items:
            writer.writerow(
                [
                    sale.order_ref,
                    created.isoformat(),
                    created.date().isoformat(),
                    sale.payment,
                    _csv_safe(cashier),
                    _csv_safe(line.title),
                    line.price_cents,
                    line.quantity,
                    line.subtotal_cents,
                    sale.total_cents,
                    f"{cents_to_dollars(line.price_cents):.2f}",
                    f"{cents_to_dollars(line.subtotal_cents):.2f}",
                    f"{cents_to_dollars(sale.total_cents):.2f}",
                ]
            )

    filename = f"cashier-sales-{end.date().isoformat()}.csv"
    return Response(
        content="\ufeff" + buffer.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            # The window bounds are generated content, so nothing may cache it.
            "Cache-Control": "no-store",
        },
    )


@router.get("/sales/stats", response_model=SalesStatsOut, summary="Recorded-sales summary for a period")
def sales_stats(
    db: DbSession,
    _user: CurrentUser,
    days: int = Query(14, ge=1, le=365, description="Length of the reporting window, ending today"),
) -> SalesStatsOut:
    """Aggregate recorded sales for the reporting page.

    Bucketing is deliberately done in Python rather than SQL: the whole point of
    the window is that it is small, and doing it here keeps SQLite's date
    functions and timezone handling out of the picture.
    """
    end = datetime.now(timezone.utc)
    # Whole days only, so "today" is a clean boundary rather than a rolling 24h.
    period_start = (end - timedelta(days=days - 1)).replace(hour=0, minute=0, second=0, microsecond=0)
    today_start = end.replace(hour=0, minute=0, second=0, microsecond=0)

    sales = db.scalars(
        select(Sale)
        .where(Sale.created_at >= period_start)
        .options(selectinload(Sale.items))
        .order_by(Sale.created_at.asc())
    ).all()

    daily_cents: dict[str, int] = {}
    daily_count: dict[str, int] = {}
    payment_cents: dict[str, int] = {}
    payment_count: Counter[str] = Counter()
    item_quantity: Counter[str] = Counter()
    item_cents: defaultdict[str, int] = defaultdict(int)

    total_cents = 0
    today_cents = 0
    today_count = 0
    today_items = 0
    items_sold = 0

    for sale in sales:
        # SQLite hands back naive datetimes; they were written as UTC.
        created = sale.created_at
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        day = created.date().isoformat()

        daily_cents[day] = daily_cents.get(day, 0) + sale.total_cents
        daily_count[day] = daily_count.get(day, 0) + 1
        payment_cents[sale.payment] = payment_cents.get(sale.payment, 0) + sale.total_cents
        payment_count[sale.payment] += 1
        total_cents += sale.total_cents

        is_today = created >= today_start
        if is_today:
            today_cents += sale.total_cents
            today_count += 1

        for line in sale.items:
            item_quantity[line.title] += line.quantity
            item_cents[line.title] += line.subtotal_cents
            items_sold += line.quantity
            if is_today:
                today_items += line.quantity

    # Every day in the window, including days with no sales.
    daily = [
        DailyTotalOut(
            date=(period_start + timedelta(days=offset)).date().isoformat(),
            revenue=cents_to_dollars(daily_cents.get((period_start + timedelta(days=offset)).date().isoformat(), 0)),
            transactions=daily_count.get((period_start + timedelta(days=offset)).date().isoformat(), 0),
        )
        for offset in range(days)
    ]

    payments = [
        PaymentSplitOut(
            payment=payment,
            revenue=cents_to_dollars(cents),
            transactions=payment_count[payment],
            share=round(cents / total_cents, 4) if total_cents else 0.0,
        )
        for payment, cents in sorted(payment_cents.items(), key=lambda entry: entry[1], reverse=True)
    ]

    top_items = [
        TopItemOut(title=title, quantity=quantity, revenue=cents_to_dollars(item_cents[title]))
        for title, quantity in item_quantity.most_common(10)
    ]

    return SalesStatsOut(
        range=SalesRangeOut(days=days, start=period_start, end=end),
        today=_totals(today_cents, today_count, today_items),
        period=_totals(total_cents, len(sales), items_sold),
        daily=daily,
        payments=payments,
        top_items=top_items,
    )
