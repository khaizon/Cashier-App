"""Recorded-sales reporting."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import Sale, SaleItem


def record(client: TestClient, headers: dict[str, str], lines: list[tuple[int, int]], payment: str = "cash") -> dict:
    response = client.post(
        "/api/sales",
        headers=headers,
        json={"payment": payment, "items": [{"item_id": item_id, "quantity": qty} for item_id, qty in lines]},
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_stats_require_authentication(client: TestClient):
    assert client.get("/api/sales/stats").status_code == 401


def test_stats_on_an_empty_catalog_are_all_zero(client: TestClient, auth_headers: dict[str, str]):
    body = client.get("/api/sales/stats", headers=auth_headers).json()

    assert body["today"] == {"revenue": 0.0, "transactions": 0, "items_sold": 0, "average_sale": 0.0}
    assert body["period"]["revenue"] == 0.0
    assert body["payments"] == []
    assert body["top_items"] == []
    # Every day in the window is still present, so the chart has no gaps.
    assert len(body["daily"]) == 14
    assert all(day["revenue"] == 0.0 for day in body["daily"])


def test_stats_daily_series_length_follows_days(client: TestClient, auth_headers: dict[str, str]):
    body = client.get("/api/sales/stats?days=7", headers=auth_headers).json()

    assert body["range"]["days"] == 7
    assert len(body["daily"]) == 7


def test_days_out_of_range_is_rejected(client: TestClient, auth_headers: dict[str, str]):
    assert client.get("/api/sales/stats?days=0", headers=auth_headers).status_code == 422
    assert client.get("/api/sales/stats?days=500", headers=auth_headers).status_code == 422


def test_totals_aggregate_recorded_sales(client: TestClient, auth_headers: dict[str, str], catalog: dict[str, int]):
    record(client, auth_headers, [(catalog["espresso_id"], 2), (catalog["flat_white_id"], 1)])  # 6.00 + 5.00
    record(client, auth_headers, [(catalog["espresso_id"], 1)])  # 3.00

    body = client.get("/api/sales/stats", headers=auth_headers).json()

    assert body["period"]["revenue"] == 14.0
    assert body["period"]["transactions"] == 2
    assert body["period"]["items_sold"] == 4
    assert body["period"]["average_sale"] == 7.0
    # No time travel involved: everything recorded just now is "today".
    assert body["today"] == body["period"]


def test_top_items_are_ranked_by_quantity(client: TestClient, auth_headers: dict[str, str], catalog: dict[str, int]):
    record(client, auth_headers, [(catalog["green_tea_id"], 1)])
    record(client, auth_headers, [(catalog["espresso_id"], 3)])
    record(client, auth_headers, [(catalog["flat_white_id"], 2)])

    body = client.get("/api/sales/stats", headers=auth_headers).json()

    assert [item["title"] for item in body["top_items"]] == ["Espresso", "Flat White", "Green Tea"]
    assert body["top_items"][0] == {"title": "Espresso", "quantity": 3, "revenue": 9.0}


def test_payment_split_revenue_sums_to_the_total(client: TestClient, auth_headers: dict[str, str], catalog: dict[str, int]):
    record(client, auth_headers, [(catalog["espresso_id"], 1)], payment="cash")  # 3.00
    record(client, auth_headers, [(catalog["flat_white_id"], 1)], payment="paynow")  # 5.00

    body = client.get("/api/sales/stats", headers=auth_headers).json()

    assert sum(entry["revenue"] for entry in body["payments"]) == body["period"]["revenue"]
    assert sum(entry["transactions"] for entry in body["payments"]) == body["period"]["transactions"]
    assert sum(entry["share"] for entry in body["payments"]) == 1.0
    # Sorted by revenue, biggest first.
    assert body["payments"][0]["payment"] == "paynow"


def test_sales_older_than_the_window_are_excluded(
    client: TestClient, auth_headers: dict[str, str], catalog: dict[str, int], db_session: Session, user
):
    recent = record(client, auth_headers, [(catalog["espresso_id"], 1)])  # 3.00, now

    # A sale from well before the window, inserted directly.
    old = Sale(order_ref="OLD001", user_id=user.id, payment="cash", total_cents=999, created_at=datetime.now(timezone.utc) - timedelta(days=90))
    old.items.append(SaleItem(item_id=None, title="Ancient", price_cents=999, quantity=1, subtotal_cents=999))
    db_session.add(old)
    db_session.commit()

    body = client.get("/api/sales/stats?days=7", headers=auth_headers).json()

    assert body["period"]["revenue"] == 3.0
    assert body["period"]["transactions"] == 1
    assert all(item["title"] != "Ancient" for item in body["top_items"])
    assert recent["total"] == 3.0

    # Widening the window picks it up again.
    wide = client.get("/api/sales/stats?days=120", headers=auth_headers).json()
    assert wide["period"]["revenue"] == 12.99
    assert wide["period"]["transactions"] == 2


def test_sale_without_a_catalog_item_still_counts(
    client: TestClient, auth_headers: dict[str, str], db_session: Session, user
):
    """Deleting an item later must not erase it from historical reporting."""
    sale = Sale(order_ref="GONE01", user_id=user.id, payment="cash", total_cents=250, created_at=datetime.now(timezone.utc))
    sale.items.append(SaleItem(item_id=None, title="Discontinued Cake", price_cents=250, quantity=1, subtotal_cents=250))
    db_session.add(sale)
    db_session.commit()

    body = client.get("/api/sales/stats", headers=auth_headers).json()

    assert body["today"]["revenue"] == 2.5
    assert body["top_items"] == [{"title": "Discontinued Cake", "quantity": 1, "revenue": 2.5}]


def test_recent_sales_listing_is_paginated(client: TestClient, auth_headers: dict[str, str], catalog: dict[str, int]):
    for _ in range(5):
        record(client, auth_headers, [(catalog["espresso_id"], 1)])

    assert len(client.get("/api/sales?limit=2", headers=auth_headers).json()) == 2
    assert len(client.get("/api/sales?limit=2&offset=4", headers=auth_headers).json()) == 1


def test_recorded_sale_appears_in_the_listing_with_its_lines(
    client: TestClient, auth_headers: dict[str, str], catalog: dict[str, int]
):
    created = record(client, auth_headers, [(catalog["espresso_id"], 2), (catalog["green_tea_id"], 1)])

    listed = client.get("/api/sales", headers=auth_headers).json()

    assert len(listed) == 1
    entry = listed[0]
    assert entry["order_ref"] == created["order_ref"]
    assert entry["total"] == 9.5
    assert {line["title"] for line in entry["items"]} == {"Espresso", "Green Tea"}
