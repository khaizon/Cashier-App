"""Sale recording — the replacement for appending rows to the Google Sheet.

Prices are always resolved server-side from the catalog, so a client cannot
dictate what it pays; the client only sends item ids and quantities.
"""

from __future__ import annotations

import secrets
import string
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..deps import CurrentUser, DbSession
from ..models import Item, Sale, SaleItem
from ..schemas import (
    DailyTotalOut,
    PaymentSplitOut,
    PeriodTotalsOut,
    SalesRangeOut,
    SalesStatsOut,
    SaleCreate,
    SaleOut,
    TopItemOut,
    cents_to_dollars,
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


@router.post("/sales", response_model=SaleOut, status_code=status.HTTP_201_CREATED, summary="Record a sale")
def create_sale(payload: SaleCreate, db: DbSession, user: CurrentUser) -> SaleOut:
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

    sale = Sale(
        order_ref=_allocate_order_ref(db),
        user_id=user.id,
        payment=payload.payment,
        total_cents=0,
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


def _totals(revenue_cents: int, transactions: int, items_sold: int) -> PeriodTotalsOut:
    return PeriodTotalsOut(
        revenue=cents_to_dollars(revenue_cents),
        transactions=transactions,
        items_sold=items_sold,
        average_sale=cents_to_dollars(round(revenue_cents / transactions)) if transactions else 0.0,
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
