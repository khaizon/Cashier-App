"""Sale recording — the replacement for appending rows to the Google Sheet.

Prices are always resolved server-side from the catalog, so a client cannot
dictate what it pays; the client only sends item ids and quantities.
"""

from __future__ import annotations

import secrets
import string

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..deps import CurrentUser, DbSession
from ..models import Item, Sale, SaleItem
from ..schemas import SaleCreate, SaleOut, sale_out

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
