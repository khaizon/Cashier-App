"""Catalog reads — the replacement for the Google Sheets range fetch.

``GET /api/catalog`` carries an ETag derived from the catalogue revision, so an
offline till can revalidate cheaply with ``If-None-Match`` and get a ``304``
instead of re-downloading the whole menu over a poor connection.
"""

from __future__ import annotations

from fastapi import APIRouter, Request, Response, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from ..catalog_revision import catalog_revision
from ..deps import CurrentUser, DbSession
from ..models import Category, Item
from ..schemas import CategoryOut, CatalogRevisionOut, category_out

router = APIRouter(prefix="/api", tags=["catalog"])

# Identifies a revision of the catalogue, not a byte-exact representation.
ETAG_PREFIX = "cat"


def catalog_etag(revision: int) -> str:
    return f'"{ETAG_PREFIX}-{revision}"'


def etag_matches(header: str | None, etag: str) -> bool:
    """Does an If-None-Match header accept this ETag?

    Handles the comma-separated list form and ``*``; repeats a weak-comparison
    (ignoring ``W/``) because the tag identifies a revision.
    """
    if not header:
        return False
    if header.strip() == "*":
        return True

    def strip_weak(value: str) -> str:
        value = value.strip()
        return value[2:].strip() if value.startswith("W/") else value

    wanted = strip_weak(etag)
    return any(strip_weak(candidate) == wanted for candidate in header.split(","))


@router.get("/catalog", response_model=list[CategoryOut] | None, summary="Categories with their items")
def read_catalog(db: DbSession, _user: CurrentUser, request: Request, response: Response) -> list[CategoryOut] | Response:
    """The whole menu, with an ETag so an offline till can skip re-downloading it.

    The 304 is returned explicitly rather than relying on header-based
    negotiation: FastAPI builds that comparison from the *dependency* response it
    snapshots before the endpoint runs, so a header set here would never take
    part in it.
    """
    etag = catalog_etag(catalog_revision(db))
    response.headers["ETag"] = etag
    # Per-user data that changes behind an ETag, so nothing may reuse it without
    # revalidating.
    response.headers["Cache-Control"] = "private, no-cache"

    if etag_matches(request.headers.get("if-none-match"), etag):
        return Response(status_code=status.HTTP_304_NOT_MODIFIED, headers=dict(response.headers))

    categories = db.scalars(
        select(Category)
        # ``image`` is needed by ``item_out`` to emit the stored-image URL;
        # eager-loading it here keeps the endpoint to a fixed number of queries.
        .options(selectinload(Category.items).selectinload(Item.image))
        .order_by(Category.sort_order, Category.id)
    ).all()
    return [category_out(category) for category in categories]


@router.get("/catalog/revision", response_model=CatalogRevisionOut, summary="Catalogue revision only")
def read_catalog_revision(db: DbSession, _user: CurrentUser) -> CatalogRevisionOut:
    """A tiny probe so an idle till can ask "has the menu changed?" cheaply."""
    return CatalogRevisionOut(revision=catalog_revision(db))
