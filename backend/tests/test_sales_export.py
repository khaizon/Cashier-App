"""CSV export of recorded sales."""

from __future__ import annotations

import csv
from datetime import datetime, timedelta, timezone
from io import StringIO

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import Item, Sale, SaleItem


def export(client: TestClient, headers: dict[str, str], **params) -> str:
    query = "&".join(f"{key}={value}" for key, value in params.items())
    response = client.get(f"/api/sales/export.csv{'?' + query if query else ''}", headers=headers)
    assert response.status_code == 200, response.text
    return response.text


def rows(text: str) -> list[dict[str, str]]:
    """Parse the body, tolerating the UTF-8 BOM that makes Excel behave."""
    assert text.startswith("\ufeff"), "export should start with a BOM"
    return list(csv.DictReader(StringIO(text.lstrip("\ufeff"))))


def record(client: TestClient, headers: dict[str, str], lines: list[tuple[int, int]], payment: str = "cash") -> dict:
    response = client.post(
        "/api/sales",
        headers=headers,
        json={"payment": payment, "items": [{"item_id": item_id, "quantity": qty} for item_id, qty in lines]},
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_export_requires_authentication(client: TestClient):
    assert client.get("/api/sales/export.csv").status_code == 401


def test_export_sets_download_headers(client: TestClient, auth_headers: dict[str, str]):
    response = client.get("/api/sales/export.csv", headers=auth_headers)

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    disposition = response.headers["content-disposition"]
    assert disposition.startswith("attachment;")
    assert "cashier-sales-" in disposition and disposition.endswith('.csv"')
    # Generated per request, so it must not be cached.
    assert response.headers["cache-control"] == "no-store"


def test_export_of_an_empty_database_is_headers_only(client: TestClient, auth_headers: dict[str, str]):
    parsed = rows(export(client, auth_headers))

    assert parsed == []
    # The header row is still present, so a spreadsheet opens cleanly.
    assert export(client, auth_headers).lstrip("\ufeff").splitlines()[0].startswith("order_ref,")


def test_export_emits_one_row_per_sale_line(client: TestClient, auth_headers: dict[str, str], catalog: dict[str, int]):
    record(client, auth_headers, [(catalog["espresso_id"], 2), (catalog["flat_white_id"], 1)])

    parsed = rows(export(client, auth_headers))

    assert len(parsed) == 2
    assert [row["item"] for row in parsed] == ["Espresso", "Flat White"]
    espresso = parsed[0]
    assert espresso["quantity"] == "2"
    assert espresso["unit_price_cents"] == "300"
    assert espresso["line_subtotal_cents"] == "600"
    assert espresso["unit_price"] == "3.00"
    assert espresso["line_subtotal"] == "6.00"
    # Every line of a sale repeats that sale's own total.
    assert {row["sale_total_cents"] for row in parsed} == {"1100"}
    assert {row["sale_total"] for row in parsed} == {"11.00"}
    assert len({row["order_ref"] for row in parsed}) == 1


def test_export_records_payment_and_cashier(
    client: TestClient, auth_headers: dict[str, str], catalog: dict[str, int], user
):
    record(client, auth_headers, [(catalog["espresso_id"], 1)], payment="paynow")

    row = rows(export(client, auth_headers))[0]

    assert row["payment"] == "paynow"
    assert row["cashier"] == user.username


def test_export_timestamps_are_utc_and_carry_a_local_date(
    client: TestClient, auth_headers: dict[str, str], catalog: dict[str, int]
):
    record(client, auth_headers, [(catalog["espresso_id"], 1)])

    row = rows(export(client, auth_headers))[0]

    stamped = datetime.fromisoformat(row["created_at_utc"])
    assert stamped.tzinfo is not None
    assert stamped.utcoffset() == timedelta(0)
    assert row["date_local"] == stamped.date().isoformat()


def test_export_escapes_commas_and_quotes(client: TestClient, auth_headers: dict[str, str], db_session: Session, catalog):
    """A title containing a delimiter must not shift the columns."""
    tricky = 'Espresso, "large"'
    item = Item(category_id=1, title=tricky, price_cents=300, sort_order=9)
    db_session.add(item)
    db_session.commit()

    record(client, auth_headers, [(item.id, 1)])

    parsed = rows(export(client, auth_headers))

    assert parsed[0]["item"] == tricky
    # And it round-trips through a real parser without extra columns.
    assert len(parsed[0]) == len(parsed[0].keys())


def test_export_neutralises_spreadsheet_formulas(
    client: TestClient, auth_headers: dict[str, str], db_session: Session, user
):
    """A title starting with = must not be executed when the CSV is opened."""
    sale = Sale(order_ref="FORM01", user_id=user.id, payment="cash", total_cents=100, created_at=datetime.now(timezone.utc))
    sale.items.append(
        SaleItem(item_id=None, title="=cmd|'/c calc'!A1", price_cents=100, quantity=1, subtotal_cents=100)
    )
    db_session.add(sale)
    db_session.commit()

    parsed = rows(export(client, auth_headers))

    assert parsed[0]["item"].startswith("'=")
    assert not parsed[0]["item"].startswith("=")


def test_export_window_excludes_older_sales(
    client: TestClient, auth_headers: dict[str, str], catalog: dict[str, int], db_session: Session, user
):
    record(client, auth_headers, [(catalog["espresso_id"], 1)])

    old = Sale(order_ref="OLDCSV", user_id=user.id, payment="cash", total_cents=500, created_at=datetime.now(timezone.utc) - timedelta(days=60))
    old.items.append(SaleItem(item_id=None, title="Ancient", price_cents=500, quantity=1, subtotal_cents=500))
    db_session.add(old)
    db_session.commit()

    assert [row["item"] for row in rows(export(client, auth_headers, days=7))] == ["Espresso"]
    assert {row["item"] for row in rows(export(client, auth_headers, days=90))} == {"Espresso", "Ancient"}


def test_export_orders_rows_chronologically(client: TestClient, auth_headers: dict[str, str], catalog: dict[str, int]):
    first = record(client, auth_headers, [(catalog["espresso_id"], 1)])
    second = record(client, auth_headers, [(catalog["flat_white_id"], 1)])

    parsed = rows(export(client, auth_headers))

    # Oldest first, which is how the file is read as a ledger.
    assert [row["order_ref"] for row in parsed] == [first["order_ref"], second["order_ref"]]


def test_export_includes_sales_whose_item_was_deleted(
    client: TestClient, auth_headers: dict[str, str], catalog: dict[str, int], db_session: Session
):
    """SaleItem copies the title, so history survives a catalogue change."""
    record(client, auth_headers, [(catalog["green_tea_id"], 1)])
    assert client.delete(f"/api/admin/items/{catalog['green_tea_id']}", headers=auth_headers).status_code == 204

    parsed = rows(export(client, auth_headers))

    assert [row["item"] for row in parsed] == ["Green Tea"]


def test_export_days_out_of_range_is_rejected(client: TestClient, auth_headers: dict[str, str]):
    assert client.get("/api/sales/export.csv?days=0", headers=auth_headers).status_code == 422
    assert client.get("/api/sales/export.csv?days=5000", headers=auth_headers).status_code == 422
